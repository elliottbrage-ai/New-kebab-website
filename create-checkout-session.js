const Stripe = require("stripe");

const CATALOG = {
  kebab_tallerken: { name: "Kebabtallerken", unit_amount: 17900 },
  kebab_i_pita: { name: "Kebab i pita", unit_amount: 14900 },
  rull: { name: "Kebab rull", unit_amount: 16900 },
  falafel_rull: { name: "Falafel rull", unit_amount: 15900 },
  loaded_fries: { name: "Loaded fries", unit_amount: 13900 },
  drikke: { name: "Brus", unit_amount: 4500 },
};

function getSubtotal(cart) {
  let sum = 0;
  for (const item of cart) {
    const c = CATALOG[item.id];
    if (!c) continue;
    const qty = Math.max(0, Math.min(50, Number(item.qty) || 0));
    sum += c.unit_amount * qty;
  }
  return sum;
}

function getDeliveryFee(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= 35000 ? 0 : 4900;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { statusCode: 500, body: "Missing STRIPE_SECRET_KEY" };
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body = JSON.parse(event.body || "{}");
    const cart = Array.isArray(body.cart) ? body.cart : [];
    const customer = body.customer || {};

    const subtotal = getSubtotal(cart);
    if (subtotal <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Empty cart" }) };
    }

    const deliveryFee = getDeliveryFee(subtotal);

    const line_items = [];

    for (const item of cart) {
      const c = CATALOG[item.id];
      if (!c) continue;
      const qty = Math.max(0, Math.min(50, Number(item.qty) || 0));
      if (qty <= 0) continue;

      line_items.push({
        price_data: {
          currency: "nok",
          product_data: { name: c.name },
          unit_amount: c.unit_amount,
        },
        quantity: qty,
      });
    }

    if (deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: "nok",
          product_data: { name: "Levering" },
          unit_amount: deliveryFee,
        },
        quantity: 1,
      });
    }

    const origin = event.headers.origin || `https://${event.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
      metadata: {
        name: String(customer.name || ""),
        phone: String(customer.phone || ""),
        address: String(customer.address || ""),
        notes: String(customer.notes || ""),
      },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};

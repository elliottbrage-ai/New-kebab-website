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
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("Missing STRIPE_SECRET_KEY environment variable");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }),
      };
    }

    const stripe = require("stripe")(stripeKey, { apiVersion: "2022-11-15" });

    const body = JSON.parse(event.body);
    const { cart, customerInfo } = body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Cart is empty or invalid" }),
      };
    }

    const subtotal = getSubtotal(cart);
    const deliveryFee = getDeliveryFee(subtotal);
    const total = subtotal + deliveryFee;

    const lineItems = cart.map((item) => {
      const catalogItem = CATALOG[item.id];
      return {
        price_data: {
          currency: "nok",
          product_data: {
            name: catalogItem.name,
          },
          unit_amount: catalogItem.unit_amount,
        },
        quantity: Math.max(0, Math.min(50, Number(item.qty) || 0)),
      };
    });

    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: "nok",
          product_data: {
            name: "Levering",
          },
          unit_amount: deliveryFee,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${event.headers.referer}success.html`,
      cancel_url: `${event.headers.referer}cancel.html`,
      metadata: {
        customer_name: customerInfo?.name || "",
        customer_phone: customerInfo?.phone || "",
        customer_address: customerInfo?.address || "",
        cart_json: JSON.stringify(cart),
      },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    console.error("create-checkout-session error:", message);
    if (err && err.type) console.error("stripe_error_type:", err.type);
    if (err && err.code) console.error("stripe_error_code:", err.code);
    if (err && err.raw && err.raw.message) console.error("stripe_raw_message:", err.raw.message);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", detail: message }),
    };
  }
};

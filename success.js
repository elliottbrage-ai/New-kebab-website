function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatKr(amount) {
  return `${Math.round(amount)} kr`;
}

function paymentLabel(method) {
  if (method === "card") return "Kort (Stripe)";
  if (method === "cash") return "Kontant ved levering";
  return method;
}

function init() {
  document.getElementById("year").textContent = String(new Date().getFullYear());

  const receipt = document.getElementById("successReceipt");
  const fallback = document.getElementById("successFallback");

  try {
    const raw = localStorage.getItem("ek_last_order");
    if (!raw) {
      fallback.textContent = "Fant ingen ordre lokalt. Hvis betalingen gikk gjennom, har du fortsatt fått kvittering i Stripe.";
      return;
    }

    const order = JSON.parse(raw);
    const lines = (order.items || [])
      .map((x) => `${x.name} × ${x.qty} — ${formatKr(x.unitPrice * x.qty)}`)
      .join("\n");

    receipt.hidden = false;
    fallback.hidden = true;
    receipt.innerHTML = `
      <strong>Bestilling mottatt!</strong>
      <div class="muted small">Ordre: ${escapeHtml(order.orderId || "")}${order.createdAt ? ` · ${escapeHtml(new Date(order.createdAt).toLocaleString("no-NO"))}` : ""}</div>
      <div style="margin-top:10px; display:grid; gap:6px;">
        <div><strong>Navn:</strong> ${escapeHtml(order.customer?.name || "")}</div>
        <div><strong>Telefon:</strong> ${escapeHtml(order.customer?.phone || "")}</div>
        <div><strong>Adresse:</strong> ${escapeHtml(order.customer?.address || "")}</div>
        <div><strong>Betaling:</strong> ${escapeHtml(paymentLabel(order.paymentMethod || "card"))}</div>
        ${order.customer?.notes ? `<div><strong>Notat:</strong> ${escapeHtml(order.customer.notes)}</div>` : ""}
        <div style="margin-top:6px;"><strong>Varer</strong></div>
        <div class="muted small">${escapeHtml(lines).replaceAll("\n", "<br/>")}</div>
        <div style="margin-top:6px;"><strong>Total:</strong> ${escapeHtml(formatKr(order.total || 0))}</div>
      </div>
    `;
  } catch {
    fallback.textContent = "Kunne ikke lese ordredata. Hvis betalingen gikk gjennom, har du fortsatt fått kvittering i Stripe.";
  }
}

document.addEventListener("DOMContentLoaded", init);

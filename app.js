const menuItems = [
  {
    id: "kebab_tallerken",
    name: "Kebabtallerken",
    desc: "Kebabkjøtt, fries, salat, dressing. Klassikeren.",
    price: 179,
    tag: "Bestselger",
    allergens: ["Gluten (hvete)", "Melk"],
  },
  {
    id: "kebab_i_pita",
    name: "Kebab i pita",
    desc: "Kebabkjøtt i pita med salat og valgfri dressing.",
    price: 149,
    tag: "Rask",
    allergens: ["Gluten (hvete)", "Melk"],
  },
  {
    id: "rull",
    name: "Kebab rull",
    desc: "Stor rull med kebabkjøtt, salat og dressing.",
    price: 169,
    tag: "Stor",
    allergens: ["Gluten (hvete)", "Melk"],
  },
  {
    id: "falafel_rull",
    name: "Falafel rull",
    desc: "Sprø falafel, salat og tahini/dressing.",
    price: 159,
    tag: "Vegetar",
    allergens: ["Gluten (hvete)", "Sesam"],
  },
  {
    id: "loaded_fries",
    name: "Loaded fries",
    desc: "Fries toppet med kebabkjøtt, ost og chilisaus.",
    price: 139,
    tag: "Spicy",
    allergens: ["Melk"],
  },
  {
    id: "drikke",
    name: "Brus",
    desc: "Coca-Cola / Fanta / Sprite (0,5L).",
    price: 45,
    tag: "Kald",
    allergens: [],
  },
];

const cart = new Map();

let revealObserver = null;

function formatKr(amount) {
  return `${Math.round(amount)} kr`;
}

function getSubtotal() {
  let sum = 0;
  for (const [id, qty] of cart.entries()) {
    const item = menuItems.find((x) => x.id === id);
    if (!item) continue;
    sum += item.price * qty;
  }
  return sum;
}

function getDeliveryFee(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= 350 ? 0 : 49;
}

function setQty(id, qty) {
  if (qty <= 0) cart.delete(id);
  else cart.set(id, qty);
  renderAll();
}

function addToCart(id) {
  const current = cart.get(id) || 0;
  setQty(id, current + 1);
}

function renderMenu() {
  const grid = document.getElementById("menuGrid");
  grid.innerHTML = "";

  for (const item of menuItems) {
    const el = document.createElement("div");
    el.className = "card";
    const allergensText = Array.isArray(item.allergens) && item.allergens.length
      ? `Allergener: ${item.allergens.join(", ")}`
      : "";
    el.innerHTML = `
      <div class="card-title">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
        </div>
        <span class="tag">${escapeHtml(item.tag)}</span>
      </div>
      <p>${escapeHtml(item.desc)}</p>
      ${allergensText ? `<p class="muted small">${escapeHtml(allergensText)}</p>` : ""}
      <div class="price-row">
        <div class="price">${formatKr(item.price)}</div>
        <button class="icon-btn" type="button" data-add="${escapeHtml(item.id)}">Legg til</button>
      </div>
    `;
    grid.appendChild(el);

    if (revealObserver) {
      el.classList.add("reveal");
      revealObserver.observe(el);
    }
  }

  grid.querySelectorAll("button[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.getAttribute("data-add")));
  });
}

function renderCart() {
  const cartEl = document.getElementById("cart");
  cartEl.innerHTML = "";

  const entries = [...cart.entries()];
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Handlekurven er tom. Gå til menyen og legg til noe godt.";
    cartEl.appendChild(empty);
    return;
  }

  for (const [id, qty] of entries) {
    const item = menuItems.find((x) => x.id === id);
    if (!item) continue;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="muted small">${formatKr(item.price)} stk</div>
      </div>
      <div class="cart-controls">
        <button class="icon-btn" type="button" data-dec="${escapeHtml(id)}" aria-label="Fjern én">–</button>
        <div class="qty">${qty}</div>
        <button class="icon-btn" type="button" data-inc="${escapeHtml(id)}" aria-label="Legg til én">+</button>
      </div>
    `;
    cartEl.appendChild(row);
  }

  cartEl.querySelectorAll("button[data-inc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-inc");
      setQty(id, (cart.get(id) || 0) + 1);
    });
  });

  cartEl.querySelectorAll("button[data-dec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-dec");
      setQty(id, (cart.get(id) || 0) - 1);
    });
  });
}

function renderTotals() {
  const subtotal = getSubtotal();
  const delivery = getDeliveryFee(subtotal);
  const total = subtotal + delivery;

  document.getElementById("subtotal").textContent = formatKr(subtotal);
  document.getElementById("deliveryFee").textContent = formatKr(delivery);
  document.getElementById("total").textContent = formatKr(total);

  document.getElementById("miniCartTotal").textContent = formatKr(total);
}

function renderMiniCart() {
  const emptyEl = document.getElementById("miniCartEmpty");
  const itemsEl = document.getElementById("miniCartItems");

  itemsEl.innerHTML = "";

  const entries = [...cart.entries()];
  if (entries.length === 0) {
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;

  const top = entries
    .map(([id, qty]) => ({ id, qty, item: menuItems.find((x) => x.id === id) }))
    .filter((x) => x.item)
    .slice(0, 3);

  for (const { id, qty, item } of top) {
    const row = document.createElement("div");
    row.className = "mini-cart-row";
    row.innerHTML = `
      <span>${escapeHtml(item.name)} × ${qty}</span>
      <strong>${formatKr(item.price * qty)}</strong>
    `;
    row.addEventListener("click", () => {
      document.getElementById("order").scrollIntoView({ behavior: "smooth" });
    });
    itemsEl.appendChild(row);
  }

  if (entries.length > 3) {
    const more = document.createElement("div");
    more.className = "muted small";
    more.textContent = `+ ${entries.length - 3} flere vare(r)`;
    itemsEl.appendChild(more);
  }
}

function renderAll() {
  renderCart();
  renderTotals();
  renderMiniCart();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNominatimAddress(data) {
  const addr = (data && data.address) || {};

  const road = addr.road || addr.pedestrian || addr.footway || addr.cycleway || "";
  const houseNumber = addr.house_number || "";
  const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || "";
  const city = addr.city || addr.town || addr.village || addr.municipality || "";
  const postcode = addr.postcode || "";
  const county = addr.county || "";
  const country = addr.country || "";

  const line1 = [road, houseNumber].filter(Boolean).join(" ");
  const line2 = [postcode, city].filter(Boolean).join(" ");
  const line3 = [neighbourhood, county].filter(Boolean).join(", ");

  const pieces = [line1, line2, line3, country].filter(Boolean);
  const detailed = pieces.join(", ");

  const label = data && (data.name || data.display_name || "");

  return {
    label,
    detailed: detailed || label,
  };
}

function initPaymentUi() {
  const method = document.getElementById("paymentMethod");
  const cardFields = document.getElementById("cardFields");

  function sync() {
    if (cardFields) cardFields.hidden = true;
  }

  method.addEventListener("change", sync);
  sync();
}

function initCheckout() {
  const form = document.getElementById("checkoutForm");
  const receipt = document.getElementById("receipt");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const subtotal = getSubtotal();
    if (subtotal <= 0) {
      alert("Handlekurven er tom. Legg til noe fra menyen først.");
      return;
    }

    const formData = new FormData(form);
    const name = (formData.get("name") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const address = (formData.get("address") || "").toString().trim();
    const notes = (formData.get("notes") || "").toString().trim();
    const paymentMethod = (formData.get("paymentMethod") || "").toString();

    if (!name || !phone || !address || !paymentMethod) {
      alert("Fyll ut navn, telefon, adresse og betalingsmåte.");
      return;
    }

    const delivery = getDeliveryFee(subtotal);
    const total = subtotal + delivery;

    const orderId = `EK-${Math.random().toString(16).slice(2, 7).toUpperCase()}`;
    const now = new Date();

    const items = [...cart.entries()]
      .map(([id, qty]) => ({ item: menuItems.find((x) => x.id === id), qty }))
      .filter((x) => x.item)
      .map((x) => ({
        id: x.item.id,
        name: x.item.name,
        qty: x.qty,
        unitPrice: x.item.price,
      }));

    const orderForReceipt = {
      orderId,
      createdAt: now.toISOString(),
      paymentMethod,
      customer: { name, phone, address, notes },
      items,
      subtotal,
      delivery,
      total,
    };

    if (paymentMethod === "card") {
      if (window.location.protocol === "file:") {
        alert("Stripe-betaling krever at siden kjøres via Netlify/Vercel/Cloudflare (ikke file://). Deploy til Netlify (anbefalt) for å teste ekte betaling.");
        return;
      }

      const payBtn = document.getElementById("payBtn");
      if (payBtn) {
        payBtn.disabled = true;
        payBtn.textContent = "Sender til Stripe...";
      }

      localStorage.setItem("ek_last_order", JSON.stringify(orderForReceipt));

      cart.clear();
      renderAll();

      fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: items.map((x) => ({ id: x.id, qty: x.qty })),
          customer: { name, phone, address, notes },
        }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok || !data.url) {
            throw new Error(data.error || "Kunne ikke starte betaling");
          }
          window.location.href = data.url;
        })
        .catch(() => {
          alert("Kunne ikke starte Stripe-betaling. Sjekk at STRIPE_SECRET_KEY er satt i Netlify, og prøv igjen.");
        })
        .finally(() => {
          if (payBtn) {
            payBtn.disabled = false;
            payBtn.textContent = "Fullfør bestilling";
          }
        });

      return;
    }

    const lines = items.map((x) => `${x.name} × ${x.qty} — ${formatKr(x.unitPrice * x.qty)}`);

    receipt.hidden = false;
    receipt.innerHTML = `
      <strong>Bestilling mottatt!</strong>
      <div class="muted small">Ordre: ${escapeHtml(orderId)} · ${escapeHtml(now.toLocaleString("no-NO"))}</div>
      <div style="margin-top:10px; display:grid; gap:6px;">
        <div><strong>Navn:</strong> ${escapeHtml(name)}</div>
        <div><strong>Telefon:</strong> ${escapeHtml(phone)}</div>
        <div><strong>Adresse:</strong> ${escapeHtml(address)}</div>
        <div><strong>Betaling:</strong> ${escapeHtml(paymentLabel(paymentMethod))}</div>
        ${notes ? `<div><strong>Notat:</strong> ${escapeHtml(notes)}</div>` : ""}
        <div style="margin-top:6px;"><strong>Varer</strong></div>
        <div class="muted small">${escapeHtml(lines.join("\n")).replaceAll("\n", "<br/>")}</div>
        <div style="margin-top:6px;"><strong>Total:</strong> ${escapeHtml(formatKr(total))}</div>
      </div>
    `;

    localStorage.setItem("ek_last_order", JSON.stringify(orderForReceipt));

    cart.clear();
    renderAll();
    form.reset();
    initPaymentUi();

    receipt.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function paymentLabel(method) {
  if (method === "card") return "Kort (Stripe)";
  if (method === "cash") return "Kontant ved levering";
  return method;
}

function initMap() {
  const bergen = [60.39299, 5.32415];
  const mapResult = document.getElementById("mapResult");
  const usePointBtn = document.getElementById("usePointBtn");
  const addressInput = document.getElementById("address");
  const nameInput = document.getElementById("name");

  const map = L.map("deliveryMap", {
    center: bergen,
    zoom: 12,
    scrollWheelZoom: true,
  });

  const imagery = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Tiles © Esri",
    }
  );

  imagery.addTo(map);

  const labels = L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Labels © Esri",
      opacity: 0.85,
    }
  );
  labels.addTo(map);

  L.marker(bergen).addTo(map).bindPopup("Elliott's Kebab (pickup/utgangspunkt)");

  const deliveryRadiusMeters = 8000;
  const deliveryCircle = L.circle(bergen, {
    radius: deliveryRadiusMeters,
    color: "#ff4d2e",
    fillColor: "#ff4d2e",
    fillOpacity: 0.20,
    weight: 2,
    interactive: false,
  }).addTo(map);

  const hotSpots = [
    { name: "Bryggen", coords: [60.3971, 5.3246] },
    { name: "Nygård", coords: [60.3849, 5.3324] },
    { name: "Fyllingsdalen", coords: [60.3643, 5.3003] },
    { name: "Åsane", coords: [60.4669, 5.3226] },
  ];

  for (const spot of hotSpots) {
    L.circleMarker(spot.coords, {
      radius: 6,
      color: "#ffb020",
      fillColor: "#ffb020",
      fillOpacity: 0.85,
      weight: 2,
    })
      .addTo(map)
      .bindPopup(`Populært område: ${escapeHtml(spot.name)}`);
  }

  let selectedMarker = null;
  let selectedAddressText = "";

  function setResult(html) {
    if (!mapResult) return;
    mapResult.innerHTML = html;
  }

  async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) throw new Error("Reverse geocoding feilet");
    return res.json();
  }

  function inDeliveryRange(latlng) {
    const center = L.latLng(bergen[0], bergen[1]);
    const d = map.distance(center, latlng);
    return { ok: d <= deliveryRadiusMeters, distanceMeters: d };
  }

  function updateSelectedMarker(latlng) {
    if (selectedMarker) selectedMarker.remove();
    selectedMarker = L.marker(latlng, { draggable: true }).addTo(map);
    selectedMarker.bindPopup("Henter sted...").openPopup();
    selectedMarker.on("dragend", () => {
      const p = selectedMarker.getLatLng();
      handlePick(p, true);
    });
  }

  async function handlePick(latlng, fromDrag = false) {
    updateSelectedMarker(latlng);

    const { ok, distanceMeters } = inDeliveryRange(latlng);
    const km = (distanceMeters / 1000).toFixed(1);

    selectedAddressText = "";
    if (usePointBtn) usePointBtn.hidden = true;

    setResult(`
      <div class="status-pill ${ok ? "ok" : "bad"}">
        ${ok ? "Kan leveres" : "Utenfor leveringsområde"}
        <span class="muted" style="font-weight:800;">(${escapeHtml(km)} km)</span>
      </div>
      <div><strong>Koordinater:</strong> ${escapeHtml(latlng.lat.toFixed(5))}, ${escapeHtml(latlng.lng.toFixed(5))}</div>
      <div class="muted small">${fromDrag ? "(Flyttet punktet – oppdaterer...)" : "(Henter sted...)"}</div>
    `);

    try {
      const data = await reverseGeocode(latlng.lat, latlng.lng);
      const formatted = formatNominatimAddress(data);
      const place = formatted.label || "";
      const detailed = formatted.detailed || place;
      selectedAddressText = detailed;

      setResult(`
        <div class="status-pill ${ok ? "ok" : "bad"}">
          ${ok ? "Kan leveres" : "Utenfor leveringsområde"}
          <span class="muted" style="font-weight:800;">(${escapeHtml(km)} km)</span>
        </div>
        <div><strong>Adresse:</strong> ${detailed ? escapeHtml(detailed) : "Ukjent"}</div>
        ${place && detailed && place !== detailed ? `<div class="muted small"><strong>Sted:</strong> ${escapeHtml(place)}</div>` : ""}
        <div><strong>Koordinater:</strong> ${escapeHtml(latlng.lat.toFixed(5))}, ${escapeHtml(latlng.lng.toFixed(5))}</div>
      `);

      if (usePointBtn) {
        usePointBtn.hidden = !detailed;
        usePointBtn.disabled = !detailed;
      }

      if (selectedMarker) {
        selectedMarker
          .setPopupContent(`${ok ? "✅" : "❌"} ${escapeHtml(detailed || place || "Valgt punkt")}`)
          .openPopup();
      }
    } catch {
      setResult(`
        <div class="status-pill ${ok ? "ok" : "bad"}">
          ${ok ? "Kan leveres" : "Utenfor leveringsområde"}
          <span class="muted" style="font-weight:800;">(${escapeHtml(km)} km)</span>
        </div>
        <div><strong>Koordinater:</strong> ${escapeHtml(latlng.lat.toFixed(5))}, ${escapeHtml(latlng.lng.toFixed(5))}</div>
        <div class="muted small">Kunne ikke hente sted/adresse (nett/tilgang). Du kan fortsatt bruke koordinatene.</div>
      `);

      if (selectedMarker) {
        selectedMarker
          .setPopupContent(`${ok ? "✅" : "❌"} Valgt punkt`)
          .openPopup();
      }
    }
  }

  map.on("click", (e) => {
    handlePick(e.latlng, false);
  });

  if (usePointBtn) {
    usePointBtn.addEventListener("click", () => {
      if (!addressInput) return;
      if (!selectedAddressText) return;

      addressInput.value = selectedAddressText;
      if (nameInput && !nameInput.value) nameInput.focus();
      addressInput.scrollIntoView({ behavior: "smooth", block: "center" });
      addressInput.focus();
    });
  }
}

function initRevealAnimations() {
  const supportsReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (supportsReducedMotion) return;

  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      }
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  const candidates = document.querySelectorAll(
    "section.section, .hero-card, .badge, .panel, .map-wrap, .social-link, .map-result"
  );

  candidates.forEach((el) => {
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
}

function initButtonPressAnimations() {
  const supportsReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (supportsReducedMotion) return;

  const handler = (e) => {
    const target = e.target && e.target.closest && e.target.closest("button, a.btn");
    if (!target) return;
    target.classList.remove("press-anim");
    void target.offsetWidth;
    target.classList.add("press-anim");
  };

  document.addEventListener("click", handler);
}

function initHeaderScrollState() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initMeta() {
  document.getElementById("year").textContent = String(new Date().getFullYear());
}

function init() {
  initMeta();
  initHeaderScrollState();
  initRevealAnimations();
  initButtonPressAnimations();
  renderMenu();
  renderAll();
  initPaymentUi();
  initCheckout();
  initMap();
}

document.addEventListener("DOMContentLoaded", init);

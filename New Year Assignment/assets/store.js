// ============================================================
//  STORE.JS — Shared cart state & bag drawer logic
//  Used by both index.html and payment.html
// ============================================================

// ── Cart state (persisted to sessionStorage so payment.html can read it) ──
let cart = JSON.parse(sessionStorage.getItem("mono_cart") || "[]");
let bagDiscount = 0;

function saveCart() {
  sessionStorage.setItem("mono_cart", JSON.stringify(cart));
}

// ── Cart count badge ──
function updateCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = total;
  const lbl = document.getElementById("bag-count-label");
  if (lbl) lbl.textContent = total + (total === 1 ? " item" : " items");
}

// ── Color name lookup ──
function colorName(hex) {
  const names = {
    "#C5B8A8": "Sand",  "#2a2925": "Ebony",   "#7B8B72": "Sage",
    "#E8E0D4": "Ecru",  "#1a1a18": "Black",   "#8B6F47": "Tobacco",
    "#D4C4A8": "Oat",   "#888880": "Slate",   "#E8E5DE": "Natural",
  };
  return names[hex] || hex;
}

// ── Toast notification ──
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = 1;
  setTimeout(() => (t.style.opacity = 0), 2200);
}

// ── Add item to cart ──
function pushToCart(product, size, color, qty) {
  const key = product.id + "|" + size + "|" + color;
  const existing = cart.find((i) => i._key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      _key: key,
      id: product.id,
      name: product.name,
      price: product.price,
      size,
      color,
      colorName: colorName(color),
      image: product.images[0],
      qty,
    });
  }
  saveCart();
  updateCartCount();
}

// ── BAG DRAWER ──
function openBag() {
  renderBagDrawer();
  document.getElementById("bag-drawer").classList.add("bag-open");
  document.getElementById("bag-overlay").classList.add("bag-open");
  document.body.style.overflow = "hidden";
}

function closeBag() {
  document.getElementById("bag-drawer").classList.remove("bag-open");
  document.getElementById("bag-overlay").classList.remove("bag-open");
  document.body.style.overflow = "";
}

function renderBagDrawer() {
  const empty  = document.getElementById("bag-empty");
  const list   = document.getElementById("bag-items");
  const footer = document.getElementById("bag-footer");
  if (!empty) return;

  if (cart.length === 0) {
    empty.classList.remove("hidden");
    list.classList.add("hidden");
    footer.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.classList.remove("hidden");
  footer.classList.remove("hidden");

  list.innerHTML = cart.map((item) => `
    <div class="bag-item">
      <img class="bag-item-img" src="${item.image}" alt="${item.name}"/>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <p style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:400;line-height:1.2;margin:0 0 4px;">${item.name}</p>
          <p style="font-size:11px;color:#888;margin:0 0 4px;font-family:'DM Mono',monospace;">
            <span class="bag-color-dot" style="background:${item.color}"></span>${item.colorName}&nbsp;·&nbsp;${item.size}
          </p>
          <p style="font-size:13px;font-family:'DM Mono',monospace;margin:0;">$${item.price.toFixed(2)}</p>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
          <div style="display:flex;align-items:center;">
            <button class="bag-qty-btn" onclick="bagChangeQty('${item._key}', -1)">−</button>
            <span style="width:38px;text-align:center;font-size:13px;font-family:'DM Mono',monospace;">${item.qty}</span>
            <button class="bag-qty-btn" onclick="bagChangeQty('${item._key}', 1)">+</button>
          </div>
          <button class="bag-remove-btn" onclick="bagRemove('${item._key}')">Remove</button>
        </div>
      </div>
    </div>
  `).join("");

  renderBagTotals();
}

function bagChangeQty(key, delta) {
  const item = cart.find((i) => i._key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i._key !== key);
  saveCart();
  updateCartCount();
  renderBagDrawer();
}

function bagRemove(key) {
  cart = cart.filter((i) => i._key !== key);
  saveCart();
  updateCartCount();
  renderBagDrawer();
}

function renderBagTotals() {
  const subtotal    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = subtotal * bagDiscount;
  const shipping    = subtotal >= 150 ? 0 : 8;
  const total       = subtotal - discountAmt + shipping;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("bag-subtotal",      "$" + subtotal.toFixed(2));
  set("bag-shipping-cost", shipping === 0 ? "Free" : "$" + shipping.toFixed(2));
  set("bag-discount-val",  "−$" + discountAmt.toFixed(2));
  set("bag-total",         "$" + total.toFixed(2));
}

function applyBagPromo() {
  const code = document.getElementById("bag-promo").value.trim().toUpperCase();
  const msg  = document.getElementById("bag-promo-msg");
  const row  = document.getElementById("bag-discount-row");
  msg.style.display = "block";
  // ── Add/edit promo codes here ──
  const promoCodes = { "MONO10": 0.10, "WELCOME": 0.15 };
  if (promoCodes[code]) {
    bagDiscount = promoCodes[code];
    msg.style.color = "#7B8B72";
    msg.textContent = `✓ ${Math.round(bagDiscount * 100)}% discount applied`;
    row.classList.remove("hidden");
  } else {
    bagDiscount = 0;
    msg.style.color = "#c0392b";
    msg.textContent = "✗ Invalid promo code";
    row.classList.add("hidden");
  }
  renderBagTotals();
}

function bagGoCheckout() {
  closeBag();
  window.location.href = "payment.html";
}

// ── Init badge on page load ──
updateCartCount();

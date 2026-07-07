const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

let activeCategory = "Все";
let search = "";
let cart = {};

const catalogEl = document.getElementById("catalog");
const tabsEl = document.getElementById("categoryTabs");
const searchInput = document.getElementById("searchInput");
const cartButton = document.getElementById("cartButton");
const cartScreen = document.getElementById("cartScreen");
const backToCatalog = document.getElementById("backToCatalog");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

function money(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function categories() {
  return ["Все", ...new Set(window.PRODUCTS.map((p) => p.category))];
}

function renderTabs() {
  tabsEl.innerHTML = categories()
    .map(
      (cat) => `
        <button class="tab ${cat === activeCategory ? "active" : ""}" data-category="${cat}">
          ${cat}
        </button>
      `
    )
    .join("");
}

function filteredProducts() {
  return window.PRODUCTS.filter((p) => {
    const byCategory = activeCategory === "Все" || p.category === activeCategory;
    const bySearch = p.name.toLowerCase().includes(search.toLowerCase());
    return byCategory && bySearch;
  });
}

function renderCatalog() {
  const list = filteredProducts();

  if (!list.length) {
    catalogEl.innerHTML = `<div class="empty">Ничего не найдено</div>`;
    return;
  }

  catalogEl.innerHTML = list
    .map(
      (p) => `
        <article class="card">
          <img class="card-img" src="${p.image}" alt="${p.name}">
          <div class="card-body">
            <div class="card-title">${p.name}</div>
            <div class="price">Цена: ${money(p.price)}</div>
            <div class="add-row">
              <button class="plus js-add" data-id="${p.id}">+</button>
              <button class="add js-add" data-id="${p.id}">В корзину</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateCartCount();

  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  }
}

function removeFromCart(id) {
  if (!cart[id]) return;

  cart[id] -= 1;

  if (cart[id] <= 0) {
    delete cart[id];
  }

  renderCart();
  updateCartCount();
}

function updateCartCount() {
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  cartCount.textContent = count;
}

function cartList() {
  return Object.entries(cart)
    .map(([id, qty]) => {
      const product = window.PRODUCTS.find((p) => p.id === Number(id));
      return product ? { ...product, qty } : null;
    })
    .filter(Boolean);
}

function renderCart() {
  const items = cartList();

  if (!items.length) {
    cartItems.innerHTML = `<div class="empty">Корзина пустая</div>`;
    cartTotal.textContent = money(0);
    return;
  }

  cartItems.innerHTML = items
    .map(
      (item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}">
          <div>
            <div class="cart-name">${item.name}</div>
            <div class="cart-meta">${item.meta || ""}<br>Цена: ${money(item.price)}</div>
          </div>
          <div class="qty">
            <button class="js-minus" data-id="${item.id}">−</button>
            <span>${item.qty}</span>
            <button class="js-plus-cart" data-id="${item.id}">+</button>
          </div>
        </div>
      `
    )
    .join("");

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotal.textContent = money(total);
}

function openCart() {
  renderCart();
  cartScreen.classList.remove("hidden");
}

function closeCart() {
  cartScreen.classList.add("hidden");
}

function checkout() {
  const items = cartList();

  if (!items.length) {
    alert("Корзина пустая");
    return;
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const text =
    "Ваш заказ:\n\n" +
    items
      .map(
        (item) =>
          `• ${item.name} — ${item.qty} шт. × ${money(item.price)} = ${money(
            item.price * item.qty
          )}`
      )
      .join("\n") +
    `\n\nИтого: ${money(total)}`;

  const payload = JSON.stringify({
    type: "order",
    text,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
    total,
  });

fetch("/api/order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    chatId: tg?.initDataUnsafe?.user?.id,
    customer: tg?.initDataUnsafe?.user || null,
    text,
    items,
    total
  })
})
.then(res => res.json())
.then(data => {
  if (data.ok) {
    if (tg?.close) {
      tg.close();
    }
  } else {
    alert(data.error || "Ошибка");
  }
})
.catch(err => {
  alert(err.message);
});
}

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;

  activeCategory = btn.dataset.category;
  renderTabs();
  renderCatalog();
});

catalogEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".js-add");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  addToCart(id);

  if (btn.classList.contains("add")) {
    openCart();
  }
});

cartItems.addEventListener("click", (e) => {
  const minus = e.target.closest(".js-minus");
  const plus = e.target.closest(".js-plus-cart");

  if (minus) {
    removeFromCart(Number(minus.dataset.id));
  }

  if (plus) {
    addToCart(Number(plus.dataset.id));
    renderCart();
  }
});

searchInput.addEventListener("input", (e) => {
  search = e.target.value;
  renderCatalog();
});

cartButton.addEventListener("click", openCart);
backToCatalog.addEventListener("click", closeCart);
checkoutBtn.addEventListener("click", checkout);

renderTabs();
renderCatalog();
updateCartCount();

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

let activeCategory = "Все";
let search = "";
let currentProductId = null;
let cart = JSON.parse(localStorage.getItem("pelmeshkin_cart") || "{}");

const catalogScreen = document.getElementById("catalogScreen");
const productScreen = document.getElementById("productScreen");
const cartScreen = document.getElementById("cartScreen");
const checkoutScreen = document.getElementById("checkoutScreen");

const pageTitle = document.getElementById("pageTitle");
const catalogEl = document.getElementById("catalog");
const tabsEl = document.getElementById("categoryTabs");
const searchInput = document.getElementById("searchInput");
const productDetails = document.getElementById("productDetails");

const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutTotal = document.getElementById("checkoutTotal");

const backFromProduct = document.getElementById("backFromProduct");
const backToCatalog = document.getElementById("backToCatalog");
const backToCart = document.getElementById("backToCart");
const goToCheckoutBtn = document.getElementById("goToCheckoutBtn");
const checkoutBtn = document.getElementById("checkoutBtn");

const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const customerAddress = document.getElementById("customerAddress");
const customerComment = document.getElementById("customerComment");

function money(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function saveCart() {
  localStorage.setItem("pelmeshkin_cart", JSON.stringify(cart));
}

function showScreen(screen) {
  catalogScreen.classList.add("hidden");
  productScreen.classList.add("hidden");
  cartScreen.classList.add("hidden");
  checkoutScreen.classList.add("hidden");
  screen.classList.remove("hidden");
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
        <article class="card js-product" data-id="${p.id}">
          <img class="card-img" src="${p.image}" alt="${p.name}">
          <div class="card-body">
            <div class="card-title">${p.name}</div>
            <div class="price">Цена: ${money(p.price)}</div>
          </div>
        </article>
      `
    )
    .join("");
}

function openProduct(id) {
  const product = window.PRODUCTS.find((p) => p.id === Number(id));
  if (!product) return;

  currentProductId = product.id;
  pageTitle.textContent = product.name;

  const gallery = product.gallery?.length ? product.gallery : [product.image];

  productDetails.innerHTML = `
    <div class="product-page">
      <img class="product-main-img" src="${product.image}" alt="${product.name}">

      <div class="product-gallery">
        ${gallery
          .map(
            (img) => `
              <img class="product-thumb" src="${img}" alt="${product.name}" data-img="${img}">
            `
          )
          .join("")}
      </div>

      <h2>${product.name}</h2>
      <div class="product-price">${money(product.price)}</div>

      <div class="product-info">
        <p><b>Вес:</b> ${product.weight || "1 кг"}</p>
        <p><b>Описание:</b> ${product.description || "Домашний продукт ручной работы."}</p>
        <p><b>Состав:</b> ${product.ingredients || "Состав уточняется."}</p>
        <p><b>Условия хранения:</b> ${product.storage || "Хранить в морозильной камере."}</p>
      </div>

      <div class="product-actions">
      <button class="product-page-cart" id="productTopCartBtn">
  🛒 <span id="productCartCount">${Object.values(cart).reduce((s, q) => s + q, 0)}</span>
</button>
        <button class="product-add" id="productAddBtn">➕ Добавить в корзину</button>
        <button class="product-cart" id="productCartBtn">🛒 Перейти в корзину</button>
      </div>
    </div>
  `;

  showScreen(productScreen);
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartCount();

  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  }
}

function removeFromCart(id) {
  if (!cart[id]) return;
  cart[id] -= 1;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
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

function getTotal() {
  return cartList().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
  const items = cartList();

  if (!items.length) {
    cartItems.innerHTML = `<div class="empty">Корзина пустая</div>`;
    cartTotal.textContent = money(0);
    goToCheckoutBtn.disabled = true;
    return;
  }

  cartItems.innerHTML = items
    .map(
      (item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}">
          <div>
            <div class="cart-name">${item.name}</div>
            <div class="cart-meta">${item.weight || ""}<br>Цена: ${money(item.price)}</div>
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

  cartTotal.textContent = money(getTotal());
  goToCheckoutBtn.disabled = false;
}

function openCart() {
  pageTitle.textContent = "Каталог";
  renderCart();
  showScreen(cartScreen);
}

function openCheckout() {
  checkoutTotal.textContent = money(getTotal());
  validateCheckoutForm();
  showScreen(checkoutScreen);
}

function validateCheckoutForm() {
  const isValid =
    customerName.value.trim() &&
    customerPhone.value.trim() &&
    customerAddress.value.trim() &&
    customerComment.value.trim();

  checkoutBtn.disabled = !isValid;
}

function checkout() {
  const items = cartList();

  if (!items.length) {
    alert("Корзина пустая");
    return;
  }

  validateCheckoutForm();

  if (checkoutBtn.disabled) {
    alert("Заполните все поля");
    return;
  }

  const total = getTotal();

  const customer = {
    name: customerName.value.trim(),
    phone: customerPhone.value.trim(),
    address: customerAddress.value.trim(),
    comment: customerComment.value.trim(),
    telegram: tg?.initDataUnsafe?.user || null
  };

  const text =
    `Данные клиента:\n` +
    `Имя: ${customer.name}\n` +
    `Телефон: ${customer.phone}\n` +
    `Адрес: ${customer.address}\n` +
    `Комментарий: ${customer.comment}\n\n` +
    `Заказ:\n\n` +
    items
      .map(
        (item) =>
          `• ${item.name} — ${item.qty} шт. × ${money(item.price)} = ${money(item.price * item.qty)}`
      )
      .join("\n") +
    `\n\nИтого: ${money(total)}`;

  fetch("/api/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chatId: tg?.initDataUnsafe?.user?.id,
      customer,
      text,
      items,
      total
    })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.ok) {
        cart = {};
        saveCart();
        updateCartCount();
        if (tg?.close) tg.close();
      } else {
        alert(data.error || "Ошибка");
      }
    })
    .catch((err) => {
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
  const card = e.target.closest(".js-product");
  if (!card) return;

  openProduct(card.dataset.id);
});

productDetails.addEventListener("click", (e) => {
  const thumb = e.target.closest(".product-thumb");
  if (thumb) {
    document.querySelector(".product-main-img").src = thumb.dataset.img;
  }

 if (e.target.closest("#productAddBtn")) {
  addToCart(currentProductId);

  const addBtn = document.getElementById("productAddBtn");
  const productCartCount = document.getElementById("productCartCount");

  if (productCartCount) {
    productCartCount.textContent = Object.values(cart).reduce((s, q) => s + q, 0);
  }

  addBtn.textContent = "✅ Добавлено";
  setTimeout(() => {
    addBtn.textContent = "➕ Добавить в корзину";
  }, 900);
}

if (e.target.closest("#productTopCartBtn")) {
  openCart();
}

  if (e.target.closest("#productCartBtn")) {
    openCart();
  }
});

cartItems.addEventListener("click", (e) => {
  const minus = e.target.closest(".js-minus");
  const plus = e.target.closest(".js-plus-cart");

  if (minus) removeFromCart(Number(minus.dataset.id));
  if (plus) {
    addToCart(Number(plus.dataset.id));
    renderCart();
  }
});

searchInput.addEventListener("input", (e) => {
  search = e.target.value;
  renderCatalog();
});

[customerName, customerPhone, customerAddress, customerComment].forEach((field) => {
  field.addEventListener("input", validateCheckoutForm);
});

cartButton.addEventListener("click", openCart);
backFromProduct.addEventListener("click", () => {
  pageTitle.textContent = "Каталог";
  showScreen(catalogScreen);
});
backToCatalog.addEventListener("click", () => showScreen(catalogScreen));
backToCart.addEventListener("click", openCart);
goToCheckoutBtn.addEventListener("click", openCheckout);
checkoutBtn.addEventListener("click", checkout);

renderTabs();
renderCatalog();
updateCartCount();

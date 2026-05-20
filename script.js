// script.js – ClickCart e‑commerce functionality

// ========== PRODUCT DATA (with local image filenames) ==========
const products = [
  { id: 1, name: "Classic Leather Jacket", price: 129.99, category: "men", image: "images/men-jacket.jpg" },
  { id: 2, name: "Air Zoom Sneakers", price: 89.99, category: "men", image: "images/men-sneakers.jpg" },
  { id: 3, name: "Chrono Stainless Watch", price: 199.99, category: "men", image: "images/men-watch.jpg" },
  { id: 4, name: "Floral Maxi Dress", price: 79.99, category: "women", image: "images/women-dress.jpg" },
  { id: 5, name: "Leather Shoulder Bag", price: 149.99, category: "women", image: "images/women-bag.jpg" },
  { id: 6, name: "Stiletto Heels", price: 69.99, category: "women", image: "images/women-heels.jpg" },
  { id: 7, name: "Polarized Sunglasses", price: 49.99, category: "accessories", image: "images/sunglasses.jpg" },
  { id: 8, name: "Travel Laptop Backpack", price: 59.99, category: "accessories", image: "images/backpack.jpg" },
  { id: 9, name: "Minimalist Leather Wallet", price: 29.99, category: "accessories", image: "images/wallet.jpg" }
];

// ========== CART STATE ==========
let cart = [];            // each element: { id, quantity }
let currentCategory = "all";

// ========== DOM ELEMENTS ==========
const productsGrid = document.getElementById("products-grid");
const cartCountSpan = document.getElementById("cart-count");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const closeCartBtn = document.getElementById("close-cart");
const cartIconBtn = document.getElementById("cart-icon");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartTotalSpan = document.getElementById("cart-total-price");
const categoryBtns = document.querySelectorAll(".category-btn");
const checkoutBtn = document.getElementById("checkout-btn");

// ========== LOCALSTORAGE ==========
function saveCart() {
  localStorage.setItem("clickcart_cart", JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem("clickcart_cart");
  cart = saved ? JSON.parse(saved) : [];
  updateCartUI();
}

// ========== RENDER PRODUCTS (with category filtering) ==========
function renderProducts() {
  let filteredProducts = products;
  if (currentCategory !== "all") {
    filteredProducts = products.filter(p => p.category === currentCategory);
  }

  productsGrid.innerHTML = "";
  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute("data-category", product.category);
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-desc">${getProductDesc(product.id)}</p>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <button class="add-to-cart" data-id="${product.id}">
          <i class="fas fa-cart-plus"></i> Add to cart
        </button>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  // attach add-to-cart listeners
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      addToCart(id);
    });
  });
}

// Helper: product descriptions
function getProductDesc(id) {
  const descMap = {
    1: "Premium genuine leather, slim fit.",
    2: "Breathable mesh, cushioned sole.",
    3: "Water-resistant, analog display.",
    4: "Lightweight cotton, perfect for summer.",
    5: "Elegant design, multiple compartments.",
    6: "Comfortable insole, non-slip sole.",
    7: "UV400 protection, unisex frame.",
    8: "Water-resistant, 15.6\" compartment.",
    9: "RFID blocking, 6 card slots."
  };
  return descMap[id] || "Great product!";
}

// ========== CART FUNCTIONS ==========
function addToCart(productId) {
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  updateCartUI();
  saveCart();
  animateCartIcon();
}

function updateCartUI() {
  // update cart badge
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountSpan.innerText = totalItems;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Cart is empty 🛒</div>';
    cartTotalSpan.innerText = "$0.00";
    return;
  }

  let cartHTML = "";
  let total = 0;

  cart.forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.id);
    if (!product) return;
    const itemTotal = product.price * cartItem.quantity;
    total += itemTotal;

    cartHTML += `
      <div class="cart-item" data-id="${cartItem.id}">
        <img src="${product.image}" class="cart-item-img" alt="${product.name}">
        <div class="cart-item-details">
          <div class="cart-item-title">${product.name}</div>
          <div class="cart-item-price">$${product.price.toFixed(2)} each</div>
          <div class="quantity-control">
            <button class="qty-decr" data-id="${cartItem.id}">-</button>
            <span>${cartItem.quantity}</span>
            <button class="qty-incr" data-id="${cartItem.id}">+</button>
          </div>
        </div>
        <button class="remove-item" data-id="${cartItem.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = cartHTML;
  cartTotalSpan.innerText = `$${total.toFixed(2)}`;

  // attach quantity and remove events
  document.querySelectorAll(".qty-decr").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      changeQuantity(id, -1);
    });
  });
  document.querySelectorAll(".qty-incr").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      changeQuantity(id, 1);
    });
  });
  document.querySelectorAll(".remove-item").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      removeItemCompletely(id);
    });
  });
}

function changeQuantity(productId, delta) {
  const index = cart.findIndex(item => item.id === productId);
  if (index === -1) return;
  const newQty = cart[index].quantity + delta;
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = newQty;
  }
  updateCartUI();
  saveCart();
}

function removeItemCompletely(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
  saveCart();
}

function animateCartIcon() {
  const icon = document.querySelector(".cart-icon-btn");
  if (icon) {
    icon.style.transform = "scale(1.1)";
    setTimeout(() => { icon.style.transform = ""; }, 200);
  }
}

// ========== CART DRAWER ==========
function openCartDrawer() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("active");
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("active");
}

// ========== CATEGORY FILTERING ==========
function setActiveCategory(category) {
  currentCategory = category;
  categoryBtns.forEach(btn => {
    if (btn.getAttribute("data-category") === category) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  renderProducts();
}

// ========== CHECKOUT (mock) ==========
function handleCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty! Add some items first.");
  } else {
    const total = cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.id);
      return sum + (product.price * item.quantity);
    }, 0);
    alert(`✨ Mock Checkout ✨\nTotal: $${total.toFixed(2)}\n(frontend demo – no payment taken)`);
  }
}

// ========== EVENT LISTENERS ==========
cartIconBtn?.addEventListener("click", openCartDrawer);
closeCartBtn?.addEventListener("click", closeCartDrawer);
cartOverlay?.addEventListener("click", closeCartDrawer);
checkoutBtn?.addEventListener("click", handleCheckout);

categoryBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const category = btn.getAttribute("data-category");
    setActiveCategory(category);
  });
});

// ========== INITIALIZE ==========
function init() {
  loadCart();
  renderProducts();
}

init();
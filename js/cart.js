import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const cartContainer = document.getElementById("cartContainer");
const cartTotal = document.getElementById("cartTotal");

const fallbackImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="180">
      <rect width="100%" height="100%" fill="#d1d5db"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#374151" font-size="20">
        No Image
      </text>
    </svg>
  `);

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

async function getLatestStock(productId) {
  const productRef = doc(db, "products", productId);
  const snap = await getDoc(productRef);

  if (!snap.exists()) return 0;

  return Number(snap.data().stock || 0);
}

async function renderCart() {
  const cart = getCart();
  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = "<p style='padding:20px;'>Your cart is empty.</p>";
    cartTotal.innerText = "Total: ₹0";
    return;
  }

  let total = 0;

  const enrichedCart = await Promise.all(
    cart.map(async (item) => {
      const availableStock = await getLatestStock(item.id);
      return { ...item, availableStock };
    })
  );

  enrichedCart.forEach((item, index) => {
    total += Number(item.price) * Number(item.qty);

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <img src="${item.imageUrl || fallbackImage}" alt="${item.name}">
      <div class="cart-info">
        <h3>${item.name}</h3>
        <p>Price: ₹${item.price}</p>
        <p>Quantity: ${item.qty}</p>
        <p>Available Stock: ${item.availableStock}</p>
        <div class="cart-actions">
          <button onclick="increaseQty(${index})">+</button>
          <button onclick="decreaseQty(${index})">-</button>
          <button onclick="removeItem(${index})">Remove</button>
        </div>
      </div>
    `;

    cartContainer.appendChild(div);
  });

  cartTotal.innerText = `Total: ₹${total}`;
}

window.increaseQty = async function (index) {
  const cart = getCart();
  const item = cart[index];
  const latestStock = await getLatestStock(item.id);

  if (item.qty >= latestStock) {
    alert(`Only ${latestStock} items left for ${item.name}`);
    return;
  }

  item.qty += 1;
  saveCart(cart);
  renderCart();
};

window.decreaseQty = function (index) {
  const cart = getCart();

  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
  } else {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
};

window.removeItem = function (index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
};

renderCart();
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const featuredProductsContainer = document.getElementById("featuredProductsContainer");
const bestSellingContainer = document.getElementById("bestSellingContainer");

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

function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || "",
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Product added to cart");
}

function renderProductCards(products, container) {
  if (!container) return;

  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>No products available.</p>";
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${product.imageUrl || fallbackImage}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Price:</strong> ₹${product.price}</p>
      <p><strong>Stock:</strong> ${product.stock}</p>
      <a href="product-details.html?id=${product.id}">View Details</a>
      <button data-id="${product.id}">Add to Cart</button>
    `;

    container.appendChild(card);
  });

  const buttons = container.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const product = products.find((p) => p.id === id);
      if (product) addToCart(product);
    });
  });
}

async function loadHomeProducts() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    const allProducts = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));

    const featuredProducts = [...allProducts]
      .sort((a, b) => Number(b.createdAt?.seconds || 0) - Number(a.createdAt?.seconds || 0))
      .slice(0, 4);

    const bestSellingProducts = [...allProducts]
      .sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0))
      .slice(0, 4);

    renderProductCards(featuredProducts, featuredProductsContainer);
    renderProductCards(bestSellingProducts, bestSellingContainer);
  } catch (error) {
    console.error("HOME PRODUCTS ERROR:", error);

    if (featuredProductsContainer) {
      featuredProductsContainer.innerHTML = "<p>Error loading featured products.</p>";
    }

    if (bestSellingContainer) {
      bestSellingContainer.innerHTML = "<p>Error loading best selling products.</p>";
    }
  }
}

loadHomeProducts();
import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const productDetailsContainer = document.getElementById("productDetailsContainer");
const recommendationContainer = document.getElementById("recommendationContainer");

const fallbackImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="350">
      <rect width="100%" height="100%" fill="#d1d5db"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#374151" font-size="28">
        No Image
      </text>
    </svg>
  `);

function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

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

function renderProductDetails(product) {
  productDetailsContainer.innerHTML = `
    <div class="details-card">
      <img src="${product.imageUrl || fallbackImage}" alt="${product.name}">
      <div class="details-info">
        <h2>${product.name}</h2>
        <p><strong>Category:</strong> ${product.category}</p>
        <p><strong>Price:</strong> ₹${product.price}</p>
        <p><strong>Stock:</strong> ${product.stock}</p>
        <p><strong>GST:</strong> ${product.gst || 0}%</p>
        <p><strong>Description:</strong> ${product.description || "No description available."}</p>
        <button id="detailsAddToCartBtn" class="btn">Add to Cart</button>
      </div>
    </div>
  `;

  document.getElementById("detailsAddToCartBtn").addEventListener("click", () => {
    addToCart(product);
  });
}

function renderRecommendations(products) {
  recommendationContainer.innerHTML = "";

  if (products.length === 0) {
    recommendationContainer.innerHTML = "<p>No recommendations found.</p>";
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
      <a href="product-details.html?id=${product.id}">View Details</a>
      <button data-id="${product.id}">Add to Cart</button>
    `;

    recommendationContainer.appendChild(card);
  });

  const buttons = recommendationContainer.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const product = products.find((p) => p.id === id);
      if (product) addToCart(product);
    });
  });
}

async function loadProductDetails() {
  const productId = getProductIdFromURL();

  if (!productId) {
    productDetailsContainer.innerHTML = "<p>Product ID not found.</p>";
    return;
  }

  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      productDetailsContainer.innerHTML = "<p>Product not found.</p>";
      return;
    }

    const currentProduct = {
      id: productSnap.id,
      ...productSnap.data()
    };

    renderProductDetails(currentProduct);

    const allProductsSnap = await getDocs(collection(db, "products"));
    const allProducts = allProductsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    const currentCategory = (currentProduct.category || "").trim().toLowerCase();

    let recommendations = allProducts
     .filter((p) => {
      const productCategory = (p.category || "").trim().toLowerCase();
      return p.id !== currentProduct.id && productCategory === currentCategory;
  })
     .sort((a, b) => {
      const diffA = Math.abs(Number(a.price) - Number(currentProduct.price));
      const diffB = Math.abs(Number(b.price) - Number(currentProduct.price));
      return diffA - diffB;
  })
   .slice(0, 4);

    if (recommendations.length === 0) {
      recommendations = allProducts
       .filter((p) => p.id !== currentProduct.id)
       .sort((a, b) => {
        const diffA = Math.abs(Number(a.price) - Number(currentProduct.price));
        const diffB = Math.abs(Number(b.price) - Number(currentProduct.price));
        return diffA - diffB;
     })
    .slice(0, 4);
 }

    renderRecommendations(recommendations);
  } catch (error) {
    console.error(error);
    productDetailsContainer.innerHTML = "<p>Error loading product details.</p>";
  }
}

loadProductDetails();
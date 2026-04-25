import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const productContainer = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");
const searchMsg = document.getElementById("searchMsg");
const suggestionBox = document.getElementById("suggestionBox");

let allProducts = [];

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

function normalizeText(text) {
  return (text || "").toString().trim().toLowerCase();
}

function renderProducts(products) {
  productContainer.innerHTML = "";

  if (products.length === 0) {
    productContainer.innerHTML = "<p style='padding:20px;'>No products found.</p>";
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

    productContainer.appendChild(card);
  });

  const buttons = document.querySelectorAll(".product-card button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

function addToCart(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find((item) => item.id === productId);

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

function levenshtein(a, b) {
  const matrix = [];
  const str1 = normalizeText(a);
  const str2 = normalizeText(b);

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function findBestSuggestion(query) {
  const names = allProducts.map((p) => p.name);
  let bestMatch = null;
  let bestScore = Infinity;

  for (const name of names) {
    const score = levenshtein(query, name);
    if (score < bestScore) {
      bestScore = score;
      bestMatch = name;
    }
  }

  if (bestScore <= 3) {
    return bestMatch;
  }

  return null;
}

function searchProducts(query) {
  const value = normalizeText(query);

  if (!value) {
    searchMsg.innerText = "";
    suggestionBox.innerHTML = "";
    renderProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter((product) => {
    const name = normalizeText(product.name);
    const category = normalizeText(product.category);

    return name.includes(value) || category.includes(value);
  });

  if (filtered.length > 0) {
    searchMsg.innerText = `${filtered.length} product(s) found`;
    suggestionBox.innerHTML = "";
    renderProducts(filtered);
    return;
  }

  const suggestion = findBestSuggestion(value);

  if (suggestion) {
    searchMsg.innerText = "No exact match found";
    suggestionBox.innerHTML = `
      <button class="suggestion-btn" id="suggestionBtn">
        Did you mean: ${suggestion} ?
      </button>
    `;

    document.getElementById("suggestionBtn").addEventListener("click", () => {
      searchInput.value = suggestion;
      searchProducts(suggestion);
    });
  } else {
    searchMsg.innerText = "No product found";
    suggestionBox.innerHTML = "";
  }

  renderProducts([]);
}

async function loadProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    allProducts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    renderProducts(allProducts);
  } catch (error) {
    console.error(error);
    productContainer.innerHTML = "<p style='padding:20px;'>Error loading products.</p>";
  }
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchProducts(searchInput.value);
  });
}

loadProducts();
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

function generateProductDescription(name, category, price, gst) {
  const cleanName = (name || "").trim();
  const cleanCategory = (category || "").trim();

  if (!cleanName || !cleanCategory) {
    return "Please enter product name and category first.";
  }

  let qualityLine = "";
  let useLine = "";
  let valueLine = "";

  const categoryLower = cleanCategory.toLowerCase();

  if (categoryLower.includes("grocery") || categoryLower.includes("food")) {
    qualityLine = `${cleanName} is a quality ${cleanCategory.toLowerCase()} product suitable for daily household needs.`;
    useLine = `It is carefully selected to offer freshness, reliability, and convenience for regular use.`;
  } else if (
    categoryLower.includes("soap") ||
    categoryLower.includes("shampoo") ||
    categoryLower.includes("personal")
  ) {
    qualityLine = `${cleanName} is a trusted personal care product designed for regular everyday use.`;
    useLine = `It helps provide dependable performance, convenience, and a better user experience.`;
  } else if (categoryLower.includes("electronics")) {
    qualityLine = `${cleanName} is a useful electronic product built for practical daily usage and convenience.`;
    useLine = `It offers reliable functionality and is suitable for customers looking for value and performance.`;
  } else {
    qualityLine = `${cleanName} is a reliable ${cleanCategory.toLowerCase()} product designed to meet everyday customer needs.`;
    useLine = `It offers practical usability, dependable quality, and a smooth buying experience.`;
  }

  if (price > 0) {
    valueLine = `Available at an affordable price of ₹${price}, it delivers excellent value for money.`;
  } else {
    valueLine = `It is positioned as a value-focused product for regular customer needs.`;
  }

  const gstLine = gst >= 0 ? `Applicable GST: ${gst}%.` : "";

  return `${qualityLine} ${useLine} ${valueLine} ${gstLine}`.trim();
}

const generateDescBtn = document.getElementById("generateDescBtn");

if (generateDescBtn) {
  generateDescBtn.addEventListener("click", () => {
    const name = document.getElementById("name")?.value.trim() || "";
    const category = document.getElementById("category")?.value.trim() || "";
    const price = Number(document.getElementById("price")?.value || 0);
    const gst = Number(document.getElementById("gst")?.value || 0);
    const descriptionField = document.getElementById("description");

    if (!descriptionField) return;

    const generatedText = generateProductDescription(name, category, price, gst);
    descriptionField.value = generatedText;
  });
}

console.log("ADMIN JS V20 LOADED");
let salesChartInstance = null;
let stockChartInstance = null;
/* ---------------- ADD PRODUCT ---------------- */
const saveProductBtn = document.getElementById("saveProductBtn");

if (saveProductBtn) {
  saveProductBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const category = document.getElementById("category").value.trim();
    const price = Number(document.getElementById("price").value);
    const stock = Number(document.getElementById("stock").value);
    const gst = Number(document.getElementById("gst").value);
    const imageUrl = document.getElementById("imageUrl").value.trim();
    const description = document.getElementById("description").value.trim();
    const msg = document.getElementById("msg");

    if (!name || !category || !Number.isFinite(price) || price <= 0 || stock < 0 || gst < 0) {
      msg.innerText = "Please fill all required fields correctly";
      return;
    }

    msg.innerText = "Saving product...";

    try {
      await addDoc(collection(db, "products"), {
        name,
        category,
        price,
        stock,
        gst,
        imageUrl,
        description,
        soldCount: 0,
        createdAt: serverTimestamp()
      });

      msg.innerText = "Product saved successfully";

      document.getElementById("name").value = "";
      document.getElementById("category").value = "";
      document.getElementById("price").value = "";
      document.getElementById("stock").value = "";
      document.getElementById("gst").value = "";
      document.getElementById("imageUrl").value = "";
      document.getElementById("description").value = "";
    } catch (error) {
      console.error("ADD PRODUCT ERROR:", error);
      msg.innerText = error.message;
    }
  });
}

function renderDashboardCharts(products) {
  const salesCanvas = document.getElementById("salesChart");
  const stockCanvas = document.getElementById("stockChart");

  if (!salesCanvas || !stockCanvas || typeof Chart === "undefined") return;

  const topProducts = [...products]
    .sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0))
    .slice(0, 5);

  const salesLabels = topProducts.map((p) => p.name);
  const salesData = topProducts.map((p) => Number(p.soldCount || 0));

  const inStock = products.filter((p) => Number(p.stock || 0) > 5).length;
  const lowStock = products.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5).length;
  const outOfStock = products.filter((p) => Number(p.stock || 0) === 0).length;

  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  if (stockChartInstance) {
    stockChartInstance.destroy();
  }

  salesChartInstance = new Chart(salesCanvas, {
    type: "bar",
    data: {
      labels: salesLabels,
      datasets: [
        {
          label: "Units Sold",
          data: salesData,
          backgroundColor: [
            "#2563eb",
            "#3b82f6",
            "#60a5fa",
            "#93c5fd",
            "#bfdbfe"
          ]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  stockChartInstance = new Chart(stockCanvas, {
    type: "pie",
    data: {
      labels: ["In Stock", "Low Stock", "Out of Stock"],
      datasets: [
        {
          data: [inStock, lowStock, outOfStock],
          backgroundColor: ["#16a34a", "#f59e0b", "#dc2626"]
        }
      ]
    },
    options: {
      responsive: true
    }
  });
}

/* ---------------- DASHBOARD ---------------- */
async function loadDashboard() {
  const totalProductsEl = document.getElementById("totalProducts");
  const totalOrdersEl = document.getElementById("totalOrders");
  const totalRevenueEl = document.getElementById("totalRevenue");
  const lowStockCountEl = document.getElementById("lowStockCount");
  const mostSoldProductEl = document.getElementById("mostSoldProduct");
  const topProductsList = document.getElementById("topProductsList");
  const lowStockList = document.getElementById("lowStockList");
  const insightSummary = document.getElementById("insightSummary");

  if (!totalProductsEl) return;

  try {
    const productSnapshot = await getDocs(collection(db, "products"));
    const orderSnapshot = await getDocs(collection(db, "orders"));

    const products = productSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    const orders = orderSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    totalProductsEl.innerText = products.length;
    totalOrdersEl.innerText = orders.length;

    let totalRevenue = 0;
    orders.forEach((order) => {
      totalRevenue += Number(order.totalAmount || 0);
    });
    totalRevenueEl.innerText = `₹${totalRevenue}`;

    const lowStockProducts = products.filter((p) => Number(p.stock || 0) <= 5);
    lowStockCountEl.innerText = lowStockProducts.length;

    const sortedBySold = [...products].sort(
      (a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0)
    );

    if (sortedBySold.length > 0) {
      mostSoldProductEl.innerText = `${sortedBySold[0].name} (${sortedBySold[0].soldCount || 0} sold)`;
    } else {
      mostSoldProductEl.innerText = "No products found";
    }

    if (topProductsList) {
      topProductsList.innerHTML = "";
      if (sortedBySold.length === 0) {
        topProductsList.innerHTML = "<li>No product data available</li>";
      } else {
        sortedBySold.slice(0, 3).forEach((product) => {
          const li = document.createElement("li");
          li.textContent = `${product.name} - ${product.soldCount || 0} sold`;
          topProductsList.appendChild(li);
        });
      }
    }

    if (lowStockList) {
      lowStockList.innerHTML = "";
      if (lowStockProducts.length === 0) {
        lowStockList.innerHTML = "<li>No low stock products</li>";
      } else {
        lowStockProducts.forEach((product) => {
          const li = document.createElement("li");
          li.textContent = `${product.name} - only ${product.stock} left`;
          lowStockList.appendChild(li);
        });
      }
    }

    if (insightSummary) {
      const bestSeller = sortedBySold.length > 0 ? sortedBySold[0].name : "No product";
      const lowStockText =
        lowStockProducts.length > 0
          ? `${lowStockProducts.length} product(s) need restocking`
          : "stock levels look healthy";

      insightSummary.innerText =
        `Top-selling product is ${bestSeller}. Total revenue is ₹${totalRevenue}. Currently ${lowStockText}.`;
        renderDashboardCharts(products);
    }
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    totalProductsEl.innerText = "Error";
    totalOrdersEl.innerText = "Error";
    totalRevenueEl.innerText = "Error";
    lowStockCountEl.innerText = "Error";
    if (mostSoldProductEl) mostSoldProductEl.innerText = "Error loading data";
    if (topProductsList) topProductsList.innerHTML = "<li>Error loading data</li>";
    if (lowStockList) lowStockList.innerHTML = "<li>Error loading data</li>";
    if (insightSummary) insightSummary.innerText = "Dashboard data could not be loaded.";
  }
}

/* ---------------- ORDERS PAGE ---------------- */
async function loadOrders() {
  const ordersContainer = document.getElementById("ordersContainer");
  if (!ordersContainer) return;

  try {
    const orderSnapshot = await getDocs(collection(db, "orders"));
    const orders = orderSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    if (orders.length === 0) {
      ordersContainer.innerHTML = "<p>No orders found.</p>";
      return;
    }

    ordersContainer.innerHTML = "";

    orders.reverse().forEach((order) => {
      const div = document.createElement("div");
      div.className = "order-card";

      let itemList = "";
      (order.items || []).forEach((item) => {
        itemList += `<li>${item.name} - Qty: ${item.qty} - ₹${item.price}</li>`;
      });

      div.innerHTML = `
        <h3>Invoice: ${order.invoiceNo || "N/A"}</h3>
        <p><strong>Customer:</strong> ${order.customerName || "-"}</p>
        <p><strong>Phone:</strong> ${order.phone || "-"}</p>
        <p><strong>Address:</strong> ${order.address || "-"}</p>
        <p><strong>Total:</strong> ₹${order.totalAmount || 0}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemList || "<li>No items</li>"}</ul>

        <div class="order-status-box">
          <label><strong>Status:</strong></label>
          <select data-id="${order.id}" class="statusSelect">
            <option value="Placed" ${order.status === "Placed" ? "selected" : ""}>Placed</option>
            <option value="Processing" ${order.status === "Processing" ? "selected" : ""}>Processing</option>
            <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
            <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
          </select>
          <button data-id="${order.id}" class="updateStatusBtn">Update Status</button>
        </div>
      `;

      ordersContainer.appendChild(div);
    });

    const updateButtons = document.querySelectorAll(".updateStatusBtn");

    updateButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const orderId = button.dataset.id;
        const select = document.querySelector(`.statusSelect[data-id="${orderId}"]`);
        const newStatus = select.value;

        try {
          await updateDoc(doc(db, "orders", orderId), {
            status: newStatus
          });

          alert("Order status updated successfully");
          loadOrders();
          loadDashboard();
        } catch (error) {
          console.error("UPDATE ORDER STATUS ERROR:", error);
          alert("Error updating order status");
        }
      });
    });
  } catch (error) {
    console.error("LOAD ORDERS ERROR:", error);
    ordersContainer.innerHTML = "<p>Error loading orders.</p>";
  }
}

/* ---------------- MANAGE PRODUCTS PAGE ---------------- */
async function loadAdminProducts() {
  const adminProductsContainer = document.getElementById("adminProductsContainer");
  if (!adminProductsContainer) return;

  console.log("Loading admin products...");

  try {
    const productSnapshot = await getDocs(collection(db, "products"));
    const products = productSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    console.log("Admin products count:", products.length);

    if (products.length === 0) {
      adminProductsContainer.innerHTML = "<p>No products found.</p>";
      return;
    }

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

    adminProductsContainer.innerHTML = "";

    products.forEach((product) => {
      const div = document.createElement("div");
      div.className = "admin-product-card";

      div.innerHTML = `
        <img src="${product.imageUrl || fallbackImage}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p><strong>Category:</strong> ${product.category || "-"}</p>
        <p><strong>Price:</strong> ₹${product.price || 0}</p>
        <p><strong>Stock:</strong> ${product.stock || 0}</p>
        <p><strong>Sold:</strong> ${product.soldCount || 0}</p>
        <div class="admin-product-actions">
          <a href="edit-product.html?id=${product.id}">Edit</a>
          <button class="delete-product-btn" data-id="${product.id}">Delete</button>
        </div>
      `;

      adminProductsContainer.appendChild(div);
    });

    const deleteButtons = adminProductsContainer.querySelectorAll(".delete-product-btn");

    deleteButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const productId = button.dataset.id;
        const confirmDelete = confirm("Are you sure you want to delete this product?");

        if (!confirmDelete) return;

        try {
          await deleteDoc(doc(db, "products", productId));
          loadAdminProducts();
          loadDashboard();
        } catch (error) {
          console.error("DELETE PRODUCT ERROR:", error);
          alert("Error deleting product");
        }
      });
    });
  } catch (error) {
    console.error("LOAD ADMIN PRODUCTS ERROR:", error);
    adminProductsContainer.innerHTML = "<p>Error loading products.</p>";
  }
}

/* ---------------- EDIT PRODUCT PAGE ---------------- */
function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadEditProduct() {
  const updateProductBtn = document.getElementById("updateProductBtn");
  if (!updateProductBtn) return;

  const productId = getProductIdFromURL();
  const msg = document.getElementById("msg");

  if (!productId) {
    msg.innerText = "Product ID not found";
    return;
  }

  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      msg.innerText = "Product not found";
      return;
    }

    const product = productSnap.data();

    document.getElementById("name").value = product.name || "";
    document.getElementById("category").value = product.category || "";
    document.getElementById("price").value = product.price || "";
    document.getElementById("stock").value = product.stock || "";
    document.getElementById("gst").value = product.gst || "";
    document.getElementById("imageUrl").value = product.imageUrl || "";
    document.getElementById("description").value = product.description || "";

    updateProductBtn.addEventListener("click", async () => {
      const name = document.getElementById("name").value.trim();
      const category = document.getElementById("category").value.trim();
      const price = Number(document.getElementById("price").value);
      const stock = Number(document.getElementById("stock").value);
      const gst = Number(document.getElementById("gst").value);
      const imageUrl = document.getElementById("imageUrl").value.trim();
      const description = document.getElementById("description").value.trim();

      if (!name || !category || !Number.isFinite(price) || price <= 0 || stock < 0 || gst < 0) {
        msg.innerText = "Please fill all required fields correctly";
        return;
      }

      msg.innerText = "Updating product...";

      try {
        await updateDoc(productRef, {
          name,
          category,
          price,
          stock,
          gst,
          imageUrl,
          description
        });

        msg.innerText = "Product updated successfully";

        setTimeout(() => {
          window.location.href = "products.html";
        }, 1000);
      } catch (error) {
        console.error("UPDATE PRODUCT ERROR:", error);
        msg.innerText = error.message;
      }
    });
  } catch (error) {
    console.error("LOAD EDIT PRODUCT ERROR:", error);
    msg.innerText = "Error loading product";
  }
}

loadDashboard();
loadOrders();
loadAdminProducts();
loadEditProduct();
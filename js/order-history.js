import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const searchOrderBtn = document.getElementById("searchOrderBtn");
const searchOrderInput = document.getElementById("searchOrderInput");
const trackMsg = document.getElementById("trackMsg");
const orderHistoryContainer = document.getElementById("orderHistoryContainer");

function normalizeText(text) {
  return (text || "").toString().trim().toLowerCase();
}

function renderOrders(orders) {
  orderHistoryContainer.innerHTML = "";

  if (orders.length === 0) {
    orderHistoryContainer.innerHTML = "<p style='text-align:center;'>No orders found.</p>";
    return;
  }

  orders.forEach((order) => {
    let itemList = "";

    (order.items || []).forEach((item) => {
      itemList += `
        <li>${item.name} - Qty: ${item.qty} - ₹${item.price}</li>
      `;
    });

    const div = document.createElement("div");
    div.className = "history-card";

    div.innerHTML = `
      <h3>Invoice: ${order.invoiceNo}</h3>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Address:</strong> ${order.address}</p>
      <p><strong>Status:</strong> <span class="status-badge">${order.status}</span></p>
      <p><strong>Total:</strong> ₹${order.totalAmount}</p>
      <p><strong>Items:</strong></p>
      <ul>${itemList}</ul>
    `;

    orderHistoryContainer.appendChild(div);
  });
}

async function searchOrders() {
  const value = normalizeText(searchOrderInput.value);

  if (!value) {
    trackMsg.innerText = "Please enter phone number or invoice number";
    orderHistoryContainer.innerHTML = "";
    return;
  }

  trackMsg.innerText = "Searching...";
  orderHistoryContainer.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "orders"));
    const allOrders = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));

    const filtered = allOrders.filter((order) => {
      const phone = normalizeText(order.phone);
      const invoiceNo = normalizeText(order.invoiceNo);
      return phone.includes(value) || invoiceNo.includes(value);
    });

    if (filtered.length > 0) {
      trackMsg.innerText = `${filtered.length} order(s) found`;
    } else {
      trackMsg.innerText = "No order found";
    }

    renderOrders(filtered.reverse());
  } catch (error) {
    console.error(error);
    trackMsg.innerText = "Error loading orders";
  }
}

searchOrderBtn.addEventListener("click", searchOrders);

searchOrderInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchOrders();
  }
});
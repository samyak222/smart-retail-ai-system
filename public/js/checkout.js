import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

console.log("CHECKOUT V4 LOADED");

const placeOrderBtn = document.getElementById("placeOrderBtn");
const checkoutMsg = document.getElementById("checkoutMsg");

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function generateInvoiceNo() {
  return "INV" + Date.now();
}

let isSubmitting = false;

placeOrderBtn.addEventListener("click", async () => {
  if (isSubmitting) return;

  const customerName = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const cart = getCart();

  if (!customerName || !phone || !address) {
    checkoutMsg.innerText = "Please fill all customer details";
    return;
  }

  if (cart.length === 0) {
    checkoutMsg.innerText = "Cart is empty";
    return;
  }

  isSubmitting = true;
  placeOrderBtn.disabled = true;
  checkoutMsg.innerText = "Placing order...";

  try {
    let totalAmount = 0;
    const checkedItems = [];
    const invoiceNo = generateInvoiceNo();

    for (const item of cart) {
      const qty = Number(item.qty);
      const price = Number(item.price);

      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(`Invalid quantity for ${item.name}`);
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`Invalid price for ${item.name}`);
      }

      const productRef = doc(db, "products", item.id);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error(`${item.name} product not found`);
      }

      const productData = productSnap.data();
      const currentStock = Number(productData.stock || 0);
      const currentSoldCount = Number(productData.soldCount || 0);

      if (qty > currentStock) {
        throw new Error(`Only ${currentStock} items left for ${item.name}`);
      }

      totalAmount += price * qty;

      checkedItems.push({
        productRef,
        name: item.name,
        qty,
        currentStock,
        currentSoldCount
      });
    }

    const batch = writeBatch(db);

    for (const item of checkedItems) {
      batch.update(item.productRef, {
        stock: item.currentStock - item.qty,
        soldCount: item.currentSoldCount + item.qty
      });
    }

    const orderRef = doc(collection(db, "orders"));

    batch.set(orderRef, {
      customerName,
      phone,
      address,
      items: cart,
      totalAmount,
      invoiceNo,
      status: "Placed",
      createdAt: serverTimestamp()
    });

    await batch.commit();

    const lastOrderData = {
      customerName,
      phone,
      address,
      items: cart,
      totalAmount,
      invoiceNo,
      status: "Placed",
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("lastOrder", JSON.stringify(lastOrderData));
    localStorage.removeItem("cart");

    checkoutMsg.innerText = `Order placed successfully. Invoice: ${invoiceNo}`;

    setTimeout(() => {
      window.location.href = "invoice.html";
    }, 1500);
  } catch (error) {
    console.error("ORDER ERROR:", error);
    checkoutMsg.innerText = error.message;
  } finally {
    isSubmitting = false;
    placeOrderBtn.disabled = false;
  }
});
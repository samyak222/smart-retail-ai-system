import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

const invoiceBox = document.getElementById("invoiceBox");
const downloadInvoiceBtn = document.getElementById("downloadInvoiceBtn");

function getLastOrder() {
  return JSON.parse(localStorage.getItem("lastOrder")) || null;
}

function renderInvoice(order) {
  if (!order) {
    invoiceBox.innerHTML = "<p>No invoice data found.</p>";
    return;
  }

  let itemsHtml = "";

  order.items.forEach((item) => {
    const itemTotal = Number(item.price) * Number(item.qty);

    itemsHtml += `
      <tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>Rs. ${item.price}</td>
        <td>Rs. ${itemTotal}</td>
      </tr>
    `;
  });

  invoiceBox.innerHTML = `
    <div class="invoice-header">
      <div>
        <h2>Smart Retail AI</h2>
        <p>GST Invoice</p>
      </div>
      <div class="invoice-meta">
        <p><strong>Invoice No:</strong> ${order.invoiceNo}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
    </div>

    <hr>

    <div class="invoice-customer">
      <p><strong>Customer Name:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Address:</strong> ${order.address}</p>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="invoice-total">
      <h3>Grand Total: Rs. ${order.totalAmount}</h3>
    </div>
  `;
}

function drawTable(doc, startY, items) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tableWidth = pageWidth - margin * 2;

  const col1 = 85;
  const col2 = 25;
  const col3 = 35;
  const col4 = tableWidth - col1 - col2 - col3;

  let y = startY;
  const rowHeight = 10;

  doc.setFillColor(37, 99, 235);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, y, tableWidth, rowHeight, "F");

  doc.setFontSize(11);
  doc.text("Product", margin + 3, y + 7);
  doc.text("Qty", margin + col1 + 3, y + 7);
  doc.text("Price", margin + col1 + col2 + 3, y + 7);
  doc.text("Total", margin + col1 + col2 + col3 + 3, y + 7);

  y += rowHeight;
  doc.setTextColor(0, 0, 0);

  items.forEach((item) => {
    const qty = Number(item.qty);
    const price = Number(item.price);
    const total = qty * price;

    const productLines = doc.splitTextToSize(item.name, col1 - 6);
    const textLines = Math.max(1, productLines.length);
    const dynamicRowHeight = Math.max(rowHeight, textLines * 7);

    doc.rect(margin, y, col1, dynamicRowHeight);
    doc.rect(margin + col1, y, col2, dynamicRowHeight);
    doc.rect(margin + col1 + col2, y, col3, dynamicRowHeight);
    doc.rect(margin + col1 + col2 + col3, y, col4, dynamicRowHeight);

    doc.text(productLines, margin + 3, y + 7);
    doc.text(String(qty), margin + col1 + 3, y + 7);
    doc.text(`Rs. ${price}`, margin + col1 + col2 + 3, y + 7);
    doc.text(`Rs. ${total}`, margin + col1 + col2 + col3 + 3, y + 7);

    y += dynamicRowHeight;
  });

  return y;
}

if (downloadInvoiceBtn) {
  downloadInvoiceBtn.addEventListener("click", () => {
    const order = getLastOrder();

    if (!order) {
      alert("No invoice data found");
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Smart Retail AI - GST Invoice", 14, y);

    y += 10;
    doc.setFontSize(11);
    doc.text(`Invoice No: ${order.invoiceNo}`, 14, y);
    doc.text(`Status: ${order.status}`, 140, y);

    y += 10;
    doc.text(`Customer Name: ${order.customerName}`, 14, y);

    y += 8;
    doc.text(`Phone: ${order.phone}`, 14, y);

    y += 8;
    const addressLines = doc.splitTextToSize(`Address: ${order.address}`, 180);
    doc.text(addressLines, 14, y);
    y += addressLines.length * 7 + 6;

    y = drawTable(doc, y, order.items);

    y += 12;
    doc.setFontSize(13);
    doc.text(`Grand Total: Rs. ${order.totalAmount}`, 14, y);

    doc.save(`${order.invoiceNo}.pdf`);
  });
}

const order = getLastOrder();
renderInvoice(order);
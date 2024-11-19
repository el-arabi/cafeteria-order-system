// Global variables
let currentOrder = [];
let ordersList = [];
let selectedOrderIndex = null;

// Helper functions
function formatPrice(price) {
    return `${price.toFixed(2)} DH`;
}

function updateDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    document.getElementById('datetime').textContent = `${dateStr} ${timeStr}`;
}

// Initialize the application
function init() {
    setInterval(updateDateTime, 1000);
    displayProducts('all');
    setupEventListeners();
}

// Event listeners setup
function setupEventListeners() {
    // Category tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            displayProducts(e.target.dataset.category);
        });
    });

    // Product search
    const searchInput = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const matches = productsList.filter(product => 
            product.name.toLowerCase().includes(searchTerm)
        );

        searchResults.innerHTML = matches.map(product => 
            `<div class="search-result-item" data-id="${product.id}">${product.name} - ${formatPrice(product.price)}</div>`
        ).join('');

        searchResults.style.display = matches.length ? 'block' : 'none';
    });

    searchResults.addEventListener('click', (e) => {
        if (e.target.classList.contains('search-result-item')) {
            const productId = e.target.dataset.id;
            const product = productsList.find(p => p.id === productId);
            addToOrder(product);
            searchInput.value = '';
            searchResults.style.display = 'none';
        }
    });

    // Product grid click
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
            const productId = card.dataset.id;
            const product = productsList.find(p => p.id === productId);
            addToOrder(product);
        }
    });

    // Edit order items
    document.getElementById('orderItems').addEventListener('click', (e) => {
        const orderItemElement = e.target.closest('.order-item');
        if (orderItemElement) {
            const productName = orderItemElement.querySelector('span:first-child').textContent.split(' x')[0];
            const product = currentOrder.find(item => item.name === productName);
            
            if (product) {
                const action = prompt(`Actions for ${product.name}:
1. Increase Quantity
2. Decrease Quantity
3. Remove Item`, '');

                switch(action) {
                    case '1':
                        product.quantity += 1;
                        break;
                    case '2':
                        if (product.quantity > 1) {
                            product.quantity -= 1;
                        } else {
                            currentOrder = currentOrder.filter(item => item !== product);
                        }
                        break;
                    case '3':
                        currentOrder = currentOrder.filter(item => item !== product);
                        break;
                }
                updateOrderDisplay();
            }
        }
    });

    // Custom product
    document.getElementById('addCustomProduct').addEventListener('click', () => {
        document.getElementById('customProductForm').classList.toggle('hidden');
    });

    document.getElementById('saveCustomProduct').addEventListener('click', addCustomProduct);

    // Amount paid
    document.getElementById('amountPaid').addEventListener('input', updateChange);

    // Add order to list
    document.getElementById('addOrder').addEventListener('click', addOrderToList);

    // Custom route for receipt page
    document.getElementById('generateReceipt').addEventListener('click', () => {
        if (ordersList.length === 0) {
            alert('No orders to generate receipt');
            return;
        }
        displayReceiptPage();
    });
}

// Display products
function displayProducts(category) {
    const productsGrid = document.getElementById('productsGrid');
    const filteredProducts = category === 'all' 
        ? productsList 
        : productsList.filter(p => p.category === category);

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <h3>${product.name}</h3>
            <p>${formatPrice(product.price)}</p>
        </div>
    `).join('');
}

// Order management
function addToOrder(product) {
    const existingItem = currentOrder.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentOrder.push({ ...product, quantity: 1 });
    }
    updateOrderDisplay();
}

function addCustomProduct() {
    const name = document.getElementById('customName').value;
    const price = parseFloat(document.getElementById('customPrice').value);
    const quantity = parseInt(document.getElementById('customQuantity').value);

    if (name && price && quantity) {
        const customProduct = {
            id: `custom_${Date.now()}`,
            name,
            price,
            quantity,
            category: 'custom'
        };
        currentOrder.push(customProduct);
        updateOrderDisplay();
        
        // Reset form
        document.getElementById('customName').value = '';
        document.getElementById('customPrice').value = '';
        document.getElementById('customQuantity').value = '';
        document.getElementById('customProductForm').classList.add('hidden');
    }
}

function updateOrderDisplay() {
    const orderItems = document.getElementById('orderItems');
    const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    orderItems.innerHTML = currentOrder.map(item => `
        <div class="order-item">
            <span>${item.name} x${item.quantity}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('') + `
        <div class="order-item">
            <strong>Total:</strong>
            <strong>${formatPrice(total)}</strong>
        </div>
    `;

    updateChange();
}

function updateChange() {
    const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const paid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const change = paid - total;
    
    document.getElementById('changeAmount').textContent = change >= 0 
        ? `Change: ${formatPrice(change)}` 
        : `Remaining: ${formatPrice(Math.abs(change))}`;
}

function addOrderToList() {
    if (currentOrder.length === 0) return;

    const assistantName = document.getElementById('assistantName').value;
    const classroom = document.getElementById('classroom').value;
    const studentName = document.getElementById('studentName').value;

    if (!assistantName || !classroom || !studentName) {
        alert('Please fill in all required fields');
        return;
    }

    const order = {
        id: Date.now(),
        datetime: new Date().toLocaleString(),
        assistant: assistantName,
        classroom: classroom,
        student: studentName,
        items: [...currentOrder],
        total: currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    ordersList.push(order);
    updateOrdersList();
    
    // Reset current order
    currentOrder = [];
    updateOrderDisplay();
    document.getElementById('amountPaid').value = '';
    document.getElementById('changeAmount').textContent = '';
    document.getElementById('studentName').value = '';
}

function updateOrdersList() {
    const ordersListElement = document.getElementById('ordersList');
    ordersListElement.innerHTML = ordersList.map(order => `
        <div class="order-item">
            <div>${order.student} - ${order.classroom}</div>
            <div>${formatPrice(order.total)}</div>
        </div>
    `).join('');
}

function displayReceiptPage() {
    // Create a new page for receipt details
    const receiptPage = document.createElement('div');
    receiptPage.id = 'receiptPage';
    receiptPage.innerHTML = `
        <div class="receipt-container">
            <h1>Daily Receipt Details</h1>
            <table id="receiptTable">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Orders</th>
                        <th>Money Received</th>
                        <th>Change Given</th>
                    </tr>
                </thead>
                <tbody id="receiptTableBody"></tbody>
                <tfoot>
                    <tr>
                        <td colspan="2"><strong>Total</strong></td>
                        <td id="totalMoneyReceived">0 DH</td>
                        <td id="totalChangeGiven">0 DH</td>
                    </tr>
                </tfoot>
            </table>
            <div class="receipt-actions">
                <button id="downloadReceiptPdf" class="btn">Download PDF</button>
                <button id="returnToMain" class="btn">Return to Main</button>
            </div>
        </div>
    `;

    // Replace current page content
    document.body.innerHTML = '';
    document.body.appendChild(receiptPage);

    const tableBody = document.getElementById('receiptTableBody');
    let totalMoneyReceived = 0;
    let totalChangeGiven = 0;

    ordersList.forEach(order => {
        const orderDetails = order.items.map(item => 
            `${item.name} x${item.quantity} (${formatPrice(item.price * item.quantity)})`
        ).join('<br>');

        const amountPaid = parseFloat(prompt(`How much money did ${order.student} pay?`));
        const change = Math.max(0, amountPaid - order.total);
        
        totalMoneyReceived += amountPaid;
        totalChangeGiven += change;

        const row = `
            <tr>
                <td>${order.student}</td>
                <td>${orderDetails}</td>
                <td>${formatPrice(amountPaid)}</td>
                <td>${formatPrice(change)}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    document.getElementById('totalMoneyReceived').textContent = formatPrice(totalMoneyReceived);
    document.getElementById('totalChangeGiven').textContent = formatPrice(totalChangeGiven);

    // Attach event listeners for new page
    document.getElementById('downloadReceiptPdf').addEventListener('click', generateReceipt);
    document.getElementById('returnToMain').addEventListener('click', () => {
        // Reload the page to reset everything
        window.location.reload();
    });
}
function generateReceipt() {
    // Ensure jspdf is loaded
    if (typeof jspdf === 'undefined') {
        alert('PDF library not loaded. Please include jspdf library.');
        return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Set up document
    doc.setFontSize(16);
    doc.text('Daily Receipt Details', 105, 20, { align: 'center' });

    // Table headers
    const headers = ['Student Name', 'Orders', 'Money Received', 'Change Given'];
    const tableData = [];

    let totalMoneyReceived = 0;
    let totalChangeGiven = 0;

    ordersList.forEach(order => {
        const orderDetails = order.items.map(item => 
            `${item.name} x${item.quantity} (${formatPrice(item.price * item.quantity)})`
        ).join('\n');

        const amountPaid = order.amountPaid || order.total;
        const change = Math.max(0, amountPaid - order.total);
        
        totalMoneyReceived += amountPaid;
        totalChangeGiven += change;

        tableData.push([
            order.student, 
            orderDetails, 
            formatPrice(amountPaid), 
            formatPrice(change)
        ]);
    });

    // Add totals row
    tableData.push([
        'Total', 
        '', 
        formatPrice(totalMoneyReceived), 
        formatPrice(totalChangeGiven)
    ]);

    // Generate table
    doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 30,
        styles: { 
            fontSize: 10,
            cellPadding: 3,
        },
        headStyles: { 
            fillColor: [33, 150, 243],  // Primary color 
            textColor: 255 
        },
        alternateRowStyles: { 
            fillColor: [240, 240, 240] 
        }
    });

    // Save the PDF
    doc.save('daily_receipt.pdf');
}

function updateOrdersList() {
    const ordersListElement = document.getElementById('ordersList');
    ordersListElement.innerHTML = ordersList.map((order, index) => `
        <div class="order-item" data-index="${index}">
            <div>${order.student} - ${order.classroom}</div>
            <div>${formatPrice(order.total)}</div>
            <div class="order-actions">
                <button class="edit-order-btn">Edit</button>
                <button class="delete-order-btn">Delete</button>
            </div>
        </div>
    `).join('');

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-order-btn').forEach(btn => {
        btn.addEventListener('click', editOrder);
    });

    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', deleteOrder);
    });
}

function editOrder(event) {
    const orderIndex = event.target.closest('.order-item').dataset.index;
    const order = ordersList[orderIndex];

    // Create a modal for editing the order
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit Order for ${order.student}</h2>
            <div id="editOrderItems"></div>
            <div>
                <label>Amount Paid:</label>
                <input type="number" id="editAmountPaid" value="${order.amountPaid || order.total}" step="0.01">
            </div>
            <div class="modal-actions">
                <button id="saveOrderEdit">Save</button>
                <button id="cancelOrderEdit">Cancel</button>
                <button id="addMoreItems">Add More Items</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Populate order items
    const editOrderItems = document.getElementById('editOrderItems');
    order.items.forEach((item, itemIndex) => {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = `
            <span>${item.name}</span>
            <input type="number" min="1" value="${item.quantity}" 
                   id="editItemQuantity-${itemIndex}">
            <button onclick="removeOrderItem(${orderIndex}, ${itemIndex})">Remove</button>
        `;
        editOrderItems.appendChild(itemDiv);
    });

    // Add event listener to add more items
    document.getElementById('addMoreItems').addEventListener('click', () => {
        const productsModal = document.createElement('div');
        productsModal.className = 'modal';
        productsModal.innerHTML = `
            <div class="modal-content">
                <h2>Add Items to Order</h2>
                <div id="addItemsGrid">
                    ${productsList.map(product => `
                        <div class="product-card" data-id="${product.id}">
                            <h3>${product.name}</h3>
                            <p>${formatPrice(product.price)}</p>
                            <button onclick="addItemToEditOrder('${product.id}', ${orderIndex})">Add</button>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button id="closeAddItems">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(productsModal);

        // Close products modal
        document.getElementById('closeAddItems').addEventListener('click', () => {
            document.body.removeChild(productsModal);
        });
    });

    // Save order edit
    document.getElementById('saveOrderEdit').addEventListener('click', () => {
        // Update item quantities
        order.items.forEach((item, itemIndex) => {
            const newQuantity = document.getElementById(`editItemQuantity-${itemIndex}`).value;
            item.quantity = parseInt(newQuantity);
        });

        // Recalculate total
        order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Update amount paid
        order.amountPaid = parseFloat(document.getElementById('editAmountPaid').value);

        // Remove modal and update list
        document.body.removeChild(modal);
        updateOrdersList();
    });

    // Cancel order edit
    document.getElementById('cancelOrderEdit').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function removeOrderItem(orderIndex, itemIndex) {
    const order = ordersList[orderIndex];
    
    // If only one item remains, prevent removal
    if (order.items.length <= 1) {
        alert('Cannot remove the last item. Delete the entire order instead.');
        return;
    }
    
    // Remove the item
    order.items.splice(itemIndex, 1);

    // Recalculate total
    order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update the modal
    editOrder({ target: document.querySelector(`.order-item[data-index="${orderIndex}"] .edit-order-btn`) });
}

function deleteOrder(event) {
    const orderIndex = event.target.closest('.order-item').dataset.index;
    
    // Remove the order from the list
    ordersList.splice(orderIndex, 1);
    
    // Update the orders list display
    updateOrdersList();
}
function addItemToEditOrder(productId, orderIndex) {
    const order = ordersList[orderIndex];
    const product = productsList.find(p => p.id === productId);
    
    // Check if product already exists in the order
    const existingItem = order.items.find(item => item.id === productId);
    
    if (existingItem) {
        // If product exists, increase quantity
        existingItem.quantity += 1;
    } else {
        // If product doesn't exist, add new item
        order.items.push({ ...product, quantity: 1 });
    }

    // Recalculate total
    order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update the edit modal and order list
    document.body.removeChild(document.querySelector('.modal:last-child'));
    editOrder({ target: document.querySelector(`.order-item[data-index="${orderIndex}"] .edit-order-btn`) });
}


// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
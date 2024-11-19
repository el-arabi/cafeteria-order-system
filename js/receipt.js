function addOrderToList() {
    if (currentOrder.length === 0) return;

    const assistantName = document.getElementById('assistantName').value;
    const classroom = document.getElementById('classroom').value;
    const studentName = document.getElementById('studentName').value;
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;

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
        total: currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        amountPaid: amountPaid  // Add this line to store the amount paid
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

        // Use the stored amountPaid from the order
        const amountPaid = order.amountPaid || order.total;
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
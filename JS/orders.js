// --- ORDERS MANAGEMENT ---
const orderAlarm = new Audio('alert.mp3'); 
let isInitialLoad = true;
let lastSnapshot = null; // Store snapshot for re-rendering 

function startOrderListener() {
    db.collection("orders").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        lastSnapshot = snapshot;
        
        // ALWAYS NOTIFY LOCALLY AND VIA FCM
        if (!isInitialLoad) {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const newOrder = change.doc.data();
                    if (newOrder.status === "Pending" || newOrder.status === "Payment Awaited") {
                        console.log('🔔 New order detected:', newOrder.userName);
                        
                        if (window.orderNotificationSystem.shouldNotifyOrder(newOrder)) {
                            // 1. Play Sound
                            window.orderNotificationSystem.playOrderSound();
                            
                            // 2. Show Visual Notification
                            window.orderNotificationSystem.showOrderNotification(newOrder);
                            
                            // 3. Try Browser Notification (if supported/allowed)
                            window.orderNotificationSystem.showBrowserNotification(newOrder);
                        }
                    }
                }
            });
        }
        isInitialLoad = false;
        
        renderOrders(snapshot);
    });
}

function renderOrders(snapshot) {
    const container = document.getElementById("ordersDisplayArea");
    let totalOrders = 0, pendingOrders = 0, totalRevenue = 0;
    let ordersData = [];

    console.log('renderOrders called with docs:', snapshot.size);

    // Collect stats and data
    if (snapshot.empty) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#9ca3af; margin-top:50px; background:white; padding:40px; border-radius:12px;">
            <i class="fa-solid fa-box-open" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i><br>No orders received.
        </div>`;
        return;
    }

    snapshot.forEach((doc) => {
        const order = doc.data();
        const id = doc.id;
        totalOrders++;
        
        if (order.status === "Pending" || order.status === "Payment Awaited") pendingOrders++;
        if (order.status === "Accepted" || order.status === "Ready" || order.status === "Delivered") totalRevenue += (order.totalAmount || 0);
        
        ordersData.push({ id, ...order });
    });

    console.log('Rendering', ordersData.length, 'orders in grid view');

    // Always render grid view (cards)
    renderGridView(ordersData);

    // Update stats
    document.getElementById('statTotal').innerText = totalOrders;
    document.getElementById('statPending').innerText = pendingOrders;
    document.getElementById('statRevenue').innerText = "₹" + totalRevenue.toFixed(2).toLocaleString('en-IN');
    const badge = document.getElementById('pendingCount');
    if (badge) {
        badge.innerText = pendingOrders;
        badge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
    }
}

// Store order data globally for popup access
window.orderData = window.orderData || {};

function renderGridView(ordersData) {
    console.log('=== Rendering Grid View ===');
    console.log('Orders data received:', ordersData);
    
    const container = document.getElementById("ordersDisplayArea");
    container.innerHTML = `<div id="ordersList" class="orders-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start"></div>`;
    const list = document.getElementById("ordersList");

    ordersData.forEach(order => {
        console.log('Storing order data for ID:', order.id);
        console.log('Order details:', order);
        
        // Store order data globally for popup access
        window.orderData[order.id] = order;
        
        const paymentTag = order.paymentMethod === 'UPI' 
            ? `<span style="color:#0369a1; font-weight:600;">UPI</span>` 
            : `<span style="color:#059669; font-weight:600;">COD</span>`;

        let itemsCount = order.items.length;
        let itemsHtml = order.items.map(i => `
            <div class="item-line">
                <span><strong>${i.qty}x</strong> ${i.name}</span>
                <span>₹${(i.price * i.qty).toFixed(2)}</span>
            </div>`).join('');

        let deliveryCharge = order.deliveryCharge || 0;
        let subtotal = order.subtotal || (order.totalAmount - deliveryCharge);
        let timeAgo = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleString('en-IN') : "Just now";
        
        // Store order data globally
        window.orderData[order.id] = order;
        
        let buttonsHtml;
        const needsAction = order.status === 'Pending' || order.status === 'Payment Awaited';
        const isAccepted = order.status === 'Accepted';
        const isReady = order.status === 'Ready';

        if (needsAction) {
            buttonsHtml = `
                <div style="display: flex; gap: 10px; width: 100%;">
                    <button class="btn btn-accept" onclick="updateStatus('${order.id}', 'Accepted')" style="flex: 1; height: 42px; display: flex; align-items: center; justify-content: center; gap: 6px;"><i class="fa-solid fa-check"></i> Accept</button>
                    <button class="btn btn-reject" onclick="updateStatus('${order.id}', 'Rejected')" style="flex: 1; height: 42px; display: flex; align-items: center; justify-content: center; gap: 6px;"><i class="fa-solid fa-xmark"></i> Reject</button>
                </div>
            `;
        } else if (isAccepted) {
            buttonsHtml = `
                <button class="btn" style="background:#f59e0b; color:white; width: 100%; height: 42px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="updateStatus('${order.id}', 'Ready')">
                    <i class="fa-solid fa-cookie-bite"></i> Mark Ready
                </button>
            `;
        } else if (isReady) {
            buttonsHtml = `
                <button class="btn" style="background:#10b981; color:white; width: 100%; height: 42px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="updateStatus('${order.id}', 'Delivered')">
                    <i class="fa-solid fa-truck"></i> Delivered
                </button>
            `;
        } else {
            buttonsHtml = `<button class="btn btn-delete" onclick="deleteOrder('${order.id}')" style="width: 100%; height: 42px; display: flex; align-items: center; justify-content: center; gap: 6px;"><i class="fa-solid fa-trash"></i> Archive</button>`;
        }

        list.innerHTML += `
            <div class="order-card" style="position: relative;">
                <div class="card-top" style="position: relative;">
                    <div><div class="order-id">#${order.id.toUpperCase()}</div><div class="order-time">${timeAgo}</div></div>
                    <span class="status-pill status-${order.status.replace(/\s/g, '\\ ')}" style="position: absolute; top: 0; right: 0;">${order.status}</span>
                </div>
                <div class="card-body">
                    <div class="user-info" style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                        <div class="user-name" style="display: flex; align-items: center;"><i class="fa-solid fa-user" style="margin-right:6px; color:#6b7280; font-size:0.9rem;"></i>${order.userName || 'Guest'}</div>
                        <div class="user-phone" style="display: flex; align-items: center;"><i class="fa-solid fa-phone" style="margin-right:6px; color:#6b7280; font-size:0.8rem;"></i>${order.phone}</div>
                        <div class="user-email" style="font-size:0.75rem; color:#9ca3af; margin-top:2px; display: flex; align-items: center;"><i class="fa-solid fa-envelope" style="margin-right:4px;"></i>${order.userEmail || 'N/A'}</div>
                    </div>
                </div>
                    <div class="address-info" style="font-size:0.85rem; color:#6b7280; margin-bottom:8px; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; display: flex; align-items: flex-start;"><i class="fa-solid fa-location-dot" style="margin-right:6px; margin-top:2px;"></i> ${order.address}</div>
                    <div class="price-tag">
                        <div style="font-size:0.9rem; color:#6b7280; margin-bottom:2px;">Items: ₹${subtotal.toFixed(2)}</div>
                        <div style="font-size:0.9rem; color:#f59e0b; margin-bottom:4px;">Delivery: ₹${deliveryCharge.toFixed(2)}</div>
                        <div style="font-size:1.4rem; font-weight:800; color:#059669;">₹${order.totalAmount.toFixed(2)} <span style="font-size:0.7em; font-weight:600; color:#6b7280;">(${paymentTag})</span></div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <button class="map-location-btn" onclick="openCustomerMap('${order.lat || ''}', '${order.lng || ''}', '${order.address || ''}', '${order.userName || 'Customer'}')" style="flex: 1 !important; height: 42px !important; background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:white; border:none; border-radius:8px; padding:0 12px; font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.3s ease; width: auto !important; margin: 0 !important;" onmouseover="this.style.background='linear-gradient(135deg, #059669 0%, #047857 100%)'" onmouseout="this.style.background='linear-gradient(135deg, #10b981 0%, #059669 100%)'">
                            <i class="fa-solid fa-map-location-dot"></i> Map
                        </button>
                        <button class="view-items-btn" onclick="showItemsPopup('${order.id}')" style="flex: 1 !important; height: 42px !important; margin: 0 !important; display: flex; align-items: center; justify-content: center; gap: 6px; width: auto !important;">
                            <i class="fa-solid fa-box-open"></i> Items (${itemsCount})
                        </button>
                    </div>
                </div>
                <div class="card-actions" style="margin-top: 0;">${buttonsHtml}</div>
            </div>`;
    });
    
    console.log('=== Grid View Render Complete ===');
    console.log('Final orderData object:', window.orderData);
    console.log('Stored order IDs:', Object.keys(window.orderData));
    
    // Re-apply search filter if there's a search term
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
            filterOrders();
        }, 0);
    }
}

function updateStatus(docId, status) { 
    let msg = status === "Rejected" ? "Are you sure you want to reject this order?" : `Set status to ${status}?`;
    if (status === "Accepted" || status === "Ready" || status === "Delivered" || confirm(msg)) {
        
        // Stop any active notification sound
        if(window.orderNotificationSystem && window.orderNotificationSystem.stopOrderSound) {
            window.orderNotificationSystem.stopOrderSound();
        }

        db.collection("orders").doc(docId).update({ status: status })
        .then(() => {
            console.log(`Order ${docId} status set to ${status}`);
        })
        .catch(error => {
            alert("Error updating status: " + error.message);
        });
    }
}

function deleteOrder(docId) { 
    if(confirm("Are you sure you want to Archive/Delete this order?")) {
        
        // Stop any active notification sound
        if(window.orderNotificationSystem && window.orderNotificationSystem.stopOrderSound) {
            window.orderNotificationSystem.stopOrderSound();
        }

        db.collection("orders").doc(docId).delete()
        .then(() => {
            alert("Order archived successfully.");
        })
        .catch(error => {
            alert("Error deleting order: " + error.message);
        });
    }
}

function filterOrders() {
    const input = document.getElementById('orderSearchInput');
    if (!input) {
        return;
    }
    
    const filter = input.value.toLowerCase().trim();
    const listContainer = document.getElementById("ordersList");
    
    if (!listContainer) {
        return;
    }
    
    // Use querySelectorAll for better compatibility
    const orderCards = listContainer.querySelectorAll('.order-card');
    
    if (orderCards.length === 0) {
        return;
    }
    
    // If filter is empty, show all cards
    if (filter === "") {
        orderCards.forEach(card => {
            card.style.setProperty('display', 'flex', 'important');
        });
        return;
    }
    
    // Filter cards based on search term
    orderCards.forEach((card) => {
        try {
            // Get all text content from the card for comprehensive search
            const cardText = card.textContent || card.innerText || "";
            const searchText = cardText.toLowerCase();
            
            // Check if filter matches anywhere in the card text
            const matches = searchText.includes(filter);
            
            if (matches) {
                card.style.setProperty('display', 'flex', 'important');
            } else {
                card.style.setProperty('display', 'none', 'important');
            }
        } catch (error) {
            console.error('Error processing card:', error);
            card.style.setProperty('display', 'flex', 'important'); // Show card if there's an error
        }
    });
}

async function deleteAllOrders() {
    const confirm1 = confirm("⚠️ KYA AAP SURE HAIN? Sabhi orders hamesha ke liye delete ho jayenge!");
    if (!confirm1) return;

    const confirm2 = prompt("Data delete karne ke liye 'DELETE' likhein:");
    if (confirm2 !== "DELETE") {
        alert("Action cancelled. Spelling galat thi.");
        return;
    }

    try {
        const snapshot = await db.collection("orders").get();
        if (snapshot.empty) {
            alert("Delete karne ke liye koi orders nahi hain.");
            return;
        }

        const batch = db.batch();
        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        alert("✅ Sabhi orders delete kar diye gaye hain.");
    } catch (error) {
        console.error("Error deleting all orders:", error);
        alert("Error: " + error.message);
    }
}

function showItemsPopup(orderId) {
    console.log('View Items clicked:', orderId);
    
    // Stop any active notification sound
    if(window.orderNotificationSystem && window.orderNotificationSystem.stopOrderSound) {
        window.orderNotificationSystem.stopOrderSound();
    }
    
    const order = window.orderData[orderId];
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Create popup HTML
    const popupHtml = `
        <div id="itemsPopup" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            box-sizing: border-box;
        ">
            <div style="
                background: white;
                padding: 25px;
                border-radius: 15px;
                max-width: 600px;
                width: 100%;
                max-height: 85vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;">
                    <h3 style="margin: 0; color: #333; font-size: 20px;">Order Items</h3>
                    <button onclick="closeItemsPopup()" style="
                        background: #f3f4f6;
                        border: none;
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">×</button>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; flex-shrink: 0;">
                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 14px;">
                        <strong style="color: #374151;">Order ID:</strong><span>${orderId.toUpperCase()}</span>
                        <strong style="color: #374151;">Customer:</strong><span>${order.userName || 'Guest'}</span>
                        <strong style="color: #374151;">Email:</strong><span>${order.userEmail || 'N/A'}</span>
                        <strong style="color: #374151;">Phone:</strong><span>${order.phone || 'N/A'}</span>
                        <strong style="color: #374151;">Address:</strong><span>${order.address || 'N/A'}</span>
                    </div>
                </div>
                
                <div style="flex-grow: 1; overflow-y: auto; margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
                    <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; position: sticky; top: 0; background: white; padding-bottom: 10px;">Items:</h4>
                    ${order.items.map(item => `
                        <div style="
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center;
                            padding: 12px 0; 
                            border-bottom: 1px solid #f3f4f6;
                        ">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="
                                    background: #f3f4f6;
                                    color: #374151;
                                    padding: 4px 8px;
                                    border-radius: 6px;
                                    font-size: 12px;
                                    font-weight: 600;
                                ">${item.qty}x</span>
                                <span style="color: #1f2937; font-weight: 500;">${item.name}</span>
                            </div>
                            <span style="color: #059669; font-weight: 600; font-size: 15px;">₹${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="
                    text-align: right; 
                    font-size: 20px; 
                    font-weight: bold; 
                    color: #1f2937;
                    padding-top: 15px;
                    border-top: 2px solid #e5e7eb;
                    flex-shrink: 0;
                ">
                    Total: <span style="color: #059669;">₹${parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
    
    // Add popup to page
    document.body.insertAdjacentHTML('beforeend', popupHtml);
    document.body.style.overflow = 'hidden';
}

function closeItemsPopup() {
    const popup = document.getElementById('itemsPopup');
    if (popup) {
        popup.remove();
        document.body.style.overflow = 'auto';
    }
}

// Show customer location on map
function openCustomerMap(lat, lng, address, customerName) {
    console.log('Opening map for:', customerName, 'at:', address);
    
    if (lat && lng) {
        // If coordinates are available, use them directly
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(mapUrl, '_blank');
    } else if (address) {
        // If only address is available, search by address
        const encodedAddress = encodeURIComponent(address);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        window.open(mapUrl, '_blank');
    } else {
        alert('No location information available for this order.');
    }
}

console.log('Orders Module Loaded');

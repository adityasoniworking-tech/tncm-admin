// --- DASHBOARD ANALYTICS & QUICK ACTIONS ---

let revenueChart = null;
let menuListener = null;
let ordersListener = null;

// Initialize dashboard analytics with real-time listeners
function initDashboardAnalytics() {
    setupRealtimeInventoryHealth();
    setupRealtimeRevenueChart();
    setupQuickActions();
}

// Setup real-time inventory health monitoring
function setupRealtimeInventoryHealth() {
    // Remove existing listener if any
    if (menuListener) {
        menuListener();
    }
    
    // Real-time listener for menu changes
    menuListener = db.collection('menu').onSnapshot(snapshot => {
        const menuItems = snapshot.docs.map(doc => doc.data());
        
        let inStockCount = 0;
        let outOfStockCount = 0;
        
        menuItems.forEach(item => {
            if (item.inStock === true) {
                inStockCount++;
            } else {
                outOfStockCount++;
            }
        });
        
        // Update UI in real-time
        document.getElementById('inStockCount').textContent = inStockCount;
        document.getElementById('outOfStockCount').textContent = outOfStockCount;
        document.getElementById('categoryCount').textContent = menuItems.length;
        
        console.log('Inventory health auto-updated:', { inStockCount, outOfStockCount, totalItems: menuItems.length });
    }, error => {
        console.error('Error in real-time inventory health:', error);
        // Show default values on error
        document.getElementById('inStockCount').textContent = '0';
        document.getElementById('outOfStockCount').textContent = '0';
        document.getElementById('categoryCount').textContent = '0';
    });
}

// Setup real-time revenue chart monitoring
function setupRealtimeRevenueChart() {
    // Remove existing listener if any
    if (ordersListener) {
        ordersListener();
    }
    
    // Real-time listener for orders changes
    ordersListener = db.collection('orders').onSnapshot(snapshot => {
        updateRevenueChart();
        console.log('Revenue chart auto-updated due to orders change');
    }, error => {
        console.error('Error in real-time revenue chart:', error);
    });
    
    // Initial load
    updateRevenueChart();
}

// Update revenue chart with last 7 days data
async function updateRevenueChart() {
    try {
        // Get last 7 days of orders
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const ordersSnapshot = await db.collection('orders')
            .where('timestamp', '>=', sevenDaysAgo)
            .orderBy('timestamp', 'asc')
            .get();
        
        // Initialize daily revenue data
        const dailyRevenue = {};
        const labels = [];
        
        // Initialize last 7 days with 0 revenue
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(dateStr);
            dailyRevenue[dateStr] = 0;
        }
        
        // Calculate daily revenue from orders
        ordersSnapshot.docs.forEach(doc => {
            const order = doc.data();
            const orderDate = order.timestamp?.toDate();
            if (orderDate) {
                const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (dailyRevenue[dateStr] !== undefined) {
                    dailyRevenue[dateStr] += order.totalAmount || 0;
                }
            }
        });
        
        const revenueData = labels.map(label => dailyRevenue[label] || 0);
        
        // Calculate statistics
        const totalRevenue = revenueData.reduce((sum, rev) => sum + rev, 0);
        const avgRevenue = totalRevenue / 7;
        const maxRevenue = Math.max(...revenueData);
        
        // Update statistics if elements exist
        const avgElement = document.getElementById('avgDailyRevenue');
        const bestElement = document.getElementById('bestDayRevenue');
        
        if (avgElement) avgElement.textContent = `₹${avgRevenue.toFixed(0)}`;
        if (bestElement) bestElement.textContent = `₹${maxRevenue.toFixed(0)}`;
        
        // Draw chart
        drawRevenueChart(labels, revenueData);
        
        console.log('Revenue chart updated:', { labels, revenueData, avgRevenue, maxRevenue });
        
    } catch (error) {
        console.error('Error updating revenue chart:', error);
        // Show empty chart on error
        drawRevenueChart(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [0, 0, 0, 0, 0, 0, 0]);
    }
}

// Draw revenue chart using Canvas API with enhanced styling
function drawRevenueChart(labels, data) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return; // Chart might have been removed
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2; // For retina displays
    const height = canvas.height = canvas.offsetHeight * 2;
    
    // Clear canvas with subtle background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, width, height);
    
    // Chart dimensions
    const padding = 50;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    // Find max value for scaling with padding
    const maxValue = Math.max(...data, 100) * 1.1; // Add 10% padding
    
    // Create gradient for chart line
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');
    
    // Create area fill gradient
    const areaGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    areaGradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    areaGradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    
    // Draw enhanced grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed lines
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        
        // Add y-axis labels
        const value = Math.round(maxValue - (maxValue / 5) * i);
        ctx.fillStyle = '#6b7280';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`₹${value}`, padding - 10, y + 5);
    }
    
    ctx.setLineDash([]); // Reset line dash
    
    // Draw area under the line
    ctx.fillStyle = areaGradient;
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = padding + chartHeight - (value / maxValue) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.lineTo(padding + chartWidth, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();
    
    // Draw main data line with shadow
    ctx.shadowColor = 'rgba(99, 102, 241, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = padding + chartHeight - (value / maxValue) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw enhanced data points with animation effect
    data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = padding + chartHeight - (value / maxValue) * chartHeight;
        
        // Outer glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        glowGradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        glowGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // White outer circle
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Inner circle with gradient
        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
        innerGradient.addColorStop(0, '#8b5cf6');
        innerGradient.addColorStop(1, '#6366f1');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Add value labels on top of data points
        if (value > 0) {
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`₹${value}`, x, y - 20);
        }
    });
    
    // Draw enhanced x-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
        const x = padding + (chartWidth / (labels.length - 1)) * index;
        ctx.fillText(label, x, height - 15);
    });
    
    // Add chart title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Revenue Trend', width / 2, 30);
}

// Quick action functions
function emergencyToggle() {
    const isConfirmed = confirm('Are you sure you want to toggle store status? This will make the store temporarily unavailable.');
    if (isConfirmed) {
        // Toggle store status in Firebase
        db.collection('config').doc('storeStatus').set({
            isOpen: false,
            timestamp: new Date(),
            message: 'Store temporarily closed for maintenance'
        }).then(() => {
            alert('Store status updated! Store is now closed.');
        }).catch(error => {
            console.error('Error updating store status:', error);
            alert('Error updating store status. Please try again.');
        });
    }
}

function exportData() {
    // Create a simple CSV export of orders
    db.collection('orders').get().then(snapshot => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let csv = 'Order ID,Customer,Phone,Total,Status,Timestamp\n';
        orders.forEach(order => {
            csv += `${order.id},${order.customerName || 'N/A'},${order.phone || 'N/A'},${order.totalAmount || 0},${order.status || 'pending'},${order.timestamp?.toDate()?.toLocaleString() || 'N/A'}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        alert('Orders data exported successfully!');
    }).catch(error => {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    });
}

function refreshStats() {
    // Manual refresh - but with real-time listeners, this is mostly for visual feedback
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // Visual feedback
    const button = event.target.closest('button');
    const icon = button.querySelector('i');
    icon.classList.add('fa-spin');
    
    setTimeout(() => {
        icon.classList.remove('fa-spin');
        alert('Dashboard statistics refreshed!');
    }, 1000);
}

// Setup quick actions
function setupQuickActions() {
    // Add any additional setup for quick actions here
    console.log('Quick actions initialized');
}

// Cleanup listeners when page is unloaded
window.addEventListener('beforeunload', () => {
    if (menuListener) menuListener();
    if (ordersListener) ordersListener();
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for Firebase to initialize
    setTimeout(() => {
        initDashboardAnalytics();
    }, 1000);
});

console.log('Dashboard Analytics Module Loaded with Real-time Updates');

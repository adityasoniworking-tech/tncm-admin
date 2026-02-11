// --- NAVIGATION & SECTIONS ---
function showSection(sectionName) {
    // Ensure body scroll is restored
    document.body.style.overflow = '';
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';
    
    // Close any open popups
    const popup = document.getElementById('itemsPopup');
    if (popup) {
        popup.remove();
    }
    
    // Hide all sections
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('ordersSection').classList.add('hidden');
    document.getElementById('menuSection').classList.add('hidden');

    // Show selected section
    document.getElementById(sectionName + 'Section').classList.remove('hidden');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'orders': 'Orders Management',
        'menu': 'Menu Management'
    };
    
    const subtitles = {
        'dashboard': 'Live overview of your bakery',
        'orders': 'Manage incoming orders',
        'menu': 'Update menu items and pricing'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionName];
    document.getElementById('pageSubTitle').textContent = subtitles[sectionName];

    // Set active navigation
    setActiveNavForSection(sectionName);
}

// Set active navigation based on section
function setActiveNavForSection(sectionName) {
    const sectionToNavMap = {
        'dashboard': 0,    // First nav link
        'orders': 1,      // Second nav link
        'menu': 2         // Third nav link
    };
    
    const navLinks = document.querySelectorAll('.sidebar-menu .nav-link');
    const activeIndex = sectionToNavMap[sectionName];
    
    if (navLinks[activeIndex]) {
        setActiveNav(navLinks[activeIndex]);
    }
}

// Set active navigation link
function setActiveNav(element) {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active-link');
    });
    // Add active class to clicked element
    element.classList.add('active-link');
}

// Set active mobile navigation
function setMobileActive(element) {
    // Remove active class from all mobile buttons
    document.querySelectorAll('.bottom-nav-mobile button').forEach(btn => {
        btn.classList.remove('active-mobile');
    });
    // Add active class to clicked button
    element.classList.add('active-mobile');
}

function toggleAccordion(id) {
    const element = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    
    const isHidden = element.classList.contains('hidden');

    if (isHidden) {
        element.classList.remove('hidden');
        if(icon) icon.style.transform = 'rotate(180deg)';
    } else {
        element.classList.add('hidden');
        if(icon) icon.style.transform = 'rotate(0deg)';
    }
}

console.log('Navigation Module Loaded');

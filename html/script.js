let cart = {};

// Make sure the Bill UI is hidden by default
// Removed code that sets display for 'bill-container'

// --- SOUND: Button click ---
let enableSound = true;
let totalColor = "red";
try {
    // Try to get the config value from Lua via NUI message if sent
    window.addEventListener('message', function(event) {
        if (event.data.type === 'setSoundConfig') {
            enableSound = !!event.data.enabled;
        }
        if (event.data.type === 'setTotalColor') {
            const allowed = ["red","blue","green"];
            totalColor = allowed.includes(event.data.color) ? event.data.color : "red";
            document.documentElement.style.setProperty('--total-color', totalColor);
        }
        if (event.data.type === 'showStaffList') {
            const staffListContent = document.getElementById('staff-list-content');
            if (!staffListContent) return;
            // Only clear staff rows, keep header
            staffListContent.innerHTML = staffListContent.querySelector('.staff-header-row')?.outerHTML || '';
            if (!event.data.staff || event.data.staff.length === 0) {
                staffListContent.innerHTML += '<div style="color:#ccc; padding:16px;">No staff online.</div>';
                return;
            }
            event.data.staff.forEach(staff => {
                const div = document.createElement('div');
                div.className = 'staff-tile';
                div.innerHTML = `
                    <span>${staff.name}</span>
                    <span class="staff-rank">${staff.rank}</span>
                    <span><span class="status-dot${staff.online === false ? ' offline' : ''}"></span></span>
                `;
                staffListContent.appendChild(div);
            });
        }
    });
} catch (e) {}

function playClickSound() {
    if (!enableSound) return;
    const sound = new Audio('click.mp3');
    sound.volume = 1.0;
    sound.play();
}

// Utility function to play a UI sound
function playCloseSound() {
    const audio = new Audio('click.mp3'); // Place close.mp3 in the html directory
    audio.volume = 0.35;
    audio.play();
}

window.addEventListener("message", function(event) {
    // Open the food menu when triggered
    if (event.data.type === "openMenu") {
        document.getElementById("menu").style.display = "flex";
        document.body.style.backgroundColor = "rgba(0,0,0,0.5)";
        loadMenu(event.data.items);
        updateCart();
    }

    // Close the food menu
    if (event.data.type === "closeMenu") {
        document.getElementById("menu").style.display = "none";
        document.body.style.backgroundColor = "transparent";
    }

    // Open the order list panel
    if (event.data.type === "openOrderList") {
        const orderListPanel = document.getElementById("order-list-panel");
        if (!orderListPanel) {
            console.error('Order list panel not found in DOM.');
            return;
        }
        // Defensive: always show panel
        orderListPanel.style.display = "flex";
        document.body.style.backgroundColor = "rgba(0,0,0,0.5)";
        // Defensive: always show order list content
        const container = document.getElementById("order-list-content");
        if (!container) {
            console.error('Order list content not found in DOM.');
            return;
        }
        if (!Array.isArray(event.data.orders)) {
            console.warn('NUI message openOrderList missing or invalid orders array:', event.data.orders);
            container.innerHTML = '<div class="empty-cart-msg">Order list will appear here.</div>';
            return;
        }
        container.innerHTML = "";
        if (!event.data.orders.length) {
            container.innerHTML = '<div class="empty-cart-msg">No orders have been placed yet.</div>';
        } else {
            event.data.orders.forEach(order => {
                let itemsHtml = "";
                let total = 0;
                if (Array.isArray(order.items)) {
                    itemsHtml = order.items.map(item => {
                        total += (item.price || 0) * (item.qty || 0);
                        return `<div class='order-item-row'><span class='order-item-name'>${item.label || item.name}</span><span class='order-item-qty'>${item.qty}</span><span class='order-item-price'>$${(item.price * item.qty).toFixed(2)}</span></div>`;
                    }).join("");
                }
                const div = document.createElement("div");
                div.className = "order-tile";
                div.innerHTML = `
                    <button class="order-delete-btn" title="Delete Order" data-order="${order.order}">&#128465;</button>
                    <div class="order-header">
                        <span class="order-number">#${order.order}</span>
                    </div>
                    <div class="order-customer-name">${order.customer_name ? `Customer: ${order.customer_name}` : ''}</div>
                    <div class="order-items-col">${itemsHtml}</div>
                    <div class="order-total-row">Total: <span class="order-total">$${order.total || total}</span></div>
                `;
                container.appendChild(div);
            });
            container.querySelectorAll('.order-delete-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    const orderId = this.getAttribute('data-order');
                    showDeleteConfirm(orderId);
                });
            });
        }
    }

    // Close the order list panel
    if (event.data.type === "closeOrderList") {
        document.getElementById("order-list-panel").style.display = "none";
        document.body.style.backgroundColor = "transparent";
    }
});

// Attach sound to close button of order panel
const closeOrderBtn = document.getElementById('close-order-list');
if (closeOrderBtn) {
    closeOrderBtn.addEventListener('click', playCloseSound);
}

// If close button is dynamically added, use event delegation
const observer = new MutationObserver(() => {
    const btn = document.getElementById('close-order-list');
    if (btn && !btn.hasCloseSound) {
        btn.addEventListener('click', playCloseSound);
        btn.hasCloseSound = true;
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// Close button
const closeBtn = document.getElementById("close");
closeBtn.addEventListener("click", function() {
    playClickSound();
    fetch(`https://${GetParentResourceName()}/escape`, { method: 'POST' });
});

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        // If order list panel is open, close it and remove focus
        const orderListPanel = document.getElementById("order-list-panel");
        if (orderListPanel && orderListPanel.style.display === "flex") {
            orderListPanel.style.display = "none";
            document.body.style.backgroundColor = "transparent";
            fetch(`https://${GetParentResourceName()}/escapeOrderList`, { method: 'POST' });
            return;
        }
        // Otherwise, close the food menu as before
        fetch(`https://${GetParentResourceName()}/escape`, { method: 'POST' });
    }
});

// Close order list panel
const closeOrderListBtn = document.getElementById("close-order-list");
if (closeOrderListBtn) {
    closeOrderListBtn.addEventListener("click", function() {
        document.getElementById("order-list-panel").style.display = "none";
        document.body.style.backgroundColor = "transparent";
        // Tell Lua to remove cursor focus
        fetch(`https://${GetParentResourceName()}/escapeOrderList`, { method: 'POST' });
    });
}

// Clear Cart button
const clearCartBtn = document.getElementById("clear-cart");
clearCartBtn.addEventListener("click", function() {
    playClickSound();
    if (Object.keys(cart).length === 0) {
        fetch(`https://${GetParentResourceName()}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'error',
                text: 'Cart is already empty!'
            })
        });
        return;
    }
    cart = {};
    updateCart();
});

document.getElementById("place-order").addEventListener("click", function() {
    playClickSound();
    if (Object.keys(cart).length === 0) {
        // Use qb-notify instead of alert for empty cart
        fetch(`https://${GetParentResourceName()}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'error',
                text: 'Add items to cart before placing an order!'
            })
        });
        return;
    }

    fetch(`https://${GetParentResourceName()}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cart)
    });
    cart = {};  // Clear the cart after placing the order
    updateCart();
});

function loadMenu(items) {
    const container = document.getElementById("food-items");
    container.innerHTML = "";
    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "food-tile";
        div.setAttribute('data-name', item.name);
        div.innerHTML = `
            <h3>${item.name}</h3>
            <img src="images/${item.image}" alt="${item.name}" />
            <p>$${item.price.toFixed(2)}</p>
            <button onclick="addToCart('${item.name}', ${item.price})">+</button>
            <button onclick="removeFromCart('${item.name}')">-</button>
        `;
        container.appendChild(div);
    });
}

function addToCart(name, price) {
    playClickSound();
    if (!cart[name]) cart[name] = { qty: 0, price };
    cart[name].qty++;
    updateCart();
}

function removeFromCart(name) {
    playClickSound();
    if (cart[name]) {
        cart[name].qty--;
        if (cart[name].qty <= 0) delete cart[name];
    }
    updateCart();
}

function updateFoodTileGlow() {
    document.querySelectorAll('.food-tile').forEach(tile => {
        const name = tile.getAttribute('data-name');
        if (cart[name] && cart[name].qty > 0) {
            tile.classList.add('glow');
        } else {
            tile.classList.remove('glow');
        }
    });
}

function updateCart() {
    const container = document.getElementById("cart-items");
    container.innerHTML = "";
    let total = 0;
    Object.entries(cart).forEach(([key, item]) => {
        total += item.qty * item.price;
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <span>${key}</span>
            <span>x${item.qty}</span>
            <span>$${(item.qty * item.price).toFixed(2)}</span>
        `;
        container.appendChild(div);
    });
    if (total === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "empty-cart-msg";
        emptyMsg.textContent = "Cart is empty";
        container.appendChild(emptyMsg);
    }
    document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
    document.getElementById("cart-total").style.color = `var(--total-color)`;
    updateFoodTileGlow();
}

window.showDeleteConfirm = function(orderId) {
    if (document.querySelector('.confirm-delete-modal')) return;
    const modal = document.createElement('div');
    modal.className = 'confirm-delete-modal';
    modal.innerHTML = `
        <div class='confirm-delete-box'>
            <h3>Are you sure you want to delete order #${orderId}?</h3>
            <div class='confirm-delete-actions'>
                <button class='confirm'>Yes</button>
                <button class='cancel'>No</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.cancel').onclick = () => modal.remove();
    modal.querySelector('.confirm').onclick = () => {
        modal.remove();
        // Backend: Trigger order deletion
        fetch('https://qb-foodorder/deleteOrder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: orderId })
        }).then(resp => resp.json ? resp.json() : resp).then(() => {
            // Remove the order tile from the DOM
            const tile = document.querySelector(`.order-delete-btn[data-order="${orderId}"]`).closest('.order-tile');
            if (tile) tile.remove();
        });
    };
}

// --- Segmented Pill Toggle for Panel ---
document.addEventListener('DOMContentLoaded', function() {
    const panelToggle = document.getElementById('panel-toggle');
    const orderListContent = document.getElementById('order-list-content');
    const staffListContent = document.getElementById('staff-list-content');
    const orderListPanel = document.getElementById('order-list-panel');
    if (panelToggle && orderListContent && staffListContent && orderListPanel) {
        panelToggle.addEventListener('click', function(e) {
            const target = e.target.closest('.panel-segment');
            if (!target) return;
            panelToggle.querySelectorAll('.panel-segment').forEach(seg => seg.classList.remove('active'));
            target.classList.add('active');
            if (target.dataset.panel === 'orders') {
                orderListPanel.style.display = 'flex';
                orderListContent.style.display = 'grid'; // Always grid for tile layout
                staffListContent.style.display = 'none';
            } else {
                orderListContent.style.display = 'none';
                staffListContent.style.display = 'block';
                // Request staff list from Lua
                fetch('https://qb-foodorder/requestStaffList', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        });
    }
});

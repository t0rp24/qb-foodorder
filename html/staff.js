let cart = {};

window.addEventListener("message", function(event) {
    if (event.data.type === "openMenu") {
        document.getElementById("menu").style.display = "flex";
        document.body.style.backgroundColor = "rgba(0,0,0,0.5)";
        loadMenu(event.data.items);
    }
    if (event.data.type === "closeMenu") {
        document.getElementById("menu").style.display = "none";
        document.body.style.backgroundColor = "transparent";
    }
});

document.getElementById("close").addEventListener("click", function () {
    fetch(`https://${GetParentResourceName()}/escape`, {
        method: 'POST'
    });
});

document.getElementById("clear-cart").addEventListener("click", function() {
    cart = {}; // Clear the cart
    updateCart(); // Update the cart display
});

document.getElementById("place-order").addEventListener("click", function () {
    fetch(`https://${GetParentResourceName()}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cart)
    });

    cart = {}; // Clear cart
    updateCart();
    // Optionally, show a notification or a message to the user
});

function loadMenu(items) {
    const container = document.getElementById("food-items");
    container.innerHTML = ""; // Clear existing content
    
    if (!items || items.length === 0) {
        container.innerHTML = "<p>No food items available.</p>";
        return;
    }

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "food-tile";
        div.innerHTML = `
            <h3>${item.name}</h3>
            <img src="images/${item.image}" alt="${item.name}" />
            <p>$${item.price}</p>
            <button onclick="addToCart('${item.name}', ${item.price})">+</button>
            <button onclick="removeFromCart('${item.name}')">-</button>
        `;
        container.appendChild(div);
    });
}

function addToCart(name, price) {
    if (!cart[name]) cart[name] = { qty: 0, price: price };
    cart[name].qty++;
    updateCart();
}

function removeFromCart(name) {
    if (cart[name]) {
        cart[name].qty--;
        if (cart[name].qty <= 0) delete cart[name];
    }
    updateCart();
}

function updateCart() {
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalElement = document.getElementById("cart-total");
    cartItemsContainer.innerHTML = ""; // Clear previous cart items
    let total = 0;

    for (let item in cart) {
        const { qty, price } = cart[item];
        total += qty * price;
        const cartItemDiv = document.createElement("div");
        cartItemDiv.classList.add("cart-item");
        cartItemDiv.innerHTML = `
            <span>${item}</span>
            <span>x${qty}</span>
            <span>$${qty * price}</span>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    }

    cartTotalElement.textContent = total.toFixed(2); // Update total price
}

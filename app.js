// --- 1. VERİLƏNLƏR MODELİ (VENUE DATA) ---
let venueData = [
    // VIP Princess Seats (Row A)
    { id: "A1", section: "VIP Princess", row: "A", seat: 1, price: 120, status: "available" },
    { id: "A2", section: "VIP Princess", row: "A", seat: 2, price: 120, status: "available" },
    { id: "A3", section: "VIP Princess", row: "A", seat: 3, price: 120, status: "unavailable" },
    { id: "A4", section: "VIP Princess", row: "A", seat: 4, price: 120, status: "available" },
    
    // Royal Sweet Seats (Row B)
    { id: "B1", section: "Royal Sweet", row: "B", seat: 1, price: 80, status: "available" },
    { id: "B2", section: "Royal Sweet", row: "B", seat: 2, price: 80, status: "available" },
    { id: "B3", section: "Royal Sweet", row: "B", seat: 3, price: 80, status: "available" },
    { id: "B4", section: "Royal Sweet", row: "B", seat: 4, price: 80, status: "unavailable" },

    // Fairy Balcony Seats (Row C)
    { id: "C1", section: "Fairy Balcony", row: "C", seat: 1, price: 45, status: "available" },
    { id: "C2", section: "Fairy Balcony", row: "C", seat: 2, price: 45, status: "available" },
    { id: "C3", section: "Fairy Balcony", row: "C", seat: 3, price: 45, status: "available" },
    { id: "C4", section: "Fairy Balcony", row: "C", seat: 4, price: 45, status: "available" }
];

let selectedSeat = null; // Hazırda baxılan (inspected) oturacaq
let cart = []; // Səbət

// DOM Elementləri
const venueMap = document.getElementById("venue-map");
const seatDetailsDiv = document.getElementById("seat-details");
const addToCartBtn = document.getElementById("add-to-cart-btn");
const cartItemsList = document.getElementById("cart-items");
const totalPriceSpan = document.getElementById("total-price");

// --- 2. LOCALSTORAGE İDARƏETMƏSİ ---
function loadFromStorage() {
    const savedCart = localStorage.getItem("pink_venue_cart");
    const savedVenue = localStorage.getItem("pink_venue_data");

    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    if (savedVenue) {
        venueData = JSON.parse(savedVenue);
    }
}

function saveToStorage() {
    localStorage.setItem("pink_venue_cart", JSON.stringify(cart));
    localStorage.setItem("pink_venue_data", JSON.stringify(venueData));
}

// --- 3. DİNAMİK RENDER FUNKSİYALARI ---
function renderSeats() {
    const stageHTML = venueMap.querySelector(".stage").outerHTML;
    venueMap.innerHTML = stageHTML;

    venueData.forEach(seatObj => {
        const seatBtn = document.createElement("button");
        
        // Klası təyin edirik (əgər həm də inspeksiya olunursa)
        let currentClass = seatObj.status;
        if (selectedSeat && selectedSeat.id === seatObj.id && seatObj.status === "available") {
            currentClass = "inspected";
        }

        seatBtn.className = `seat ${currentClass}`;
        seatBtn.innerText = seatObj.id;
        seatBtn.dataset.id = seatObj.id;

        if (seatObj.status === "unavailable") {
            seatBtn.disabled = true;
        }

        // Click hadisəsi
        seatBtn.addEventListener("click", () => {
            inspectSeat(seatObj.id);
        });

        venueMap.appendChild(seatBtn);
    });
}

function inspectSeat(seatId) {
    const seatObj = venueData.find(s => s.id === seatId);
    if (!seatObj) return;

    if (seatObj.status === "in-cart") {
        seatDetailsDiv.innerHTML = `<p style="color: #c71585; font-weight: 500;">🎀 This ticket is already in your cart!</p>`;
        addToCartBtn.disabled = true;
        selectedSeat = null;
        renderSeats();
        return;
    }

    selectedSeat = seatObj;
    renderSeats(); // Seçiilmiş oturacağı 'inspected' rənginə boyamaq üçün

    seatDetailsDiv.innerHTML = `
        <p><strong>Seat ID:</strong> ${seatObj.id}</p>
        <p><strong>Zone:</strong> ${seatObj.section}</p>
        <p><strong>Row:</strong> ${seatObj.row} | <strong>Seat:</strong> ${seatObj.seat}</p>
        <p><strong>Price:</strong> <span style="color:#d87093; font-weight:bold;">${seatObj.price} AZN</span></p>
    `;

    addToCartBtn.disabled = false;
}

function renderCart() {
    cartItemsList.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = `<li class="placeholder-text" style="padding: 10px 0;">Your cart is currently empty.</li>`;
    }

    cart.forEach(item => {
        total += item.price;
        const li = document.createElement("li");
        li.className = "cart-item";

        li.innerHTML = `
            <span><strong>${item.id}</strong> (${item.section}) - ${item.price} AZN</span>
            <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
        `;
        cartItemsList.appendChild(li);
    });

    totalPriceSpan.innerText = total.toFixed(2);
}

// --- 4. SƏBƏT HƏRƏKƏTLƏRİ (ADD & REMOVE) ---
addToCartBtn.addEventListener("click", () => {
    if (!selectedSeat) return;

    // Duplikasiya önləmə
    if (cart.some(item => item.id === selectedSeat.id)) {
        alert("This seat is already in your cart!");
        return;
    }

    selectedSeat.status = "in-cart";
    cart.push(selectedSeat);

    saveToStorage();
    
    selectedSeat = null;
    seatDetailsDiv.innerHTML = `<p class="placeholder-text">Click any available seat to inspect its details and price.</p>`;
    addToCartBtn.disabled = true;

    renderSeats();
    renderCart();
});

window.removeFromCart = function(seatId) {
    cart = cart.filter(item => item.id !== seatId);

    const seatObj = venueData.find(s => s.id === seatId);
    if (seatObj) {
        seatObj.status = "available";
    }

    saveToStorage();
    renderSeats();
    renderCart();

    if (selectedSeat && selectedSeat.id === seatId) {
        selectedSeat = null;
        seatDetailsDiv.innerHTML = `<p class="placeholder-text">Click any available seat to inspect its details and price.</p>`;
        addToCartBtn.disabled = true;
    }
};

// --- 5. NAVİQASİYA (ZOOM & PAN) MƏNTİQİ ---
let currentZoom = 1;
let translateX = 0;
let translateY = 0;

function updateMapTransform() {
    venueMap.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    venueMap.style.transformOrigin = "center center";
}

document.getElementById("zoom-in").addEventListener("click", () => {
    if (currentZoom < 1.8) {
        currentZoom += 0.15;
        updateMapTransform();
    }
});

document.getElementById("zoom-out").addEventListener("click", () => {
    if (currentZoom > 0.6) {
        currentZoom -= 0.15;
        updateMapTransform();
    }
});

document.getElementById("move-up").addEventListener("click", () => {
    translateY -= 35;
    updateMapTransform();
});

document.getElementById("move-down").addEventListener("click", () => {
    translateY += 35;
    updateMapTransform();
});

document.getElementById("move-left").addEventListener("click", () => {
    translateX -= 35;
    updateMapTransform();
});

document.getElementById("move-right").addEventListener("click", () => {
    translateX += 35;
    updateMapTransform();
});

document.getElementById("reset-view").addEventListener("click", () => {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    updateMapTransform();
});

// --- İLİKİN YÜKLƏNMƏ ---
loadFromStorage();
renderSeats();
renderCart();
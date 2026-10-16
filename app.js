// 1. Məkan və Oturacaqlar üçün Verilənlər Modeli
let venueData = [
    { id: "A1", section: "VIP", row: "A", seat: 1, price: 100, status: "available" },
    { id: "A2", section: "VIP", row: "A", seat: 2, price: 100, status: "available" },
    { id: "A3", section: "VIP", row: "A", seat: 3, price: 100, status: "unavailable" },
    { id: "A4", section: "VIP", row: "A", seat: 4, price: 100, status: "available" },
    
    { id: "B1", section: "Standard", row: "B", seat: 1, price: 50, status: "available" },
    { id: "B2", section: "Standard", row: "B", seat: 2, price: 50, status: "available" },
    { id: "B3", section: "Standard", row: "B", seat: 3, price: 50, status: "available" },
    { id: "B4", section: "Standard", row: "B", seat: 4, price: 50, status: "unavailable" },

    { id: "C1", section: "Economy", row: "C", seat: 1, price: 25, status: "available" },
    { id: "C2", section: "Economy", row: "C", seat: 2, price: 25, status: "available" },
    { id: "C3", section: "Economy", row: "C", seat: 3, price: 25, status: "available" },
    { id: "C4", section: "Economy", row: "C", seat: 4, price: 25, status: "available" }
];

let selectedSeat = null; // Hazırda yoxlanılan oturacaq
let cart = []; // Səbətdəki biletlər

// DOM Elementləri
const venueMap = document.getElementById("venue-map");
const seatDetailsDiv = document.getElementById("seat-details");
const addToCartBtn = document.getElementById("add-to-cart-btn");
const cartItemsList = document.getElementById("cart-items");
const totalPriceSpan = document.getElementById("total-price");

// 2. localStorage-dən məlumatları yükləmək (Səhifə yenilənəndə bərpa)
function loadFromStorage() {
    const savedCart = localStorage.getItem("venue_cart");
    const savedVenue = localStorage.getItem("venue_data");

    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    if (savedVenue) {
        venueData = JSON.parse(savedVenue);
    }
}

// 3. Məlumatları localStorage-də yadda saxlamaq
function saveToStorage() {
    localStorage.setItem("venue_cart", JSON.stringify(cart));
    localStorage.setItem("venue_data", JSON.stringify(venueData));
}

// 4. Oturacaqları xəritədə dinamik render etmək
function renderSeats() {
    const stageHTML = venueMap.querySelector(".stage").outerHTML;
    venueMap.innerHTML = stageHTML;

    venueData.forEach(seatObj => {
        const seatBtn = document.createElement("button");
        seatBtn.classList.add("seat", seatObj.status);
        seatBtn.innerText = seatObj.id;
        seatBtn.dataset.id = seatObj.id;

        if (seatObj.status === "unavailable" || seatObj.status === "in-cart") {
            seatBtn.disabled = (seatObj.status === "unavailable"); // Səbətdəkidirsə sadəcə kliklənir amma yenidən əlavə oluna bilməz
        }

        seatBtn.addEventListener("click", () => {
            inspectSeat(seatObj.id);
        });

        venueMap.appendChild(seatBtn);
    });
}

// 5. Oturacaq detallarını göstərmək (Inspection)
function inspectSeat(seatId) {
    const seatObj = venueData.find(s => s.id === seatId);
    if (!seatObj) return;

    // Əgər oturacaq artıq səbətdədirsə, inspeksiya zamanı xəbərdarlıq edə bilərik
    if (seatObj.status === "in-cart") {
        seatDetailsDiv.innerHTML = `<p style="color: #d9534f;">This seat is already in your cart.</p>`;
        addToCartBtn.disabled = true;
        return;
    }

    selectedSeat = seatObj;

    seatDetailsDiv.innerHTML = `
        <p><strong>Seat ID:</strong> ${seatObj.id}</p>
        <p><strong>Section:</strong> ${seatObj.section}</p>
        <p><strong>Row:</strong> ${seatObj.row} | <strong>Seat:</strong> ${seatObj.seat}</p>
        <p><strong>Price:</strong> ${seatObj.price} AZN</p>
    `;

    addToCartBtn.disabled = false;
}

// 6. Səbəti yeniləmək və ekranda göstərmək
function renderCart() {
    cartItemsList.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = "<li>Your cart is empty.</li>";
    }

    cart.forEach(item => {
        total += item.price;
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.marginBottom = "8px";
        li.style.padding = "5px";
        li.style.background = "#fff";
        li.style.border = "1px solid #ddd";
        li.style.borderRadius = "4px";

        li.innerHTML = `
            <span>Seat ${item.id} (${item.section}) - ${item.price} AZN</span>
            <button onclick="removeFromCart('${item.id}')" style="background: #dc3545; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer;">Remove</button>
        `;
        cartItemsList.appendChild(li);
    });

    totalPriceSpan.innerText = total.toFixed(2);
}

// 7. ADD TO CART Düyməsi Funksionallığı
addToCartBtn.addEventListener("click", () => {
    if (!selectedSeat) return;

    // Təkrar əlavə olunmanın qarşısını almaq (Prevent duplicate)
    if (cart.some(item => item.id === selectedSeat.id)) {
        alert("This seat is already in your cart!");
        return;
    }

    // Oturacaq statusunu dəyişirik
    selectedSeat.status = "in-cart";
    cart.push(selectedSeat);

    // Yaddaşı yeniləyirik
    saveToStorage();

    // Ekranı yeniləyirik
    renderSeats();
    renderCart();

    // Paneli təmizləyirik
    selectedSeat = null;
    seatDetailsDiv.innerHTML = `<p>Select a seat to view details.</p>`;
    addToCartBtn.disabled = true;
});

// 8. Səbətdən Silmək (Remove) və Xəritəni Sinxronlaşdırmaq
window.removeFromCart = function(seatId) {
    // Səbətdən çıxarırıq
    cart = cart.filter(item => item.id !== seatId);

    // Xəritədəki oturacağın statusunu yenidən 'available' edirik
    const seatObj = venueData.find(s => s.id === seatId);
    if (seatObj) {
        seatObj.status = "available";
    }

    // Yaddaşı və ekranı yeniləyirik
    saveToStorage();
    renderSeats();
    renderCart();

    // Əgər silinən oturacaq hal-hazırda paneldə seçilibsə təmizləyirik
    if (selectedSeat && selectedSeat.id === seatId) {
        selectedSeat = null;
        seatDetailsDiv.innerHTML = `<p>Select a seat to view details.</p>`;
        addToCartBtn.disabled = true;
    }
};

// Səhifə açılan kimi işə düşən əsas funksiya
loadFromStorage();
renderSeats();
renderCart();
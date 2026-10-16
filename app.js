// 1. Məkan və Oturacaqlar üçün Verilənlər Modeli (Data Model)
const venueData = [
    // VIP Zona (Cərgə A - Qiymət: 100 AZN)
    { id: "A1", section: "VIP", row: "A", seat: 1, price: 100, status: "available" },
    { id: "A2", section: "VIP", row: "A", seat: 2, price: 100, status: "available" },
    { id: "A3", section: "VIP", row: "A", seat: 3, price: 100, status: "unavailable" }, // Dolu oturacaq nümunəsi
    { id: "A4", section: "VIP", row: "A", seat: 4, price: 100, status: "available" },
    
    // Standard Zona (Cərgə B - Qiymət: 50 AZN)
    { id: "B1", section: "Standard", row: "B", seat: 1, price: 50, status: "available" },
    { id: "B2", section: "Standard", row: "B", seat: 2, price: 50, status: "available" },
    { id: "B3", section: "Standard", row: "B", seat: 3, price: 50, status: "available" },
    { id: "B4", section: "Standard", row: "B", seat: 4, price: 50, status: "unavailable" },

    // Economy Zona (Cərgə C - Qiymət: 25 AZN)
    { id: "C1", section: "Economy", row: "C", seat: 1, price: 25, status: "available" },
    { id: "C2", section: "Economy", row: "C", seat: 2, price: 25, status: "available" },
    { id: "C3", section: "Economy", row: "C", seat: 3, price: 25, status: "available" },
    { id: "C4", section: "Economy", row: "C", seat: 4, price: 25, status: "available" }
];

let selectedSeat = null; // Hazırda yoxlanılan (inspected) oturacaq
let cart = []; // Səbətdəki biletlər

// DOM Elementləri
const venueMap = document.getElementById("venue-map");
const seatDetailsDiv = document.getElementById("seat-details");
const addToCartBtn = document.getElementById("add-to-cart-btn");

// 2. Oturacaqları xəritədə dinamik olaraq yaratmaq (Render)
function renderSeats() {
    // Səhnə elementini saxlayıb qalan köhnə oturacaqları təmizləyirik
    const stageHTML = venueMap.querySelector(".stage").outerHTML;
    venueMap.innerHTML = stageHTML;

    // Hər bir oturacaq üçün <button> elementi yaradırıq
    venueData.forEach(seatObj => {
        const seatBtn = document.createElement("button");
        seatBtn.classList.add("seat", seatObj.status);
        seatBtn.innerText = seatObj.id;
        seatBtn.dataset.id = seatObj.id;

        // Əgər oturacaq unavailable-dırsa, kliklənməsin
        if (seatObj.status === "unavailable") {
            seatBtn.disabled = true;
        }

        // Oturacağa klikləmə hadisəsi (Inspection)
        seatBtn.addEventListener("click", () => {
            inspectSeat(seatObj.id);
        });

        venueMap.appendChild(seatBtn);
    });
}

// 3. Oturacaq detallarını göstərmək (Inspection Məntiqi)
function inspectSeat(seatId) {
    const seatObj = venueData.find(s => s.id === seatId);
    if (!seatObj || seatObj.status === "in-cart") return;

    selectedSeat = seatObj;

    // Detalları paneldə əks etdiririk
    seatDetailsDiv.innerHTML = `
        <p><strong>Seat ID:</strong> ${seatObj.id}</p>
        <p><strong>Section:</strong> ${seatObj.section}</p>
        <p><strong>Row:</strong> ${seatObj.row} | <strong>Seat:</strong> ${seatObj.seat}</p>
        <p><strong>Price:</strong> ${seatObj.price} AZN</p>
    `;

    // ADD TO CART düyməsini aktivləşdiririk
    addToCartBtn.disabled = false;
}

// Səhifə açılan kimi oturacaqları yükləyirik
renderSeats();
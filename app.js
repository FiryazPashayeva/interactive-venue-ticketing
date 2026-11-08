"use strict";

// --- 1. VENUE DATA: seats are generated from this configuration ---
const SECTIONS = [
    { id: "vip",      name: "VIP Princess",  price: 120, rows: ["A", "B", "C"],           perRow: 12 },
    { id: "premium",  name: "Royal Sweet",   price: 80,  rows: ["D", "E", "F", "G"],      perRow: 16 },
    { id: "standard", name: "Fairy Balcony", price: 45,  rows: ["H", "I", "J", "K", "L"], perRow: 20 }
];
const KEY = "venue_cart_v2";
const MIN_Z = 0.3, MAX_Z = 2.5, STEP = 40;

const $ = id => document.getElementById(id);
const viewport = $("map-viewport"), map = $("venue-map"), details = $("seat-details"),
      addBtn = $("add-to-cart-btn"), cartList = $("cart-items"), totalEl = $("total-price"),
      countEl = $("cart-count"), toastEl = $("toast");

const seats = [];
const seatById = new Map();
const buttons = new Map();
const cartIds = new Set();     // single source of truth for the cart
let inspectedId = null;

function buildVenue() {
    SECTIONS.forEach(sec => sec.rows.forEach((row, r) => {
        for (let n = 1; n <= sec.perRow; n++) {
            const seat = { id: row + n, sectionId: sec.id, section: sec.name, row, number: n,
                           price: sec.price, taken: (r * 7 + n * 13) % 11 === 0 };
            seats.push(seat);
            seatById.set(seat.id, seat);
        }
    }));
}

// Seat state is always calculated, never stored by hand
function getStatus(seat) {
    if (seat.taken) return "unavailable";
    if (cartIds.has(seat.id)) return "in-cart";
    if (seat.id === inspectedId) return "inspected";
    return "available";
}

// --- 2. RENDERING (venue is built once, then only classes change) ---
function renderVenue() {
    SECTIONS.forEach(sec => {
        const zone = document.createElement("section");
        zone.className = "zone zone-" + sec.id;
        zone.innerHTML = `<h3>${sec.name} <span>${sec.price} AZN</span></h3>`;
        sec.rows.forEach(row => {
            const rowEl = document.createElement("div");
            rowEl.className = "row";
            rowEl.innerHTML = `<span class="row-label">${row}</span>`;
            for (let n = 1; n <= sec.perRow; n++) {
                if (n === sec.perRow / 2 + 1) rowEl.insertAdjacentHTML("beforeend", '<span class="aisle"></span>');
                const seat = seatById.get(row + n);
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "seat " + getStatus(seat);
                btn.textContent = seat.number;
                btn.dataset.id = seat.id;
                btn.disabled = seat.taken;
                btn.setAttribute("aria-label", `Seat ${seat.id}, ${seat.section}, ${seat.price} AZN`);
                buttons.set(seat.id, btn);
                rowEl.appendChild(btn);
            }
            zone.appendChild(rowEl);
        });
        map.appendChild(zone);
    });
}

function updateSeat(id) {
    const seat = seatById.get(id), btn = buttons.get(id);
    if (seat && btn) btn.className = "seat " + getStatus(seat);
}

function resetDetails() {
    details.innerHTML = '<p class="placeholder">Click any available seat to see its details and price.</p>';
    addBtn.disabled = true;
    addBtn.textContent = "ADD TO CART";
}

function showDetails(seat) {
    const inCart = cartIds.has(seat.id);
    details.innerHTML = `
        <p><strong>Seat:</strong> ${seat.id}</p>
        <p><strong>Zone:</strong> ${seat.section}</p>
        <p><strong>Row:</strong> ${seat.row} | <strong>Seat no.:</strong> ${seat.number}</p>
        <p><strong>Price:</strong> <span class="price">${seat.price} AZN</span></p>`;
    addBtn.disabled = inCart;
    addBtn.textContent = inCart ? "ALREADY IN CART" : "ADD TO CART";
}

function renderCart() {
    let total = 0;
    cartList.innerHTML = cartIds.size ? "" : '<li class="placeholder cart-item">Your cart is empty.</li>';
    cartIds.forEach(id => {
        const s = seatById.get(id);
        total += s.price;
        cartList.insertAdjacentHTML("beforeend", `
            <li class="cart-item">
                <span><strong>${s.id}</strong> ${s.section}</span>
                <span>${s.price} AZN</span>
                <button type="button" class="remove-btn" data-remove="${s.id}" aria-label="Remove seat ${s.id}">Remove</button>
            </li>`);
    });
    totalEl.textContent = total.toFixed(2);
    countEl.textContent = cartIds.size;
}

let toastTimer;
function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

// --- 3. ACTIONS ---
function inspectSeat(id) {
    const prev = inspectedId;
    inspectedId = id;
    if (prev) updateSeat(prev);
    updateSeat(id);
    showDetails(seatById.get(id));
}

function addToCart() {
    const seat = seatById.get(inspectedId);
    if (!seat || seat.taken) return;
    if (cartIds.has(seat.id)) { toast("This seat is already in your cart."); return; }
    cartIds.add(seat.id);
    inspectedId = null;
    save();
    updateSeat(seat.id);
    resetDetails();
    renderCart();
}

function removeFromCart(id) {
    cartIds.delete(id);
    save();
    updateSeat(id);
    renderCart();
    if (inspectedId === id) showDetails(seatById.get(id));
}

addBtn.addEventListener("click", addToCart);
cartList.addEventListener("click", e => {
    const btn = e.target.closest("[data-remove]");
    if (btn) removeFromCart(btn.dataset.remove);
});
map.addEventListener("click", e => {
    const btn = e.target.closest(".seat");
    if (moved) { moved = false; return; }          // a drag must not select a seat
    if (btn && !btn.disabled) inspectSeat(btn.dataset.id);
});

// --- 4. LOCALSTORAGE: only seat IDs are saved ---
function save() {
    try { localStorage.setItem(KEY, JSON.stringify([...cartIds])); } catch (e) { /* storage unavailable */ }
}
function load() {
    try {
        (JSON.parse(localStorage.getItem(KEY)) || []).forEach(id => {
            const s = seatById.get(id);
            if (s && !s.taken) cartIds.add(id);    // ignore invalid or taken seats
        });
    } catch (e) { localStorage.removeItem(KEY); }
}

// --- 5. NAVIGATION: zoom, move, reset ---
let zoom = 1, tx = 0, ty = 0;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function applyView() {
    const mx = map.offsetWidth * zoom / 2, my = map.offsetHeight * zoom / 2;
    tx = clamp(tx, -mx, mx);
    ty = clamp(ty, -my, my);
    map.style.transform = `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${zoom})`;
}
function zoomBy(f) { zoom = clamp(zoom * f, MIN_Z, MAX_Z); applyView(); }
function moveBy(dx, dy) { tx += dx; ty += dy; applyView(); }
function resetView() {
    const fit = Math.min(viewport.clientWidth / (map.offsetWidth + 30), viewport.clientHeight / (map.offsetHeight + 30), 1.5);
    zoom = clamp(fit, MIN_Z, MAX_Z);
    tx = ty = 0;
    applyView();
}

$("zoom-in").addEventListener("click", () => zoomBy(1.2));
$("zoom-out").addEventListener("click", () => zoomBy(1 / 1.2));
$("move-up").addEventListener("click", () => moveBy(0, -STEP));
$("move-down").addEventListener("click", () => moveBy(0, STEP));
$("move-left").addEventListener("click", () => moveBy(-STEP, 0));
$("move-right").addEventListener("click", () => moveBy(STEP, 0));
$("reset-view").addEventListener("click", resetView);

// --- 6. BONUS: mouse-wheel zoom and click/drag panning (pointer events also work on touch) ---
let drag = null, moved = false;
viewport.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, tx, ty };
    moved = false;
});
window.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;  // small movement is still a click
    moved = true;
    viewport.classList.add("dragging");
    tx = drag.tx + dx;
    ty = drag.ty + dy;
    applyView();
});
window.addEventListener("pointerup", () => { drag = null; viewport.classList.remove("dragging"); });
viewport.addEventListener("wheel", e => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1);
}, { passive: false });
window.addEventListener("resize", resetView);
window.addEventListener("load", resetView);

// --- INIT ---
buildVenue();
load();
renderVenue();
renderCart();
resetDetails();
resetView();

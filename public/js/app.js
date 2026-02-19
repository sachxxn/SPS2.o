// ============================================
// SMART PARKING SYSTEM - FRONTEND JAVASCRIPT (FINAL ADMIN VERSION)
// File: public/js/app.js
// ============================================

const API = 'http://localhost:3000/api';

// ── ADMIN MODE DETECTION ──
// Open as admin: index.html?admin=true
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get("admin") === "true";

// ── LOCAL SLOT STATE (synced from MongoDB) ──
let slots = {
    'F1-S1': { occupied: false, carNumber: '', mobile: '' },
    'F1-S2': { occupied: false, carNumber: '', mobile: '' },
    'F1-S3': { occupied: false, carNumber: '', mobile: '' },
    'F2-S1': { occupied: false, carNumber: '', mobile: '' },
    'F2-S2': { occupied: false, carNumber: '', mobile: '' },
    'F2-S3': { occupied: false, carNumber: '', mobile: '' }
};

let selectedSlot = '';

// ── DIRECTIONS DATA ──
const directions = {
    'F1-S1': { title: 'First Floor – Slot 1', steps: ['Enter through the main entrance gate', 'Take the ramp/stairs to the FIRST FLOOR', 'Turn LEFT immediately after reaching the floor', 'Walk STRAIGHT ~20 metres', 'Your car is in SLOT 1 — first spot on the left'] },
    'F1-S2': { title: 'First Floor – Slot 2', steps: ['Enter through the main entrance gate', 'Take the ramp/stairs to the FIRST FLOOR', 'Turn LEFT immediately after reaching the floor', 'Walk STRAIGHT ~30 metres', 'Your car is in SLOT 2 — middle spot on the left'] },
    'F1-S3': { title: 'First Floor – Slot 3', steps: ['Enter through the main entrance gate', 'Take the ramp/stairs to the FIRST FLOOR', 'Turn LEFT immediately after reaching the floor', 'Walk to the END ~40 metres', 'Your car is in SLOT 3 — last spot on the left'] },
    'F2-S1': { title: 'Second Floor – Slot 1', steps: ['Enter through the main entrance gate', 'Go UP to the SECOND FLOOR', 'Turn RIGHT after reaching the floor', 'Walk STRAIGHT ~20 metres', 'Your car is in SLOT 1 — first spot on the right'] },
    'F2-S2': { title: 'Second Floor – Slot 2', steps: ['Enter through the main entrance gate', 'Go UP to the SECOND FLOOR', 'Turn RIGHT after reaching the floor', 'Walk STRAIGHT ~30 metres', 'Your car is in SLOT 2 — middle spot on the right'] },
    'F2-S3': { title: 'Second Floor – Slot 3', steps: ['Enter through the main entrance gate', 'Go UP to the SECOND FLOOR', 'Turn RIGHT after reaching the floor', 'Walk to the END ~40 metres', 'Your car is in SLOT 3 — last spot on the right'] }
};

const slotIndexMap = { 'F1-S1': 0, 'F1-S2': 1, 'F1-S3': 2, 'F2-S1': 3, 'F2-S2': 4, 'F2-S3': 5 };

// ── INIT ──
window.onload = async () => {

    // Hide DB status completely for normal users
    if (!isAdmin) {
        const dbStatus = document.getElementById('dbStatus');
        if (dbStatus) dbStatus.style.display = "none";
    }

    // Mobile input validation
    document.getElementById('mobileNumber').addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        const n = e.target.value.length;
        document.getElementById('mobileCount').textContent = n + ' / 10 digits' + (n === 10 ? ' ✓' : '');
    });

    await loadSlotsFromDB();
    setInterval(loadSlotsFromDB, 5000); // Auto refresh every 5 sec
};

// ── LOAD SLOTS FROM DATABASE ──
async function loadSlotsFromDB() {
    try {
        const res = await fetch(API + '/slots');
        const data = await res.json();

        if (data.success) {

            // Only admin sees DB connection status
            if (isAdmin) setDbStatus(true);

            data.slots.forEach(function (s) {
                if (slots[s.slotId] !== undefined) {
                    slots[s.slotId] = {
                        occupied: s.occupied,
                        carNumber: s.carNumber,
                        mobile: s.mobile
                    };
                }
            });

            renderSlotSelector();
            renderParkingDisplay();
            updateStats();
        }
    } catch (err) {
        if (isAdmin) setDbStatus(false);
        console.error("Server not reachable:", err);
    }
}

// ── DB STATUS (ADMIN ONLY) ──
function setDbStatus(connected) {
    if (!isAdmin) return; // BLOCK for normal users

    var el = document.getElementById('dbStatus');
    var text = document.getElementById('dbStatusText');
    if (!el || !text) return;

    if (connected) {
        el.style.display = "flex";
        el.className = 'db-status connected';
        text.textContent = '● Database Connected (MongoDB)';
    } else {
        el.style.display = "flex";
        el.className = 'db-status disconnected';
        text.textContent = '✕ Server Offline - Run: node server.js';
    }
}

// ── MODAL ──
function showModal(title, msg, icon = '✅', titleColor = '') {
    document.getElementById('mIcon').textContent = icon;
    document.getElementById('mTitle').textContent = title;
    document.getElementById('mTitle').style.color = titleColor;
    document.getElementById('mMsg').textContent = msg;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// ── MESSAGE BOX ──
function showMessage(msg, type) {
    var box = document.getElementById('messageBox');
    box.className = type;
    box.style.display = 'block';
    box.innerHTML = msg;
}

function hideMessage() {
    var box = document.getElementById('messageBox');
    box.style.display = 'none';
    box.innerHTML = '';
}

// ── LOADING STATE ──
function setLoading(btnId, loading, label) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<span class="spinner"></span> Please wait...'
        : label;
}

// ── SLOT SELECTOR ──
function renderSlotSelector() {
    var c = document.getElementById('slotSelector');
    c.innerHTML = '';

    Object.keys(slots).forEach(function (slot) {
        var btn = document.createElement('button');
        var busy = slots[slot].occupied;
        var sel = (selectedSlot === slot);

        btn.className = 'slot-btn' + (sel ? ' selected' : '');
        btn.disabled = busy;
        btn.innerHTML = slot + (busy ? '<br><small>Occupied</small>' : '');

        if (!busy) {
            btn.onclick = function () {
                selectedSlot = slot;
                renderSlotSelector();
            };
        }
        c.appendChild(btn);
    });
}

// ── LIVE PARKING DISPLAY ──
function renderParkingDisplay() {
    var f1 = document.getElementById('floor1');
    var f2 = document.getElementById('floor2');
    f1.innerHTML = '';
    f2.innerHTML = '';

    ['F1-S1', 'F1-S2', 'F1-S3'].forEach(s => f1.appendChild(slotCard(s)));
    ['F2-S1', 'F2-S2', 'F2-S3'].forEach(s => f2.appendChild(slotCard(s)));
}

function slotCard(slot) {
    var d = document.createElement('div');
    var occ = slots[slot].occupied;

    d.className = 'slot-card ' + (occ ? 'occupied' : 'available');
    d.innerHTML =
        '<div class="icon">' + (occ ? '🚗' : '🅿️') + '</div>' +
        '<div class="slot-id">' + slot + '</div>' +
        '<div class="status">' + (occ ? 'Occupied' : 'Available') + '</div>';

    return d;
}

function updateStats() {
    var avail = Object.values(slots).filter(s => !s.occupied).length;
    document.getElementById('statAvail').textContent = avail;
    document.getElementById('statOcc').textContent = 6 - avail;
}

// ── BOOK SLOT ──
async function bookSlot() {
    var car = document.getElementById('carNumber').value.trim().toUpperCase();
    var mobile = document.getElementById('mobileNumber').value.trim();

    if (!car || !mobile || !selectedSlot) {
        showMessage('⚠️ Fill all fields and select a slot.', 'error');
        return;
    }

    setLoading('bookBtn', true, '🎫 Confirm Booking');

    try {
        var res = await fetch(API + '/bookings/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carNumber: car, mobile, slot: selectedSlot })
        });

        var data = await res.json();

        if (data.success) {
            showModal('Booking Successful 🎉', `${car} parked at ${selectedSlot}`);
            selectedSlot = '';
            document.getElementById('carNumber').value = '';
            document.getElementById('mobileNumber').value = '';
            await loadSlotsFromDB();
        } else {
            showMessage('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showMessage('❌ Server not running (Node.js)', 'error');
    }

    setLoading('bookBtn', false, '🎫 Confirm Booking');
}

// ── ADMIN POWER: FORCE CHECKOUT (FOR UNCHECKED VEHICLES) ──
async function checkoutCar() {
    var car = document.getElementById('checkoutNumber').value.trim().toUpperCase();

    if (!car) {
        showMessage('⚠️ Enter car number.', 'error');
        return;
    }

    // Extra admin confirmation
    if (isAdmin) {
        const confirmAdmin = confirm("Admin Action: Force checkout this vehicle?");
        if (!confirmAdmin) return;
    }

    setLoading('checkoutBtn', true, '🚪 Checkout');

    try {
        var res = await fetch(API + '/bookings/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carNumber: car })
        });

        var data = await res.json();

        if (data.success) {
            showModal('Vehicle Removed 🚗', `${car} checked out successfully.`);
            document.getElementById('checkoutNumber').value = '';
            await loadSlotsFromDB();
        } else {
            showMessage('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showMessage('❌ Cannot connect to server.', 'error');
    }

    setLoading('checkoutBtn', false, '🚪 Checkout & Release Slot');
}

// ── HISTORY ──
async function loadHistory() {
    try {
        const res = await fetch(API + '/history');
        const data = await res.json();

        if (!data.success) return;

        let rows = data.history.map(h => `
            <tr>
                <td>${new Date(h.timestamp).toLocaleString()}</td>
                <td><b>${h.carNumber}</b></td>
                <td>${h.slot}</td>
                <td>${h.mobile}</td>
                <td>${h.action}</td>
            </tr>
        `).join('');

        document.getElementById('historyContent').innerHTML =
            `<table class="history-table">
                <thead>
                    <tr><th>Time</th><th>Car</th><th>Slot</th><th>Mobile</th><th>Action</th></tr>
                </thead>
                <tbody>${rows || '<tr><td colspan="5">No history</td></tr>'}</tbody>
            </table>`;
    } catch (err) {
        document.getElementById('historyContent').innerHTML =
            '<p>Server not running.</p>';
    }
}

// ── TABS ──
function showTab(tab) {
    const map = { book: 'secBook', find: 'secFind', checkout: 'secCheckout', history: 'secHistory' };
    const tabMap = { book: 'tabBook', find: 'tabFind', checkout: 'tabCheckout', history: 'tabHistory' };

    Object.keys(map).forEach(t => {
        document.getElementById(map[t]).classList.toggle('hidden', t !== tab);
        document.getElementById(tabMap[t]).classList.toggle('active', t === tab);
    });

    if (tab === 'history') loadHistory();
    hideMessage();
}

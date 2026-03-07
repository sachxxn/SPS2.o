// ============================================
// SMART PARKING SYSTEM - FRONTEND JAVASCRIPT (FINAL ADMIN VERSION)
// File: public/js/app.js
// ============================================

const API = '/api';

// ── ADMIN MODE ──
const ADMIN_PASSWORD = 'smart123';
let isAdmin = false;
let appInitialized = false;

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

// ── ENTRY SCREEN: ROLE SELECTION ──
function enterAsCustomer() {
    document.getElementById('entryScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    isAdmin = false;
    if (!appInitialized) initApp();
}

function showAdminLogin() {
    // Show inline password field on the entry card
    const loginDiv = document.getElementById('inlineAdminLogin');
    const arrow = document.getElementById('adminArrow');
    if (loginDiv.classList.contains('hidden')) {
        loginDiv.classList.remove('hidden');
        if (arrow) arrow.style.display = 'none';
        document.getElementById('entryAdminPassword').focus();
        // Remove onclick from card so clicking the card doesn't re-trigger
        document.getElementById('adminCard').onclick = null;
    }
}

function submitAdminLogin() {
    const pwd = document.getElementById('entryAdminPassword').value;
    const errorDiv = document.getElementById('entryAdminError');

    if (pwd === ADMIN_PASSWORD) {
        // Success — enter as admin
        isAdmin = true;
        document.getElementById('entryScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        // Show admin panel, badge, DB status
        const adminPanel = document.getElementById('adminPanel');
        const adminBadge = document.getElementById('adminBadge');
        const dbStatus = document.getElementById('dbStatus');
        const dbBadge = document.getElementById('dbBadge');
        if (adminPanel) adminPanel.classList.remove('hidden');
        if (adminBadge) adminBadge.style.display = 'inline-block';
        if (dbStatus) dbStatus.style.display = 'flex';
        if (dbBadge) dbBadge.style.display = 'inline-block';

        // Show History Tab for Admin
        const tabHistory = document.getElementById('tabHistory');
        if (tabHistory) tabHistory.style.display = 'inline-block';

        if (!appInitialized) initApp();
        refreshActiveVehicles();

        if (!appInitialized) initApp();
        refreshActiveVehicles();
    } else {
        // Wrong password
        errorDiv.textContent = '❌ Wrong password! Try again.';
        errorDiv.classList.remove('hidden');
        document.getElementById('entryAdminPassword').focus();
    }
    // Clear password field in BOTH situations
    document.getElementById('entryAdminPassword').value = '';
}

function cancelAdminLogin(e) {
    e.stopPropagation();
    const loginDiv = document.getElementById('inlineAdminLogin');
    const arrow = document.getElementById('adminArrow');
    const errorDiv = document.getElementById('entryAdminError');
    loginDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    if (arrow) arrow.style.display = '';
    document.getElementById('entryAdminPassword').value = '';
    // Restore onclick
    document.getElementById('adminCard').onclick = showAdminLogin;
}

function backToEntry() {
    // Reset state and go back to entry
    isAdmin = false;
    const dbStatus = document.getElementById('dbStatus');
    const dbBadge = document.getElementById('dbBadge');
    const adminBadge = document.getElementById('adminBadge');
    const adminLoginPanel = document.getElementById('adminLoginPanel');
    const adminPanel = document.getElementById('adminPanel');

    if (dbStatus) dbStatus.style.display = 'none';
    if (dbBadge) dbBadge.style.display = 'none';
    if (adminBadge) adminBadge.style.display = 'none';
    if (adminLoginPanel) adminLoginPanel.classList.add('hidden');
    if (adminPanel) adminPanel.classList.add('hidden');

    // Hide History Tab when switching back
    const tabHistory = document.getElementById('tabHistory');
    if (tabHistory) tabHistory.style.display = 'none';

    // Default to Book tab
    showTab('book');

    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('entryScreen').classList.remove('hidden');

    // Clear password fields when returning to entry
    if (document.getElementById('entryAdminPassword')) document.getElementById('entryAdminPassword').value = '';
    if (document.getElementById('adminPassword')) document.getElementById('adminPassword').value = '';
}

// ── INIT APP (called once after role selection) ──
function initApp() {
    appInitialized = true;

    // Mobile input validation
    document.getElementById('mobileNumber').addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        const n = e.target.value.length;
        document.getElementById('mobileCount').textContent = n + ' / 10 digits' + (n === 10 ? ' ✓' : '');
    });

    loadSlotsFromDB();
    setInterval(loadSlotsFromDB, 5000); // Auto refresh every 5 sec

    // Force clear password fields on load to prevent browser cache/autofill
    const entryPwd = document.getElementById('entryAdminPassword');
    const adminPwd = document.getElementById('adminPassword');
    if (entryPwd) entryPwd.value = '';
    if (adminPwd) adminPwd.value = '';
}

// ── ADMIN VERIFICATION ──
function verifyAdmin() {
    const enteredPassword = document.getElementById('adminPassword').value;

    if (enteredPassword === ADMIN_PASSWORD) {
        isAdmin = true;

        // Hide login panel
        const adminLoginPanel = document.getElementById('adminLoginPanel');
        if (adminLoginPanel) adminLoginPanel.classList.add('hidden');

        // Show admin control panel
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.classList.remove('hidden');

        // Show developer database status
        const dbStatus = document.getElementById('dbStatus');
        const dbBadge = document.getElementById('dbBadge');
        if (dbStatus) dbStatus.style.display = "flex";
        if (dbBadge) dbBadge.style.display = "inline-block";

        // Show admin badge in header
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) adminBadge.style.display = "inline-block";

        // Show History Tab for Admin
        const tabHistory = document.getElementById('tabHistory');
        if (tabHistory) tabHistory.style.display = 'inline-block';

        // Load active vehicles
        refreshActiveVehicles();

        // Refresh DB status
        loadSlotsFromDB();

        showModal('Admin Access Granted 🔓', 'Welcome, Administrator! Full control enabled.', '👨‍💻');
        console.log("👨‍💻 Full Admin Access Enabled");
    } else {
        showMessage('❌ Incorrect Password! Access Denied.', 'error');
    }
    // Clear password field
    document.getElementById('adminPassword').value = '';
}

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

    if (mobile.length !== 10) {
        showMessage('⚠️ Mobile number must be exactly 10 digits.', 'error');
        return;
    }

    setLoading('bookBtn', true, '🎫 Confirm Booking');

    try {
        var res = await fetch(API + '/bookings/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carNumber: car, mobile, slot: selectedSlot, slotIndex: slotIndexMap[selectedSlot] })
        });

        var data = await res.json();

        if (data.success) {
            showModal('Booking Successful 🎉', `${car} parked at ${selectedSlot}`);
            selectedSlot = '';
            document.getElementById('carNumber').value = '';
            document.getElementById('mobileNumber').value = '';
            document.getElementById('mobileCount').textContent = '0 / 10 digits';
            await loadSlotsFromDB();
        } else {
            showMessage('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showMessage('❌ Server not running (Node.js)', 'error');
    }

    setLoading('bookBtn', false, '🎫 Confirm Booking');
}

// ── FIND CAR ──
async function findCar() {
    var car = document.getElementById('verifyNumber').value.trim().toUpperCase();

    if (!car) {
        showMessage('⚠️ Enter car number to search.', 'error');
        return;
    }

    setLoading('findBtn', true, '🗺️ Get Directions');

    try {
        var res = await fetch(API + '/bookings/find', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carNumber: car })
        });

        var data = await res.json();

        if (data.success) {
            var dir = directions[data.slot];
            var resultDiv = document.getElementById('dirResult');
            resultDiv.classList.remove('hidden');

            var stepsHtml = dir.steps.map(function (step, i) {
                return '<div class="dir-card"><span style="color:var(--accent);font-weight:700;">' + (i + 1) + '.</span> ' + step + '</div>';
            }).join('');

            resultDiv.innerHTML =
                '<div style="margin-bottom:.75rem;">' +
                '<strong style="color:var(--accent2);">📍 ' + dir.title + '</strong><br>' +
                '<small style="color:var(--muted);">Booked at: ' + new Date(data.bookedAt).toLocaleString() + ' | Mobile: ' + data.mobile + '</small>' +
                '</div>' +
                stepsHtml;

            hideMessage();
        } else {
            document.getElementById('dirResult').classList.add('hidden');
            showMessage('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showMessage('❌ Server not running.', 'error');
    }

    setLoading('findBtn', false, '🗺️ Get Directions');
}

// ── CHECKOUT (USER) ──
async function checkoutCar() {
    var car = document.getElementById('checkoutNumber').value.trim().toUpperCase();

    if (!car) {
        showMessage('⚠️ Enter car number.', 'error');
        return;
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

// ── ADMIN: FORCE CHECKOUT ──
async function forceCheckout() {
    var car = document.getElementById('adminCarNumber').value.trim().toUpperCase();

    if (!car) {
        showMessage('⚠️ Enter car number to force checkout.', 'error');
        return;
    }

    if (!confirm('⚠️ Admin Action: Force checkout vehicle ' + car + '?')) return;

    setLoading('forceCheckoutBtn', true, '🚨 Force Checkout & Free Slot');

    try {
        var res = await fetch(API + '/bookings/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carNumber: car })
        });

        var data = await res.json();

        if (data.success) {
            showModal('Force Checkout Done 🚨', `${car} has been removed. Slot ${data.slot} is free.`, '🚨');
            document.getElementById('adminCarNumber').value = '';
            await loadSlotsFromDB();
            refreshActiveVehicles();
        } else {
            showMessage('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showMessage('❌ Cannot connect to server.', 'error');
    }

    setLoading('forceCheckoutBtn', false, '🚨 Force Checkout & Free Slot');
}

// ── ADMIN: REFRESH ACTIVE VEHICLES ──
async function refreshActiveVehicles() {
    var container = document.getElementById('activeVehicles');
    if (!container) return;

    container.innerHTML = '<span style="color:var(--muted);">Loading...</span>';

    try {
        var res = await fetch(API + '/bookings');
        var data = await res.json();

        if (data.success && data.bookings.length > 0) {
            var rows = data.bookings.map(function (b) {
                return '<tr>' +
                    '<td><b>' + b.carNumber + '</b></td>' +
                    '<td>' + b.slot + '</td>' +
                    '<td>' + b.mobile + '</td>' +
                    '<td>' + new Date(b.bookedAt).toLocaleString() + '</td>' +
                    '</tr>';
            }).join('');

            container.innerHTML =
                '<table class="history-table">' +
                '<thead><tr><th>Car Number</th><th>Slot</th><th>Mobile</th><th>Booked At</th></tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
                '</table>';
        } else {
            container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:1rem;">🅿️ No vehicles currently parked.</p>';
        }
    } catch (err) {
        container.innerHTML = '<p style="color:var(--danger);">❌ Cannot connect to server.</p>';
    }
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
                <td><span class="${h.action === 'BOOKED' ? 'badge-booked' : 'badge-checkout'}">${h.action}</span></td>
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

// ============================================
// SMART PARKING SYSTEM - FRONTEND JAVASCRIPT
// File: public/js/app.js
// ============================================

const API = 'http://localhost:3000/api';

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
    'F1-S1': { title: 'First Floor – Slot 1',  steps: ['Enter through the main entrance gate', 'Take the ramp/stairs to the FIRST FLOOR', 'Turn LEFT immediately after reaching the floor', 'Walk STRAIGHT ~20 metres', 'Your car is in SLOT 1 — first spot on the left', 'Look for F1-S1 marking on the ground'] },
    'F1-S2': { title: 'First Floor – Slot 2',  steps: ['Enter through the main entrance gate', 'Take the ramp/stairs to the FIRST FLOOR', 'Turn LEFT immediately after reaching the floor', 'Walk STRAIGHT ~30 metres', 'Your car is in SLOT 2 — middle spot on the left', 'Look for F1-S2 marking on the ground'] },
    'F1-S3': { title: 'First Floor – Slot 3',  steps: ['Enter through the main entrance gate', 'Take the ramp/stairs to the FIRST FLOOR', 'Turn LEFT immediately after reaching the floor', 'Walk to the END ~40 metres', 'Your car is in SLOT 3 — last spot on the left', 'Look for F1-S3 marking on the ground'] },
    'F2-S1': { title: 'Second Floor – Slot 1', steps: ['Enter through the main entrance gate', 'Go UP to the SECOND FLOOR via ramp/stairs', 'Turn RIGHT immediately after reaching the floor', 'Walk STRAIGHT ~20 metres', 'Your car is in SLOT 1 — first spot on the right', 'Look for F2-S1 marking on the ground'] },
    'F2-S2': { title: 'Second Floor – Slot 2', steps: ['Enter through the main entrance gate', 'Go UP to the SECOND FLOOR via ramp/stairs', 'Turn RIGHT immediately after reaching the floor', 'Walk STRAIGHT ~30 metres', 'Your car is in SLOT 2 — middle spot on the right', 'Look for F2-S2 marking on the ground'] },
    'F2-S3': { title: 'Second Floor – Slot 3', steps: ['Enter through the main entrance gate', 'Go UP to the SECOND FLOOR via ramp/stairs', 'Turn RIGHT immediately after reaching the floor', 'Walk to the END ~40 metres', 'Your car is in SLOT 3 — last spot on the right', 'Look for F2-S3 marking on the ground'] }
};

const slotIndexMap = { 'F1-S1': 0, 'F1-S2': 1, 'F1-S3': 2, 'F2-S1': 3, 'F2-S2': 4, 'F2-S3': 5 };

// ── INIT ──
window.onload = async () => {
    document.getElementById('mobileNumber').addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        const n = e.target.value.length;
        document.getElementById('mobileCount').textContent = n + ' / 10 digits' + (n === 10 ? ' ✓' : '');
    });

    await loadSlotsFromDB();
    setInterval(loadSlotsFromDB, 5000); // auto-refresh every 5 seconds
};

// ── LOAD SLOTS FROM MONGODB ──
async function loadSlotsFromDB() {
    try {
        const res  = await fetch(API + '/slots');
        const data = await res.json();

        if (data.success) {
            setDbStatus(true);
            data.slots.forEach(function (s) {
                if (slots[s.slotId] !== undefined) {
                    slots[s.slotId] = {
                        occupied:  s.occupied,
                        carNumber: s.carNumber,
                        mobile:    s.mobile
                    };
                }
            });
            renderSlotSelector();
            renderParkingDisplay();
            updateStats();
        }
    } catch (err) {
        setDbStatus(false);
    }
}

// ── DB STATUS ──
function setDbStatus(connected) {
    var el   = document.getElementById('dbStatus');
    var text = document.getElementById('dbStatusText');
    if (connected) {
        el.className     = 'db-status connected';
        text.textContent = '● MongoDB Connected — smartparking database';
    } else {
        el.className     = 'db-status disconnected';
        text.textContent = '✕ Cannot reach server. Run: node server.js in your terminal.';
    }
}

// ── MODAL ──
function showModal(title, msg, icon, titleColor) {
    icon       = icon       || '✅';
    titleColor = titleColor || '';
    document.getElementById('mIcon').textContent  = icon;
    document.getElementById('mTitle').textContent = title;
    document.getElementById('mTitle').style.color = titleColor;
    document.getElementById('mMsg').textContent   = msg;
    document.getElementById('modal').classList.add('show');
}
function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// ── MESSAGE BOX ──
function showMessage(msg, type) {
    var box       = document.getElementById('messageBox');
    box.className = type;
    box.innerHTML = msg;
}
function hideMessage() {
    var box       = document.getElementById('messageBox');
    box.className = '';
    box.innerHTML = '';
    box.style.display = 'none';
}

// ── LOADING STATE ──
function setLoading(btnId, loading, label) {
    var btn      = document.getElementById(btnId);
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
        var btn  = document.createElement('button');
        var busy = slots[slot].occupied;
        var sel  = (selectedSlot === slot);

        btn.className = 'slot-btn' + (sel ? ' selected' : '');
        btn.disabled  = busy;
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

// ── PARKING DISPLAY ──
function renderParkingDisplay() {
    var f1 = document.getElementById('floor1');
    var f2 = document.getElementById('floor2');
    f1.innerHTML = '';
    f2.innerHTML = '';
    ['F1-S1', 'F1-S2', 'F1-S3'].forEach(function (s) { f1.appendChild(slotCard(s)); });
    ['F2-S1', 'F2-S2', 'F2-S3'].forEach(function (s) { f2.appendChild(slotCard(s)); });
}

function slotCard(slot) {
    var d   = document.createElement('div');
    var occ = slots[slot].occupied;
    d.className = 'slot-card ' + (occ ? 'occupied' : 'available');
    d.innerHTML =
        '<div class="icon">'    + (occ ? '🚗' : '🅿️') + '</div>' +
        '<div class="slot-id">' + slot                   + '</div>' +
        '<div class="status">'  + (occ ? 'Occupied' : 'Available') + '</div>';
    return d;
}

function updateStats() {
    var avail = Object.values(slots).filter(function (s) { return !s.occupied; }).length;
    document.getElementById('statAvail').textContent = avail;
    document.getElementById('statOcc').textContent   = 6 - avail;
}

// ── BOOK SLOT ──
async function bookSlot() {
    var car    = document.getElementById('carNumber').value.trim().toUpperCase();
    var mobile = document.getElementById('mobileNumber').value.trim();

    if (!car || !mobile || !selectedSlot) {
        showMessage('⚠️ Please fill all fields and select a slot.', 'error');
        return;
    }
    if (mobile.length !== 10) {
        showMessage('⚠️ Mobile number must be exactly 10 digits.', 'error');
        return;
    }

    setLoading('bookBtn', true, '');
    try {
        var res  = await fetch(API + '/bookings/book', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ carNumber: car, mobile: mobile, slot: selectedSlot, slotIndex: slotIndexMap[selectedSlot] })
        });
        var data = await res.json();

        if (data.success) {
            showModal('Slot Booked! 🎉', car + ' confirmed in slot ' + selectedSlot + '. Saved to MongoDB!', '🎉');
            sendToArduino('BOOK:' + car + ':' + mobile + ':' + slotIndexMap[selectedSlot]);
            document.getElementById('carNumber').value    = '';
            document.getElementById('mobileNumber').value = '';
            document.getElementById('mobileCount').textContent = '0 / 10 digits';
            selectedSlot = '';
            hideMessage();
            await loadSlotsFromDB();
        } else {
            showMessage('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showMessage('❌ Cannot connect to server. Make sure Node.js is running.', 'error');
    }
    setLoading('bookBtn', false, '🎫 Confirm Booking');
}

// ── FIND CAR ──
async function findCar() {
    var car = document.getElementById('verifyNumber').value.trim().toUpperCase();

    if (!car) {
        showModal('No Car Number!', 'Please enter your car number to search.', '⚠️', '#fbbf24');
        return;
    }

    setLoading('findBtn', true, '');
    try {
        var res  = await fetch(API + '/bookings/find', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ carNumber: car })
        });
        var data = await res.json();

        if (!data.success) {
            showModal('Car Not Found!', 'No car with number "' + car + '" is registered in the database. Please check the number and try again.', '🚫', '#f87171');
            document.getElementById('dirResult').classList.add('hidden');
        } else {
            hideMessage();
            var d    = directions[data.slot];
            var nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '✅'];
            var time = new Date(data.bookedAt).toLocaleString();

            var stepsHtml = d.steps.map(function (s, i) {
                return '<div class="dir-card"><span>' + nums[i] + '</span><span>' + s + '</span></div>';
            }).join('');

            var html =
                '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.72rem;color:var(--accent);letter-spacing:.12em;text-transform:uppercase;margin-bottom:.75rem;">' +
                '📍 ' + d.title + ' &nbsp;·&nbsp; Booked: ' + time +
                '</div>' +
                stepsHtml +
                '<div style="margin-top:.75rem;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.3);border-radius:8px;padding:.65rem .9rem;font-size:.78rem;color:#fde68a;">' +
                '⚠️ Always park only in your assigned slot.' +
                '</div>';

            var res2 = document.getElementById('dirResult');
            res2.innerHTML = html;
            res2.classList.remove('hidden');
        }
    } catch (err) {
        showMessage('❌ Cannot connect to server. Make sure Node.js is running.', 'error');
    }
    setLoading('findBtn', false, '🗺️ Get Directions');
}

// ── CHECKOUT ──
async function checkoutCar() {
    var car = document.getElementById('checkoutNumber').value.trim().toUpperCase();

    if (!car) {
        showMessage('⚠️ Enter your car number.', 'error');
        return;
    }

    setLoading('checkoutBtn', true, '');
    try {
        var res  = await fetch(API + '/bookings/checkout', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ carNumber: car })
        });
        var data = await res.json();

        if (data.success) {
            showModal('Checkout Complete!', car + ' has exited. Slot is now free. Saved to MongoDB!', '👋');
            sendToArduino('RELEASE:' + (slotIndexMap[data.slot] || 0));
            document.getElementById('checkoutNumber').value = '';
            hideMessage();
            await loadSlotsFromDB();
        } else {
            showMessage('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showMessage('❌ Cannot connect to server. Make sure Node.js is running.', 'error');
    }
    setLoading('checkoutBtn', false, '🚪 Checkout & Release Slot');
}

// ── HISTORY ──
async function loadHistory() {
    try {
        var res  = await fetch(API + '/history');
        var data = await res.json();

        if (data.success) {
            var rows = data.history.map(function (h) {
                var badge = h.action === 'BOOKED' ? 'badge-booked' : 'badge-checkout';
                return '<tr>' +
                    '<td>' + new Date(h.timestamp).toLocaleString() + '</td>' +
                    '<td><code style="color:var(--accent)">' + h.carNumber + '</code></td>' +
                    '<td>' + h.slot + '</td>' +
                    '<td>' + h.mobile + '</td>' +
                    '<td><span class="' + badge + '">' + h.action + '</span></td>' +
                    '</tr>';
            }).join('');

            if (!rows) {
                rows = '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No history yet</td></tr>';
            }

            document.getElementById('historyContent').innerHTML =
                '<table class="history-table">' +
                '<thead><tr><th>Time</th><th>Car</th><th>Slot</th><th>Mobile</th><th>Action</th></tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
                '</table>';
        }
    } catch (err) {
        document.getElementById('historyContent').innerHTML =
            '<p style="color:var(--muted);font-size:.85rem;">Could not load history. Make sure server is running.</p>';
    }
}

// ── TABS ──
function showTab(tab) {
    var map    = { book: 'secBook', find: 'secFind', checkout: 'secCheckout', history: 'secHistory' };
    var tabMap = { book: 'tabBook', find: 'tabFind', checkout: 'tabCheckout', history: 'tabHistory' };

    Object.keys(map).forEach(function (t) {
        document.getElementById(map[t]).classList.toggle('hidden', t !== tab);
        var btn = document.getElementById(tabMap[t]);
        if (btn) btn.classList.toggle('active', t === tab);
    });

    hideMessage();
    if (tab === 'find')    document.getElementById('dirResult').classList.add('hidden');
    if (tab === 'history') loadHistory();
}

// ── ARDUINO SERIAL ──
function sendToArduino(cmd) {
    console.log('Arduino ▶', cmd);
    // Real implementation: port.write(cmd + '\n');
}

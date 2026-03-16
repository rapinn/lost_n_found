// ================= MOCK DATA (จำลองฐานข้อมูล) =================
let locationsData = [
    { id: "LOC-001", name: "ศูนย์เรียนรู้อเนกประสงค์ (SC)", zone: "โซนการศึกษา", status: "active" },
    { id: "LOC-002", name: "โรงอาหารกลาง (Green Canteen)", zone: "โซนบริการ", status: "active" },
    { id: "LOC-003", name: "หอสมุดป๋วย อึ๊งภากรณ์", zone: "โซนการศึกษา", status: "active" },
    { id: "LOC-004", name: "อาคารเรียนรวม (LC1 - LC5)", zone: "โซนการศึกษา", status: "active" },
    { id: "LOC-005", name: "สนามกีฬากลาง (Main Stadium)", zone: "โซนกีฬา", status: "inactive" }
];

let categoriesData = [
    { id: "CAT-001", name: "โทรศัพท์มือถือ / แท็บเล็ต", count: 45, status: "active" },
    { id: "CAT-002", name: "บัตร / เอกสารสำคัญ", count: 120, status: "active" },
    { id: "CAT-003", name: "อุปกรณ์อิเล็กทรอนิกส์ (หูฟัง, สายชาร์จ)", count: 85, status: "active" },
    { id: "CAT-004", name: "กระเป๋า / กระเป๋าสตางค์", count: 60, status: "active" },
    { id: "CAT-005", name: "เครื่องเขียน", count: 12, status: "inactive" }
];

// ================= RENDER FUNCTIONS =================
function renderLocations() {
    const tbody = document.getElementById('locationsTableBody');
    tbody.innerHTML = locationsData.map((item, index) => `
        <tr>
            <td data-label="รหัส" class="text-muted">${item.id}</td>
            <td data-label="ชื่อสถานที่" class="text-bold">${item.name}</td>
            <td data-label="โซนพื้นที่">${item.zone}</td>
            <td data-label="สถานะ">
                ${item.status === 'active' 
                    ? '<span class="status-pill status-active"><i class="fa-solid fa-circle-check"></i> เปิดใช้งาน</span>' 
                    : '<span class="status-pill status-inactive"><i class="fa-solid fa-circle-minus"></i> ปิดใช้งาน</span>'}
            </td>
            <td data-label="จัดการ" style="text-align: center;">
                <button class="action-btn btn-edit" style="width: auto; display: inline-flex; padding: 6px 12px; margin:0;" onclick="openModal('locations', 'edit', '${item.id}')"><i class="fa-solid fa-pen"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = categoriesData.map((item, index) => `
        <tr>
            <td data-label="รหัส" class="text-muted">${item.id}</td>
            <td data-label="ชื่อหมวดหมู่" class="text-bold">${item.name}</td>
            <td data-label="จำนวนของในระบบ">${item.count} ชิ้น</td>
            <td data-label="สถานะ">
                ${item.status === 'active' 
                    ? '<span class="status-pill status-active"><i class="fa-solid fa-circle-check"></i> เปิดใช้งาน</span>' 
                    : '<span class="status-pill status-inactive"><i class="fa-solid fa-circle-minus"></i> ปิดใช้งาน</span>'}
            </td>
            <td data-label="จัดการ" style="text-align: center;">
                <button class="action-btn btn-edit" style="width: auto; display: inline-flex; padding: 6px 12px; margin:0;" onclick="openModal('categories', 'edit', '${item.id}')"><i class="fa-solid fa-pen"></i></button>
            </td>
        </tr>
    `).join('');
}

// ================= TAB MANAGEMENT =================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.currentTarget.classList.add('active');
}

// ================= MODAL MANAGEMENT =================
function openModal(type, action, id = null) {
    const modal = document.getElementById('dataModal');
    const form = document.getElementById('dataForm');
    
    // Set Hidden Inputs
    document.getElementById('modalType').value = type;
    document.getElementById('modalAction').value = action;
    document.getElementById('modalId').value = id || "";

    // Reset Form
    form.reset();
    document.getElementById('btnSaveModal').innerHTML = 'บันทึกข้อมูล';
    document.getElementById('btnSaveModal').classList.remove('success-state');
    document.getElementById('btnSaveModal').style.pointerEvents = 'auto';

    // Customize UI based on Type
    if (type === 'locations') {
        document.getElementById('labelName').innerText = "ชื่อสถานที่ / อาคาร";
        document.getElementById('groupDesc').style.display = "flex";
        document.getElementById('labelDesc').innerText = "โซนพื้นที่ (Zone)";
    } else {
        document.getElementById('labelName').innerText = "ชื่อหมวดหมู่สิ่งของ";
        document.getElementById('groupDesc').style.display = "none"; // Categories ไม่ต้องการ Detail เพิ่มเติม
    }

    // Populate Data for Edit
    if (action === 'edit') {
        document.getElementById('modalTitle').innerText = "แก้ไขข้อมูล";
        
        let targetData = type === 'locations' 
            ? locationsData.find(i => i.id === id) 
            : categoriesData.find(i => i.id === id);

        if (targetData) {
            document.getElementById('inputName').value = targetData.name;
            if (type === 'locations') document.getElementById('inputDesc').value = targetData.zone;
            document.getElementById('inputStatus').value = targetData.status;
        }
    } else {
        document.getElementById('modalTitle').innerText = "เพิ่มข้อมูลใหม่";
    }

    // Show Modal with Animation
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal() {
    const modal = document.getElementById('dataModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// ================= SAVE DATA =================
function saveData(event) {
    event.preventDefault();
    const btn = document.getElementById('btnSaveModal');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        const type = document.getElementById('modalType').value;
        const action = document.getElementById('modalAction').value;
        const id = document.getElementById('modalId').value;
        
        const name = document.getElementById('inputName').value;
        const desc = document.getElementById('inputDesc').value;
        const status = document.getElementById('inputStatus').value;

        if (type === 'locations') {
            if (action === 'add') {
                const newId = `LOC-00${locationsData.length + 1}`;
                locationsData.push({ id: newId, name, zone: desc, status });
            } else {
                let item = locationsData.find(i => i.id === id);
                if (item) { item.name = name; item.zone = desc; item.status = status; }
            }
            renderLocations();
        } else {
            if (action === 'add') {
                const newId = `CAT-00${categoriesData.length + 1}`;
                categoriesData.push({ id: newId, name, count: 0, status });
            } else {
                let item = categoriesData.find(i => i.id === id);
                if (item) { item.name = name; item.status = status; }
            }
            renderCategories();
        }

        btn.classList.add('success-state');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> สำเร็จ!';
        
        setTimeout(() => closeModal(), 1000);
    }, 800);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderLocations();
    renderCategories();
});
// ================= Configuration =================
const LAMBDA_SEARCH_URL = "https://5mv3jbv75h3naskrlvb7esop4e0xnyqv.lambda-url.us-east-1.on.aws/";
const LAMBDA_ADMIN_URL = "https://hdc2oly7gs5v3kse5ifs6kjto40hlegl.lambda-url.us-east-1.on.aws/"; 

let allItems = [];
let currentPage = 1;
let itemsPerPage = 6; 
// ================= Render Functions =================
function renderItemsTable() {
    const tbody = document.getElementById("itemsTableBody");
    if (!tbody) return;

    if (allItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 60px 20px; color: #64748b;">
            <i class="fa-solid fa-folder-open" style="font-size:32px; margin-bottom:12px; opacity:0.5;"></i><br>
            ไม่พบข้อมูลที่ตรงกับเงื่อนไข
        </td></tr>`;
        renderPagination();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToShow = allItems.slice(startIndex, endIndex);

    tbody.innerHTML = itemsToShow.map((item, index) => {
        const isFound = item.item_type === 'FOUND';
        const typeDisplay = isFound 
            ? `<span class="badge badge-found"><i class="fa-solid fa-box-open"></i> เก็บได้</span>` 
            : `<span class="badge badge-lost"><i class="fa-solid fa-bullhorn"></i> ของหาย</span>`;

        const statusOptions = ['แจ้งแล้ว', 'รอรับคืน', 'คืนเจ้าของแล้ว', 'หมดอายุ'];
        const statusButtons = statusOptions.map(status => {
            const isActive = item.status === status;
            const btnClass = isActive ? 'status-btn active' : 'status-btn';
            return `<button class="${btnClass}" ${isActive ? 'disabled' : `onclick="changeStatus('${item.item_id}', '${status}')"`}>
                        ${isActive ? '<i class="fa-solid fa-check"></i> ' : ''}${status}
                    </button>`;
        }).join('');

        return `
            <tr>
                <td data-label="ลำดับ">
                    <div class="row-number">${startIndex + index + 1}</div>
                </td>
                <td data-label="ประเภท">${typeDisplay}</td>
                <td data-label="หมวดหมู่">${item.category || "-"}</td>
                <td data-label="รูปภาพ">
                    ${item.image_url 
                        ? `<a href="${item.image_url}" target="_blank"><img src="${item.image_url}" alt="item" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;"></a>` 
                        : '<div style="width:40px;height:40px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:16px;"><i class="fa-regular fa-image"></i></div>'}
                </td>
                <td data-label="รายละเอียดสิ่งของ">
                    <div class="text-bold">${item.brand || '-'}</div>
                    <div class="text-small">${escapeHTML(item.details)}</div>
                </td>
                <td data-label="วัน/เวลา/สถานที่">
                    <div class="icon-text"><i class="fa-regular fa-calendar text-muted"></i> ${item.date || "-"}</div>
                    <div class="icon-text"><i class="fa-regular fa-clock text-muted"></i> ${item.time || "-"}</div>
                    <div class="icon-text"><i class="fa-solid fa-location-dot text-muted"></i> ${item.location || "-"}</div>
                </td>
                <td data-label="ข้อมูลผู้แจ้ง">
                    <div class="text-bold">${escapeHTML(item.brand)}</div>${item.reporter_name ? escapeHTML(item.reporter_name) : '-'}
                    <div class="icon-text"><i class="fa-solid fa-phone text-muted"></i> ${item.reporter_contact || '-'}</div>
                    ${item.reporter_student_id ? `<div class="icon-text"><i class="fa-solid fa-id-card text-muted"></i> ${item.reporter_student_id}</div>` : ''}
                </td>
                <td data-label="Case ID">
                    <span style="background:#fff; padding:2px 6px; border-radius:4px; font-family:monospace; color:#475569; border:1px solid #cbd5e1; font-size:12px;">${item.case_id || 'N/A'}</span>
                </td>
                <td data-label="สถานะ (คลิกเพื่อเปลี่ยน)">
                    <div class="status-grid">${statusButtons}</div>
                </td>
                <td data-label="จัดการ">
                    <div class="action-group">
                        <button class="action-btn btn-edit" onclick="editItem('${item.item_id}')" title="แก้ไข"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button class="action-btn btn-delete" onclick="deleteItem('${item.item_id}')" title="ลบ"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    renderPagination();
}

// ================= ระบบแบ่งหน้า (Pagination) =================
function renderPagination() {
    const container = document.getElementById("pagination-container");
    if (!container) return;

    if (allItems.length <= itemsPerPage) {
        container.innerHTML = "";
        return;
    }

    const totalPages = Math.ceil(allItems.length / itemsPerPage);
    let html = '';

    // ปุ่มย้อนกลับ (เพิ่ม class nav-btn และปรับ onclick แบบเดียวกับ audit-log)
    html += `<button class="page-btn nav-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    if (startPage > 1) {
        html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span class="page-dots">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-dots">...</span>`;
        html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // ปุ่มถัดไป (เพิ่ม class nav-btn และปรับ onclick แบบเดียวกับ audit-log)
    html += `<button class="page-btn nav-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;

    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderItemsTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= API Fetching =================
async function fetchFromLambda(payload) {
    const tbody = document.getElementById("itemsTableBody");
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...</td></tr>`;
    
    try {
        const response = await fetch(LAMBDA_SEARCH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.status === 'success' && result.count > 0) {
            let fetchedItems = result.items;

            const locText = document.getElementById("locationFilter")?.value.toLowerCase();
            if (locText) {
                fetchedItems = fetchedItems.filter(item => (item.location || "").toLowerCase().includes(locText));
            }

            allItems = fetchedItems;
            allItems.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
            currentPage = 1; 
            renderItemsTable();
        } else {
            allItems = [];
            renderItemsTable();
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="10" style="color:#ef4444; text-align:center; padding: 40px;">เกิดข้อผิดพลาดในการเชื่อมต่อ</td></tr>`;
    }
}

// ================= Filters & Export =================
function applyFilters() {
    const payload = { search_mode: "admin" };
    const cat = document.getElementById("categoryFilter")?.value; 
    const stat = document.getElementById("statusFilter")?.value;
    const date = document.getElementById("expiryFilter")?.value;
    
    if (cat) payload.keyword = cat; 
    if (stat) payload.status = stat;
    if (date) payload.date = date;
    
    fetchFromLambda(payload);
}

function resetFilters() {
    if(document.getElementById("categoryFilter")) document.getElementById("categoryFilter").value = "";
    if(document.getElementById("statusFilter")) document.getElementById("statusFilter").value = "";
    if(document.getElementById("locationFilter")) document.getElementById("locationFilter").value = "";
    if(document.getElementById("expiryFilter")) document.getElementById("expiryFilter").value = "";
    applyFilters();
}

function exportCurrentPageCSV() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const itemsToExport = allItems.slice(startIndex, startIndex + itemsPerPage);
    
    if (itemsToExport.length === 0) return alert("ไม่มีข้อมูลในหน้านี้");
    
    const headers = ["ลำดับ", "Case ID", "ประเภท", "หมวดหมู่", "ยี่ห้อ", "รายละเอียด", "วันที่", "สถานที่", "ชื่อผู้แจ้ง", "เบอร์โทร", "สถานะ"];
    const csvRows = [headers.join(",")];
    
    itemsToExport.forEach((i, index) => {
        const row = [
            startIndex + index + 1,
            i.case_id || "-",
            i.item_type === 'FOUND' ? "เก็บได้" : "หาย",
            i.category || "-",
            i.brand || "-",
            i.details || "-",
            i.date || "-",
            i.location || "-",
            i.reporter_name || "-",
            i.reporter_contact || "-",
            i.status || "-"
        ];
        // ป้องกันปัญหามีลูกน้ำในรายละเอียด
        const safeRow = row.map(r => `"${String(r).replace(/"/g, '""')}"`);
        csvRows.push(safeRow.join(","));
    });

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TU_ManageItems_Page${currentPage}.csv`;
    link.click();
}

// ================= Init =================
document.addEventListener('DOMContentLoaded', () => {
    // ผูก Event ให้ทำงานเมื่อตัวกรองเปลี่ยน
    document.getElementById("categoryFilter")?.addEventListener("change", applyFilters);
    document.getElementById("statusFilter")?.addEventListener("change", applyFilters);
    document.getElementById("expiryFilter")?.addEventListener("change", applyFilters);
    document.getElementById("locationFilter")?.addEventListener("change", applyFilters);

    fetchFromLambda({ search_mode: "admin" });
});

async function changeStatus(itemId, newStatus) { alert("ระบบจำลอง: อัปเดตสถานะเป็น " + newStatus); }
async function editItem(itemId) { alert("ระบบจำลอง: แก้ไขข้อมูล"); }
async function deleteItem(itemId) { alert("ระบบจำลอง: ลบข้อมูล"); }
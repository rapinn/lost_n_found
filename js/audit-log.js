// ================= ข้อมูลจำลอง (Mock Data) =================
const mockAuditLogs = [
    { id: 1, datetime: "2026-03-15T14:30:22", user: "Admin สมชาย", role: "Administrator", action: "STATUS_CHANGE", case_id: "F123456", details: "เปลี่ยนสถานะจาก <span class='detail-highlight'>'รอรับคืน'</span> เป็น <span class='detail-highlight'>'คืนเจ้าของแล้ว'</span>" },
    { id: 2, datetime: "2026-03-15T13:15:00", user: "รปภ. สมศักดิ์", role: "Staff", action: "CREATE", case_id: "L987654", details: "เพิ่มรายการแจ้งของหายใหม่ หมวดหมู่: โทรศัพท์" },
    { id: 3, datetime: "2026-03-14T09:45:10", user: "Admin สมชาย", role: "Administrator", action: "UPDATE", case_id: "F123456", details: "แก้ไขรายละเอียดสิ่งของ: เพิ่มเติม 'มีรอยขีดข่วนด้านหลัง'" },
    { id: 4, datetime: "2026-03-14T08:20:05", user: "ระบบอัตโนมัติ", role: "System", action: "STATUS_CHANGE", case_id: "L112233", details: "เปลี่ยนสถานะเป็น <span class='detail-highlight'>'หมดอายุ'</span> (เกินกำหนด 3 เดือน)" },
    { id: 5, datetime: "2026-03-13T16:50:40", user: "Admin สมชาย", role: "Administrator", action: "DELETE", case_id: "F998877", details: "ลบรายการสิ่งของออกจากระบบ (ลบรูปภาพใน S3 แล้ว)" },
    { id: 6, datetime: "2026-03-13T10:10:10", user: "รปภ. สมศักดิ์", role: "Staff", action: "CREATE", case_id: "F445566", details: "เพิ่มรายการเก็บของได้ หมวดหมู่: บัตร/เอกสาร" },
    { id: 7, datetime: "2026-03-12T14:05:00", user: "Admin สมชาย", role: "Administrator", action: "STATUS_CHANGE", case_id: "L987654", details: "เปลี่ยนสถานะจาก <span class='detail-highlight'>'แจ้งแล้ว'</span> เป็น <span class='detail-highlight'>'รอรับคืน'</span> (พบของที่ตรงกัน)" },
    { id: 8, datetime: "2026-03-11T11:20:00", user: "ระบบอัตโนมัติ", role: "System", action: "UPDATE", case_id: "F123456", details: "อัปเดตช่องทางการติดต่อผู้แจ้งผ่าน LINE API" },
    { id: 9, datetime: "2026-03-10T09:00:00", user: "รปภ. สมศักดิ์", role: "Staff", action: "UPDATE", case_id: "F445566", details: "แก้ไขสถานที่พบ จาก 'โรงอาหาร' เป็น 'อาคารเรียนรวม 3'" },
    { id: 10, datetime: "2026-03-09T15:30:00", user: "Admin สมชาย", role: "Administrator", action: "DELETE", case_id: "L111111", details: "ลบรายการแจ้งของหาย (ผู้แจ้งขอยกเลิก)" },
    { id: 11, datetime: "2026-03-09T08:15:00", user: "ระบบอัตโนมัติ", role: "System", action: "STATUS_CHANGE", case_id: "F222333", details: "เปลี่ยนสถานะเป็น <span class='detail-highlight'>'หมดอายุ'</span> (เกินกำหนด 1 ปี สำหรับของมีค่า)" },
    { id: 12, datetime: "2026-03-08T17:45:00", user: "รปภ. สมศักดิ์", role: "Staff", action: "CREATE", case_id: "F777888", details: "เพิ่มรายการเก็บของได้ หมวดหมู่: อุปกรณ์อิเล็กทรอนิกส์" },
    { id: 13, datetime: "2026-03-08T12:00:00", user: "Admin สมชาย", role: "Administrator", action: "STATUS_CHANGE", case_id: "L555666", details: "เปลี่ยนสถานะเป็น <span class='detail-highlight'>'คืนเจ้าของแล้ว'</span>" },
    { id: 14, datetime: "2026-03-07T10:30:00", user: "Admin สมชาย", role: "Administrator", action: "UPDATE", case_id: "F777888", details: "อัปเดตยี่ห้อ/รุ่น เป็น 'Apple AirPods Pro'" },
    { id: 15, datetime: "2026-03-06T09:10:00", user: "ระบบอัตโนมัติ", role: "System", action: "CREATE", case_id: "L000999", details: "รับข้อมูลแจ้งของหายจาก LINE Bot อัตโนมัติ" }
];

// ================= ตัวแปรและตั้งค่า =================
let allLogs = [...mockAuditLogs];
let filteredLogs = [...mockAuditLogs];
let currentPage = 1;
const itemsPerPage = 8; // แสดงหน้าละ 8 รายการ

// ================= จัดการแสดงผล UI =================
function renderAuditTable() {
    const tbody = document.getElementById("auditTableBody");
    if (!tbody) return;

    if (filteredLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 60px 20px; color: #64748b;">
            <i class="fa-solid fa-clipboard-list" style="font-size:32px; margin-bottom:12px; opacity:0.5;"></i><br>
            ไม่พบประวัติการทำรายการที่ตรงกับเงื่อนไข
        </td></tr>`;
        renderPagination();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const logsToShow = filteredLogs.slice(startIndex, endIndex);

    tbody.innerHTML = logsToShow.map(log => {
        // จัดรูปแบบวันที่และเวลา
        const dateObj = new Date(log.datetime);
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = dateObj.toTimeString().split(' ')[0].substring(0, 5);

        // เลือกไอคอนตามบทบาท (Role)
        let userIcon = "fa-user";
        if (log.role === "Administrator") userIcon = "fa-user-tie";
        if (log.role === "System") userIcon = "fa-robot";

        // สร้าง Badge ตามการกระทำ (Action)
        let actionBadge = "";
        switch (log.action) {
            case "CREATE": actionBadge = `<span class="action-badge action-create"><i class="fa-solid fa-plus"></i> เพิ่มข้อมูล</span>`; break;
            case "UPDATE": actionBadge = `<span class="action-badge action-update"><i class="fa-solid fa-pen"></i> แก้ไขข้อมูล</span>`; break;
            case "STATUS_CHANGE": actionBadge = `<span class="action-badge action-status"><i class="fa-solid fa-rotate"></i> เปลี่ยนสถานะ</span>`; break;
            case "DELETE": actionBadge = `<span class="action-badge action-delete"><i class="fa-solid fa-trash"></i> ลบข้อมูล</span>`; break;
        }

        return `
            <tr>
                <td data-label="วันเวลา (Date/Time)">
                    <div style="font-size: 13px; color: #334155; font-weight: 500;">${dateStr}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">เวลา ${timeStr} น.</div>
                </td>
                <td data-label="เจ้าหน้าที่ (User)">
                    <div class="user-info">
                        <div class="user-avatar"><i class="fa-solid ${userIcon}"></i></div>
                        <div class="user-details">
                            <span class="user-name">${log.user}</span>
                            <span class="user-role">${log.role}</span>
                        </div>
                    </div>
                </td>
                <td data-label="การกระทำ (Action)">
                    ${actionBadge}
                </td>
                <td data-label="รหัสอ้างอิง (Case ID)">
                    <span style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-family:monospace; color:#475569; border:1px solid #e2e8f0; font-size:12px; font-weight:bold;">
                        ${log.case_id}
                    </span>
                </td>
                <td data-label="รายละเอียด (Details)">
                    <div class="log-detail-box">${log.details}</div>
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

    if (filteredLogs.length <= itemsPerPage) {
        container.innerHTML = "";
        return;
    }

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    let html = '';

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

    html += `<button class="page-btn nav-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;

    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderAuditTable();
    // เพิ่มการเลื่อนจอขึ้นไปด้านบนเวลากดเปลี่ยนหน้า
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= ระบบกรองข้อมูล (Filters) =================
function applyFilters() {
    const user = document.getElementById('userFilter').value;
    const action = document.getElementById('actionFilter').value;
    const date = document.getElementById('dateFilter').value;

    filteredLogs = allLogs.filter(log => {
        let matchUser = user ? log.user === user : true;
        let matchAction = action ? log.action === action : true;
        let matchDate = date ? log.datetime.startsWith(date) : true;
        
        return matchUser && matchAction && matchDate;
    });

    currentPage = 1;
    renderAuditTable();
}

function resetFilters() {
    document.getElementById('userFilter').value = "";
    document.getElementById('actionFilter').value = "";
    document.getElementById('dateFilter').value = "";
    
    filteredLogs = [...allLogs];
    currentPage = 1;
    renderAuditTable();
}

// ผูก Event Listener เมื่อมีการเปลี่ยนค่า Filter
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('userFilter').addEventListener('change', applyFilters);
    document.getElementById('actionFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    
    // โหลดตารางครั้งแรก
    renderAuditTable();
});

// ================= Export CSV (เฉพาะหน้าปัจจุบัน) =================
function exportAuditLogCSV() {
    // ดึงข้อมูลเฉพาะหน้าที่เลือก
    const startIndex = (currentPage - 1) * itemsPerPage;
    const logsToExport = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    if (logsToExport.length === 0) return alert("ไม่มีข้อมูลในหน้านี้");
    
    const headers = ["วันเวลา", "เจ้าหน้าที่", "ตำแหน่ง", "การกระทำ", "รหัสอ้างอิง", "รายละเอียด"];
    const csvRows = [headers.join(",")];
    
    logsToExport.forEach(log => {
        // ลบ HTML tags ออกจาก details (เช่น <span>)
        const cleanDetails = log.details.replace(/<[^>]*>?/gm, '');
        
        const row = [
            log.datetime,
            log.user,
            log.role,
            log.action,
            log.case_id,
            cleanDetails
        ];
        
        // ป้องกันปัญหามีลูกน้ำ
        const safeRow = row.map(r => `"${String(r).replace(/"/g, '""')}"`);
        csvRows.push(safeRow.join(","));
    });
    
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // ตั้งชื่อไฟล์ตามเลขหน้าปัจจุบัน
    link.download = `TU_AuditLog_Page${currentPage}.csv`;
    link.click();
}
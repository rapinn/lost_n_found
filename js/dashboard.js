// ================= Configuration =================
const LAMBDA_SEARCH_URL = "https://5mv3jbv75h3naskrlvb7esop4e0xnyqv.lambda-url.us-east-1.on.aws/";
let allRawData = []; 
let filteredData = []; 

let statusChartInstance = null;
let categoryChartInstance = null;
let locationChartInstance = null;

// ตั้งค่าพื้นฐานให้ Chart.js ดู Premium
Chart.defaults.font.family = "'Prompt', sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
Chart.defaults.plugins.tooltip.titleFont = { size: 14, family: "'Prompt', sans-serif", weight: '600' };
Chart.defaults.plugins.tooltip.bodyFont = { size: 13, family: "'Prompt', sans-serif" };
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.displayColors = false;

// ================= Fetch Data =================
async function fetchDashboardData() {
    try {
        const response = await fetch(LAMBDA_SEARCH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search_mode: "admin" })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            allRawData = result.items;
            filteredData = [...allRawData];
            updateDashboard();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// ================= Update Dashboard UI =================
function updateDashboard() {
    renderSummaryCards();
    renderCharts();
    renderRecentItems();
}

function renderSummaryCards() {
    const total = filteredData.length;
    const lost = filteredData.filter(i => i.item_type === 'LOST').length;
    const found = filteredData.filter(i => i.item_type === 'FOUND').length;
    const returned = filteredData.filter(i => i.status === 'คืนเจ้าของแล้ว').length;

    animateValue("statTotal", 0, total, 1000);
    animateValue("statLost", 0, lost, 1000);
    animateValue("statFound", 0, found, 1000);
    animateValue("statReturned", 0, returned, 1000);
}

function animateValue(id, start, end, duration) {
    if (start === end) { document.getElementById(id).innerText = end; return; }
    let obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerText = Math.floor(progress * (end - start) + start);
        if (progress < 1) { window.requestAnimationFrame(step); }
    };
    window.requestAnimationFrame(step);
}

// ================= Charts =================
function renderCharts() {
    const statusCounts = { 'กำลังดำเนินการ': 0, 'คืนเจ้าของแล้ว': 0, 'หมดอายุ': 0 };
    const categoryCounts = {};
    const locationCounts = {};

    filteredData.forEach(item => {
        if (item.status === 'คืนเจ้าของแล้ว') statusCounts['คืนเจ้าของแล้ว']++;
        else if (item.status === 'หมดอายุ') statusCounts['หมดอายุ']++;
        else statusCounts['กำลังดำเนินการ']++; 

        const cat = item.category || 'ไม่ระบุ';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        const loc = item.location || 'ไม่ระบุ';
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    if (statusChartInstance) statusChartInstance.destroy();
    if (categoryChartInstance) categoryChartInstance.destroy();
    if (locationChartInstance) locationChartInstance.destroy();

    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    statusChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#3b82f6', '#10b981', '#cbd5e1'],
                borderWidth: 0, hoverOffset: 6
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } 
        }
    });

    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(ctxCat, {
        type: 'bar',
        data: {
            labels: Object.keys(categoryCounts),
            datasets: [{
                label: 'จำนวนรายการ', data: Object.values(categoryCounts),
                backgroundColor: 'rgba(188, 48, 48, 0.85)', hoverBackgroundColor: '#bc3030',
                borderRadius: 6, borderSkipped: false, barThickness: 24
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false }, border: {display: false} },
                x: { grid: { display: false }, border: {display: false} }
            }
        }
    });

    const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const ctxLoc = document.getElementById('locationChart').getContext('2d');
    locationChartInstance = new Chart(ctxLoc, {
        type: 'bar',
        data: {
            labels: sortedLocations.map(l => l[0]),
            datasets: [{
                data: sortedLocations.map(l => l[1]),
                backgroundColor: 'rgba(245, 158, 11, 0.85)', hoverBackgroundColor: '#f59e0b',
                borderRadius: 6, borderSkipped: false, barThickness: 20
            }]
        },
        options: { 
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                x: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: {display: false} },
                y: { grid: { display: false }, border: {display: false} }
            }
        }
    });
}

// ================= Render ตารางรายการล่าสุด =================
function renderRecentItems() {
    const tbody = document.getElementById('recentItemsBody');
    if (!tbody) return;

    // เรียงข้อมูลตามวันที่ใหม่สุดไปเก่าสุด และตัดมาแค่ 5 รายการ
    const recentData = [...filteredData].sort((a, b) => {
        const dateA = a.created_at || a.date || "";
        const dateB = b.created_at || b.date || "";
        return dateB.localeCompare(dateA);
    }).slice(0, 5);

    if (recentData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color:#94a3b8;">ไม่พบข้อมูลรายการสิ่งของ</td></tr>`;
        return;
    }

    tbody.innerHTML = recentData.map(item => {
        const isFound = item.item_type === 'FOUND';
        const typeDisplay = isFound 
            ? `<span class="badge badge-found"><i class="fa-solid fa-box-open"></i> เก็บได้</span>` 
            : `<span class="badge badge-lost"><i class="fa-solid fa-bullhorn"></i> ของหาย</span>`;
        
        let statusColor = '#64748b'; 
        let statusBg = '#f1f5f9';
        if (item.status === 'คืนเจ้าของแล้ว') { statusColor = '#059669'; statusBg = '#d1fae5'; }
        else if (item.status === 'กำลังดำเนินการ' || item.status === 'รอรับคืน') { statusColor = '#d97706'; statusBg = '#fef3c7'; }
        else if (item.status === 'แจ้งแล้ว') { statusColor = '#bc3030'; statusBg = '#fee2e2'; }

        const statusBadge = `<span style="background:${statusBg}; color:${statusColor}; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: inline-block;">${item.status || '-'}</span>`;

        return `
            <tr>
                <td style="font-family: monospace; font-size: 13px; color: #475569; font-weight: 600;">${item.case_id || '-'}</td>
                <td>${typeDisplay}</td>
                <td style="font-weight: 500; color: #334155;">${item.category || '-'}</td>
                <td>
                    <div style="font-weight: 600; color: #1e293b; font-size: 13px;">${item.brand || '-'}</div>
                    <div class="text-truncate" style="..." title="${escapeHTML(item.details)}">${escapeHTML(item.details)}</div>
                </td>
                <td style="font-size: 13px; color: #475569;">
                    <i class="fa-solid fa-location-dot" style="color:#cbd5e1; margin-right: 4px;"></i> ${item.location || '-'}
                </td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

// ================= Filters =================
function applyDateFilter() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    if (!start && !end) { filteredData = [...allRawData]; } 
    else {
        filteredData = allRawData.filter(item => {
            if (!item.date) return false;
            let isAfter = start ? item.date >= start : true;
            let isBefore = end ? item.date <= end : true;
            return isAfter && isBefore;
        });
    }
    updateDashboard();
}

function resetFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    filteredData = [...allRawData];
    updateDashboard();
}

// ================= Export เป็น Excel (.xlsx) แบบมีกราฟ =================
async function exportDashboard() {
    if (filteredData.length === 0) return alert("ไม่มีข้อมูล");

    const btn = document.getElementById('exportBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังสร้างไฟล์ Excel...';
    btn.disabled = true;

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'TU Secure Center';
        workbook.created = new Date();

        // ================= SHEET 1: ภาพรวมและกราฟ =================
        const dashSheet = workbook.addWorksheet('ภาพรวม (Dashboard)');
        
        // กำหนดความกว้างคอลัมน์เพื่อจัด Layout กราฟให้สวยงาม
        dashSheet.columns = [
            { width: 35 }, { width: 20 }, { width: 5 }, { width: 45 }, { width: 30 }
        ];
        
        // 1. สร้างส่วนหัวรายงาน (Header)
        dashSheet.mergeCells('A1:E2');
        const titleCell = dashSheet.getCell('A1');
        titleCell.value = '📊 สถิติภาพรวมระบบจัดการสิ่งของสูญหาย TU Lost & Found';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Prompt' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBC3030' } }; // พื้นหลังสีแดง
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // 2. แสดงวันที่ออกรายงาน
        dashSheet.mergeCells('A3:E3');
        const dateCell = dashSheet.getCell('A3');
        dateCell.value = `ข้อมูล ณ วันที่: ${new Date().toLocaleString('th-TH')}`;
        dateCell.font = { size: 11, italic: true, color: { argb: 'FF64748B' } };
        dateCell.alignment = { vertical: 'middle', horizontal: 'right' };

        // 3. เตรียมข้อมูลตารางสถิติ
        const total = filteredData.length;
        const lost = filteredData.filter(i => i.item_type === 'LOST').length;
        const found = filteredData.filter(i => i.item_type === 'FOUND').length;
        const returned = filteredData.filter(i => i.status === 'คืนเจ้าของแล้ว').length;

        // หัวตารางสถิติ
        dashSheet.getCell('A5').value = 'ประเภทสถิติ';
        dashSheet.getCell('B5').value = 'จำนวน (รายการ)';
        ['A5', 'B5'].forEach(cell => {
            dashSheet.getCell(cell).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            dashSheet.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            dashSheet.getCell(cell).alignment = { horizontal: 'center' };
        });

        // ใส่ข้อมูลลงตาราง
        dashSheet.addRow(['📋 รายการทั้งหมด', total]);
        dashSheet.addRow(['📢 แจ้งของหาย (Lost)', lost]);
        dashSheet.addRow(['📦 เก็บของได้ (Found)', found]);
        dashSheet.addRow(['✅ ส่งคืนสำเร็จแล้ว', returned]);
        
        // ตีเส้นขอบและตกแต่งตารางสถิติ (แถว 5-9)
        for(let i = 5; i <= 9; i++) {
            ['A', 'B'].forEach(col => {
                dashSheet.getCell(`${col}${i}`).border = {
                    top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
                };
            });
            dashSheet.getCell(`B${i}`).alignment = { horizontal: 'center' };
            if(i > 5) dashSheet.getCell(`A${i}`).font = { bold: true };
        }

        // 4. แปลงและวางรูปภาพกราฟ
        const statusChartImg = statusChartInstance.toBase64Image('image/png', 1);
        const categoryChartImg = categoryChartInstance.toBase64Image('image/png', 1);
        const locationChartImg = locationChartInstance.toBase64Image('image/png', 1);

        const imgStatusId = workbook.addImage({ base64: statusChartImg, extension: 'png' });
        const imgCategoryId = workbook.addImage({ base64: categoryChartImg, extension: 'png' });
        const imgLocationId = workbook.addImage({ base64: locationChartImg, extension: 'png' });

        // แปะกราฟลงใน Sheet (กำหนดพิกัด x, y ตามคอลัมน์/แถว)
        dashSheet.addImage(imgStatusId, { tl: { col: 0, row: 11 }, ext: { width: 350, height: 280 } }); // ซ้ายบน
        dashSheet.addImage(imgCategoryId, { tl: { col: 3, row: 11 }, ext: { width: 450, height: 280 } }); // ขวาบน
        dashSheet.addImage(imgLocationId, { tl: { col: 0, row: 27 }, ext: { width: 850, height: 320 } }); // ด้านล่างแนวยาว


        // ================= SHEET 2: ข้อมูลตารางดิบ =================
        // เพิ่ม views ให้ Freeze แถวที่ 1 (หัวตาราง) เลื่อนแล้วไม่หาย
        const dataSheet = workbook.addWorksheet('ข้อมูลรายการ (Raw Data)', { views: [{ state: 'frozen', ySplit: 1 }] });
        
        dataSheet.columns = [
            { header: 'Case ID', key: 'case_id', width: 14 },
            { header: 'ประเภท', key: 'type', width: 12 },
            { header: 'หมวดหมู่', key: 'category', width: 22 },
            { header: 'ยี่ห้อ', key: 'brand', width: 20 },
            { header: 'รายละเอียด', key: 'details', width: 45 },
            { header: 'วันที่', key: 'date', width: 14 },
            { header: 'สถานที่', key: 'location', width: 25 },
            { header: 'ชื่อผู้แจ้ง', key: 'reporter', width: 20 },
            { header: 'เบอร์โทร', key: 'phone', width: 15 },
            { header: 'สถานะ', key: 'status', width: 16 }
        ];

        // ตกแต่งหัวตาราง และเปิดใช้งาน Auto Filter
        dataSheet.autoFilter = 'A1:J1';
        dataSheet.getRow(1).height = 25;
        dataSheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBC3030' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });

        // นำข้อมูลใส่ตาราง
        filteredData.forEach(i => {
            dataSheet.addRow({
                case_id: i.case_id || "-",
                type: i.item_type === 'FOUND' ? "เก็บได้" : "หาย",
                category: i.category || "-",
                brand: i.brand || "-",
                details: i.details || "-",
                date: i.date || "-",
                location: i.location || "-",
                reporter: i.reporter_name || "-",
                phone: i.reporter_contact || "-",
                status: i.status || "-"
            });
        });

        // จัด Format ของแต่ละเซลล์ในตาราง
        dataSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // ข้ามหัวตาราง
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    // ตีเส้นขอบให้ตารางสีเทาอ่อน
                    cell.border = {
                        top: {style:'thin', color:{argb:'FFE2E8F0'}}, left: {style:'thin', color:{argb:'FFE2E8F0'}},
                        bottom: {style:'thin', color:{argb:'FFE2E8F0'}}, right: {style:'thin', color:{argb:'FFE2E8F0'}}
                    };
                    cell.alignment = { vertical: 'middle', wrapText: true }; // ให้ข้อความตัดบรรทัดได้

                    // จัดให้อยู่ตรงกลางสำหรับคอลัมน์ (Case ID, ประเภท, วันที่, เบอร์โทร, สถานะ)
                    if ([1, 2, 6, 9, 10].includes(colNumber)) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    }
                });
            }
        });

        // 3. สร้างและบันทึกไฟล์ (Download)
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        saveAs(blob, `TU_Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();

    // ค้นหาอัตโนมัติเมื่อเลือกวันที่
    document.getElementById('startDate').addEventListener('change', applyDateFilter);
    document.getElementById('endDate').addEventListener('change', applyDateFilter);
});
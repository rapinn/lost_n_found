function checkAuth() {
    // ถ้าอยู่หน้า Login ให้ข้ามการตรวจ
    if (window.location.pathname.endsWith('login.html')) return null;
    
    const userStr = localStorage.getItem('tu_secure_user');
    
    // ถ้าไม่มีข้อมูลใน LocalStorage
    if (!userStr) {
        window.location.href = 'login.html';
        return null;
    }

    try {
        const user = JSON.parse(userStr);
        // ตรวจสอบเพิ่มเติมว่ามีข้อมูลจำเป็นและมี Role ที่ถูกต้องหรือไม่
        if (!user.role || !user.firstName) {
            throw new Error("Invalid User Data");
        }
        
        // ตัวอย่างการจำกัดสิทธิ์หน้าเว็บ (ถ้าไม่ใช่ Admin ไม่ให้เข้าหน้า Settings)
        if (user.role !== 'Administrator' && window.location.pathname.endsWith('settings.html')) {
            alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
            window.location.href = 'dashboard.html';
            return null;
        }

        return user;
    } catch (e) {
        // ถ้าแฮกเกอร์ใส่ข้อมูลมั่วๆ ลงใน LocalStorage จน Parse ไม่ได้
        console.error("Auth Error: ", e);
        localStorage.removeItem('tu_secure_user');
        window.location.href = 'login.html';
        return null;
    }
}

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.removeItem('tu_secure_user');
    window.location.href = 'login.html';
}

// ================= LAYOUT TEMPLATES =================
const sidebarTemplate = `
    <div class="sidebar-overlay" id="sidebarOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99;"></div>
    
    <aside class="sidebar" id="mainSidebar" style="width:260px; background:#1e293b; color:#cbd5e1; position:fixed; height:100vh; z-index:100; display:flex; flex-direction:column; box-shadow: 4px 0 15px rgba(0,0,0,0.1);">
        <div class="sidebar-header" style="padding: 25px 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="background:#bc3030; color:white; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px;">
                <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div>
                <h2 style="color:white; font-size:16px; font-weight:600; margin:0; line-height:1.2;">TU Secure</h2>
                <span style="font-size:12px; color:#94a3b8;">Lost & Found System</span>
            </div>
            <button id="closeSidebarBtn" class="mobile-only" style="margin-left:auto; background:none; border:none; color:white; font-size:20px; cursor:pointer; display:none;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        
        <ul style="list-style:none; padding:15px 10px; flex-grow:1;">
            <li style="margin-bottom:5px;">
                <a href="dashboard.html" id="nav-dashboard" class="nav-link" style="display:flex; align-items:center; gap:12px; padding:12px 15px; color:#cbd5e1; text-decoration:none; border-radius:8px; transition:0.3s;">
                    <i class="fa-solid fa-chart-pie" style="width:20px;"></i> ภาพรวมระบบ
                </a>
            </li>
            <li style="margin-bottom:5px;">
                <a href="manage-items.html" id="nav-manage-items" class="nav-link" style="display:flex; align-items:center; gap:12px; padding:12px 15px; color:#cbd5e1; text-decoration:none; border-radius:8px; transition:0.3s;">
                    <i class="fa-solid fa-list-check" style="width:20px;"></i> จัดการรายการสิ่งของ
                </a>
            </li>
            <li style="margin-bottom:5px;">
                <a href="audit-log.html" id="nav-audit" class="nav-link" style="display:flex; align-items:center; gap:12px; padding:12px 15px; color:#cbd5e1; text-decoration:none; border-radius:8px; transition:0.3s;">
                    <i class="fa-solid fa-clipboard-list" style="width:20px;"></i> ประวัติการทำรายการ
                </a>
            </li>
            
            <div style="margin: 20px 15px 10px 15px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">ตั้งค่า</div>
            
            <li style="margin-bottom:5px;">
                <a href="profile.html" id="nav-profile" class="nav-link" style="display:flex; align-items:center; gap:12px; padding:12px 15px; color:#cbd5e1; text-decoration:none; border-radius:8px; transition:0.3s;">
                    <i class="fa-solid fa-user-gear" style="width:20px;"></i> บัญชีผู้ใช้ของฉัน
                </a>
            </li>

            <li style="margin-bottom:5px;">
                <a href="settings.html" id="nav-settings" class="nav-link" style="display:flex; align-items:center; gap:12px; padding:12px 15px; color:#cbd5e1; text-decoration:none; border-radius:8px; transition:0.3s;">
                    <i class="fa-solid fa-sliders" style="width:20px;"></i> ตั้งค่าระบบพื้นฐาน
                </a>
            </li>
        </ul>
        
        <div style="padding:20px; text-align:center; font-size:12px; color:#64748b; border-top:1px solid rgba(255,255,255,0.05);">
            © 2026 TU Secure Center
        </div>
    </aside>
`;

// สร้างฟังก์ชันเพื่อคืนค่า Header HTML ที่มีข้อมูล User ฝังอยู่
function getHeaderTemplate(user) {
    if (!user) return '';
    return `
        <header style="background:#fff; padding:10px 30px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 3px rgba(0,0,0,0.05); position:sticky; top:0; z-index:90;">
            <div style="display:flex; align-items:center; gap:15px;">
                <button id="openSidebarBtn" style="background:none; border:none; font-size:20px; color:#bc3030; cursor:pointer; display:none;" class="mobile-only">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <h1 id="page-title-text" style="font-size:18px; font-weight:600; color:#1e293b; margin:0;">ระบบจัดการสิ่งของสูญหาย</h1>
            </div>
            
            <div style="position: relative;" class="profile-dropdown-container">
                <div class="profile-trigger" onclick="toggleDropdown()" style="display:flex; align-items:center; gap:12px; cursor:pointer; padding: 6px; border-radius: 8px; transition: 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <div style="text-align:right; display:block;" class="desktop-only">
                        <div style="font-size:14px; font-weight:600; color:#1e293b;" id="headerUserName">${user.firstName} ${user.lastName}</div>
                        <div style="font-size:12px; color:#64748b;">${user.role}</div>
                    </div>
                    <div style="width:40px; height:40px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#bc3030; font-size:18px; border: 2px solid #e2e8f0; overflow: hidden;">
                        <img id="headerUserAvatar" src="${user.avatar}" alt="Profile" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <i class="fa-solid fa-chevron-down desktop-only" style="font-size:12px; color:#94a3b8; margin-left:4px;"></i>
                </div>

                <div id="profileDropdown" style="display:none; position:absolute; right:0; top:60px; background:white; min-width:200px; box-shadow:0 4px 20px rgba(0,0,0,0.1); border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; z-index: 100;">
                    <a href="profile.html" style="display:flex; align-items:center; gap:10px; padding:14px 16px; color:#334155; text-decoration:none; font-size:14px; border-bottom:1px solid #f1f5f9; transition:0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <i class="fa-regular fa-user" style="color:#64748b;"></i> ตั้งค่าโปรไฟล์
                    </a>
                    <a href="#" onclick="logout()" style="display:flex; align-items:center; gap:10px; padding:14px 16px; color:#ef4444; text-decoration:none; font-size:14px; font-weight:500; transition:0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='transparent'">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i> ออกจากระบบ
                    </a>
                </div>
            </div>
        </header>
    `;
}

// ฟังก์ชันเปิด-ปิด Dropdown Header
function toggleDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// ปิด Dropdown ถ่าคลิกที่อื่นบนหน้าจอ
window.onclick = function(event) {
    if (!event.target.closest('.profile-dropdown-container')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        }
    }
}

// ================= RENDER FUNCTION =================
function loadLayout(activeMenuId, pageTitle) {
    // 1. ตรวจสอบสิทธิ์ผู้ใช้ก่อน
    const user = checkAuth();
    if (!user) return; // ถ้าไม่มีสิทธิ์ จะถูกเด้งไปหน้า Login เลย

    // 2. โหลดโครงสร้าง
    document.getElementById('sidebar-container').innerHTML = sidebarTemplate;
    document.getElementById('header-container').innerHTML = getHeaderTemplate(user);

    if (pageTitle) document.getElementById('page-title-text').innerText = pageTitle;

    // 3. จัดการสีเมนู Sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.style.backgroundColor = 'transparent';
        link.style.color = '#cbd5e1';
        link.style.fontWeight = '400';
    });

    if (activeMenuId) {
        const activeNav = document.getElementById(activeMenuId);
        if (activeNav) {
            activeNav.style.backgroundColor = '#bc3030';
            activeNav.style.color = 'white';
            activeNav.style.fontWeight = '500';
        }
    }

    // 4. จัดการปุ่มมือถือ
    const isMobile = window.innerWidth <= 1024;
    if(isMobile) {
        document.querySelectorAll('.mobile-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.desktop-only').forEach(el => el.style.display = 'none');
    }

    // 5. เปิดปิด Sidebar มือถือ
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const openBtn = document.getElementById('openSidebarBtn');
    const closeBtn = document.getElementById('closeSidebarBtn');

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    }

    if(openBtn) openBtn.addEventListener('click', toggleSidebar);
    if(closeBtn) closeBtn.addEventListener('click', toggleSidebar);
    if(overlay) overlay.addEventListener('click', toggleSidebar);
}

// ฟังก์ชันสำหรับป้องกัน XSS (แปลงแท็ก HTML เป็นข้อความธรรมดา)
function escapeHTML(str) {
    if (str === null || str === undefined) return "-";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
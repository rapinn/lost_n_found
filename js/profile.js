// ================= INITIALIZE PROFILE DATA =================
document.addEventListener('DOMContentLoaded', () => {
    // โหลดข้อมูลจาก LocalStorage มาใส่ในหน้าจอ
    const user = JSON.parse(localStorage.getItem('tu_secure_user'));
    
    if(user) {
        document.getElementById('inputFirstName').value = user.firstName || "";
        document.getElementById('inputLastName').value = user.lastName || "";
        document.getElementById('inputEmail').value = user.email || "";
        document.getElementById('inputPhone').value = user.phone || "";
        
        // อัปเดตการ์ดด้านซ้าย
        document.getElementById('displayName').innerText = `${user.firstName} ${user.lastName}`;
        document.getElementById('displayEmail').innerText = user.email || "-";
        document.getElementById('displayPhone').innerText = user.phone || "-";
        if(user.avatar) document.getElementById('profileImage').src = user.avatar;
    }
});


function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.currentTarget.classList.add('active');
}

function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const newAvatarUrl = e.target.result;
            // เปลี่ยนรูปภาพใหญ่
            document.getElementById('profileImage').src = newAvatarUrl;
            
            // เปลี่ยนรูปภาพจิ๋วบน Header ทันที
            document.getElementById('headerUserAvatar').src = newAvatarUrl;

            // บันทึกรูปใหม่ลง LocalStorage
            let user = JSON.parse(localStorage.getItem('tu_secure_user'));
            user.avatar = newAvatarUrl;
            localStorage.setItem('tu_secure_user', JSON.stringify(user));
        }
        reader.readAsDataURL(file);
    }
}

function togglePasswordVisibility(inputId, btnElement) {
    const input = document.getElementById(inputId);
    const icon = btnElement.querySelector('i');
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

// ================= SAVE DATA TO LOCAL STORAGE =================
function saveProfile(event) {
    event.preventDefault(); 
    const btn = document.getElementById('saveProfileBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.style.opacity = '0.8';
    btn.style.pointerEvents = 'none'; 

    setTimeout(() => {
        // ดึงค่าใหม่จากฟอร์ม
        const newFirstName = document.getElementById('inputFirstName').value;
        const newLastName = document.getElementById('inputLastName').value;
        const newEmail = document.getElementById('inputEmail').value;
        const newPhone = document.getElementById('inputPhone').value;

        // อัปเดตการ์ดด้านซ้ายแบบ Real-time
        document.getElementById('displayName').innerText = `${newFirstName} ${newLastName}`;
        document.getElementById('displayEmail').innerText = newEmail;
        document.getElementById('displayPhone').innerText = newPhone;

        // ✅ 1. บันทึกลง LocalStorage
        let user = JSON.parse(localStorage.getItem('tu_secure_user'));
        user.firstName = newFirstName;
        user.lastName = newLastName;
        user.email = newEmail;
        user.phone = newPhone;
        // หากเปลี่ยนชื่อ อัปเดตรูป Avatar URL ด้วย (ถ้าใช้รูป Default)
        if(user.avatar.includes("ui-avatars.com")) {
            user.avatar = `https://ui-avatars.com/api/?name=${newFirstName}+${newLastName}&background=bc3030&color=fff`;
            document.getElementById('profileImage').src = user.avatar;
            document.getElementById('headerUserAvatar').src = user.avatar; // อัปเดต Header ทันที
        }
        localStorage.setItem('tu_secure_user', JSON.stringify(user));

        // ✅ 2. อัปเดตชื่อใน Header มุมขวาบน ทันทีโดยไม่ต้อง Refresh
        document.getElementById('headerUserName').innerText = `${newFirstName} ${newLastName}`;

        // แสดงผลว่าสำเร็จ
        btn.classList.add('success-state');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> บันทึกสำเร็จ';
        btn.style.opacity = '1';

        setTimeout(() => {
            btn.classList.remove('success-state');
            btn.innerHTML = originalText;
            btn.style.pointerEvents = 'auto';
        }, 2000);

    }, 1000);
}

function savePassword(event) {
    event.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMsg = document.getElementById('passwordErrorMsg');

    if (newPassword !== confirmPassword) {
        errorMsg.style.display = 'block';
        document.getElementById('confirmPassword').style.borderColor = '#ef4444';
        return;
    }

    errorMsg.style.display = 'none';
    document.getElementById('confirmPassword').style.borderColor = '#cbd5e1';

    const btn = document.getElementById('savePasswordBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        btn.classList.add('success-state');
        btn.innerHTML = '<i class="fa-solid fa-shield-check"></i> เปลี่ยนรหัสผ่านสำเร็จ';
        document.getElementById('passwordForm').reset();

        setTimeout(() => {
            btn.classList.remove('success-state');
            btn.innerHTML = originalText;
            btn.style.pointerEvents = 'auto';
        }, 2500);
    }, 1500);
}

document.getElementById('confirmPassword').addEventListener('input', function() {
    document.getElementById('passwordErrorMsg').style.display = 'none';
    this.style.borderColor = '#cbd5e1';
});
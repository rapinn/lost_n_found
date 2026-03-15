
    const LAMBDA_SEARCH_URL = "https://5mv3jbv75h3naskrlvb7esop4e0xnyqv.lambda-url.us-east-1.on.aws/";
    const LAMBDA_LOST_URL = "https://sv7tbffuhi5tdtqix5a3lanp740xxggi.lambda-url.us-east-1.on.aws/";
    const LAMBDA_ADMIN_URL = "https://hdc2oly7gs5v3kse5ifs6kjto40hlegl.lambda-url.us-east-1.on.aws/";
    const LIFF_ID = "2008305063-P2NpboxX";

    function formatDate(isoString) {
      if (!isoString) return '-';
      try {
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? '-' : date.toISOString().split('T')[0];
      } catch (e) { return '-'; }
    }
    
    function formatTime(isoString) {
      if (!isoString) return '-';
      try {
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? '-' : date.toTimeString().split(' ')[0].substring(0, 5);
      } catch (e) { return '-'; }
    }

    function renderAdminTable(items) {
      const tbody = document.getElementById("adminTableBody");
      if (!tbody) return;

      items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding: 40px;">ไม่มีข้อมูล</td></tr>`;
        return;
      }

      tbody.innerHTML = items.map((item, index) => {
        const isFound = item.item_type === 'FOUND';
        const isLost = item.item_type === 'LOST';
        
        let typeDisplay = '';
        if (isFound) {
          typeDisplay = `<span style="display:inline-block;padding:4px 8px;border-radius:4px;font-weight:600;background-color:#dcfce7;color:#166534;">พบของ</span>`;
        } else if (isLost) {
          typeDisplay = `<span style="display:inline-block;padding:4px 8px;border-radius:4px;font-weight:600;background-color:#fee2e2;color:#991b1b;">ของหาย</span>`;
        } else {
          typeDisplay = '-';
        }

        let displayBrandInfo = item.brand || '-';

        const statusOptions = ['แจ้งแล้ว', 'รอรับคืน', 'คืนเจ้าของแล้ว', 'หมดอายุ'];
        const statusButtons = statusOptions.map(status => {
          const isActive = item.status === status;
          const bgColor = isActive ? '#10b981' : '#e5e7eb';
          const textColor = isActive ? 'white' : '#374151';
          const cursor = isActive ? 'default' : 'pointer';
          
          return `<button 
            onclick="${isActive ? '' : `changeStatus('${item.item_id}', '${status}')`}" 
            style="
              padding:4px 8px;
              margin:2px;
              background:${bgColor};
              color:${textColor};
              border:none;
              border-radius:4px;
              cursor:${cursor};
              font-size:0.75rem;
              font-weight:${isActive ? 'bold' : 'normal'};
            "
            ${isActive ? 'disabled' : ''}
          >${status}</button>`;
        }).join('');

        return `
          <tr>
            <td data-label="ลำดับ">${index + 1}</td>
            <td data-label="ประเภทการแจ้ง">${typeDisplay}</td>
            <td data-label="หมวดหมู่">${item.category || "-"}</td>
            <td data-label="รูปภาพ">
              ${item.image_url ? `<a href="${item.image_url}" target="_blank"><img src="${item.image_url}" alt="item" style="width:50px;height:50px;object-fit:cover;"></a>` : 'ไม่มี'}
            </td>
            <td data-label="ยี่ห้อ/รุ่น">${displayBrandInfo}</td>
            <td data-label="รายละเอียด">${item.details || "-"}</td>
            <td data-label="วันที่">${item.date || "-"}</td>
            <td data-label="เวลา">${item.time || "-"}</td>
            <td data-label="สถานที่">${item.location || "-"}</td>
            <td data-label="ผู้แจ้ง">
              <div style="font-size:0.875rem;">
                <div><strong>ชื่อ:</strong> ${item.reporter_name || '-'}</div>
                <div><strong>เบอร์:</strong> ${item.reporter_contact || '-'}</div>
                ${item.reporter_student_id ? `<div><strong>รหัส:</strong> ${item.reporter_student_id}</div>` : ''}
              </div>
            </td>
            <td data-label="Case ID">
              <span style="color:#6b7280;font-weight:bold;font-family:monospace;">${item.case_id || 'N/A'}</span>
            </td>
            <td data-label="สถานะ">
              <div style="display:flex;flex-direction:column;gap:2px;">
                ${statusButtons}
              </div>
            </td>
            <td data-label="การจัดการ">
              <button onclick="editItem('${item.item_id}')" style="padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;margin-bottom:4px;width:100%;">แก้ไข</button>
              <button onclick="deleteItem('${item.item_id}')" style="padding:6px 12px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;width:100%;">ลบ</button>
            </td>
          </tr>
        `;
      }).join("");

      console.log(`✅ Displayed ${items.length} items`);
    }

    async function fetchFromLambda(payload) {
      const tbody = document.getElementById("adminTableBody");
      tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;">กำลังค้นหา...</td></tr>`;
      
      try {
        const response = await fetch(LAMBDA_SEARCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        console.log('📥 Lambda response:', result);

        if (result.status === 'success' && result.count > 0) {
          renderAdminTable(result.items);
        } else {
          tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;">ไม่พบข้อมูล</td></tr>`;
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        tbody.innerHTML = `<tr><td colspan="13" style="color:red; text-align:center;">เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
      }
    }

    async function changeStatus(itemId, newStatus) {
      try {
        console.log(`Changing status for ${itemId} to ${newStatus}`);
        
        const response = await fetch(LAMBDA_ADMIN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'change_status',
            item_id: itemId,
            status: newStatus
          })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          console.log('✅ Status changed successfully');
          applyFilters();
        } else {
          alert('❌ เกิดข้อผิดพลาด: ' + result.error);
        }
        
      } catch (error) {
        console.error('Error changing status:', error);
        alert('❌ เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ' + error.message);
      }
    }

    async function editItem(itemId) {
      try {
        const response = await fetch(LAMBDA_SEARCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ search_mode: 'item_id', item_id: itemId })
        });
        
        const result = await response.json();
        if (result.status !== 'success' || result.count === 0) {
          alert('❌ ไม่พบข้อมูล');
          return;
        }
        
        const item = result.items[0];
        
        const newLocation = prompt('📍 สถานที่:', item.location || '');
        if (newLocation === null) return;
        
        const newDetails = prompt('📝 รายละเอียด:', item.details || '');
        if (newDetails === null) return;
        
        const newBrand = prompt('🏷️ ยี่ห้อ/รุ่น:', item.brand || '');
        if (newBrand === null) return;
        
        const newDate = prompt('📅 วันที่ (YYYY-MM-DD):', item.date || '');
        if (newDate === null) return;
        
        const newTime = prompt('🕐 เวลา (HH:MM):', item.time || '');
        if (newTime === null) return;
        
        const updateResponse = await fetch(LAMBDA_ADMIN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            item_id: itemId,
            updates: {
              location: newLocation,
              details: newDetails,
              brand: newBrand,
              date: newDate,
              time: newTime
            }
          })
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResult.status === 'success') {
          alert('✅ แก้ไขข้อมูลสำเร็จ!');
          applyFilters();
        } else {
          alert('❌ เกิดข้อผิดพลาด: ' + updateResult.error);
        }
        
      } catch (error) {
        console.error('Error editing item:', error);
        alert('❌ เกิดข้อผิดพลาดในการแก้ไข: ' + error.message);
      }
    }

    async function deleteItem(itemId) {
      const confirmed = confirm(
        '⚠️ ต้องการลบรายการนี้หรือไม่?\n\n' +
        '❗️ การดำเนินการนี้ไม่สามารถย้อนกลับได้\n' +
        '❗️ รูปภาพใน S3 จะถูกลบด้วย'
      );
      
      if (!confirmed) return;
      
      try {
        const response = await fetch(LAMBDA_ADMIN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            item_id: itemId
          })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          alert('✅ ' + result.message);
          applyFilters();
        } else {
          alert('❌ เกิดข้อผิดพลาด: ' + result.error);
        }
        
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('❌ เกิดข้อผิดพลาดในการลบ: ' + error.message);
      }
    }

    /**
     * ⭐️ ฟังก์ชัน Filter (เพิ่ม categoryFilter)
     */
    function applyFilters() {
      const categoryFilter = document.getElementById("categoryFilter")?.value;  // ✅ เพิ่มใหม่
      const statusFilter = document.getElementById("statusFilter")?.value;
      const dateFilter = document.getElementById("expiryFilter")?.value;

      console.log('🔍 Filter values:', { 
        category: categoryFilter || '(ทั้งหมด)',
        status: statusFilter || '(ทั้งหมด)', 
        date: dateFilter || '(ทั้งหมด)' 
      });

      const payload = {
        search_mode: "admin"
      };
      
      // ✅ เพิ่ม category filter
      if (categoryFilter && categoryFilter !== '') {
        payload.keyword = categoryFilter;  // ใช้ keyword สำหรับ category
      }
      
      if (statusFilter && statusFilter !== '') {
        payload.status = statusFilter;
      }
      
      if (dateFilter && dateFilter !== '') {
        payload.date = dateFilter;
      }
      
      console.log('📤 Sending payload:', payload);
      fetchFromLambda(payload);
    }

    /**
     * ⭐️ เมื่อหน้าโหลด
     */
    document.addEventListener('DOMContentLoaded', () => {
      const categorySelect = document.getElementById("categoryFilter");  // ✅ เพิ่มใหม่
      const statusSelect = document.getElementById("statusFilter");
      const dateInput = document.getElementById("expiryFilter");
      
      // ✅ เพิ่ม Event Listener สำหรับ categoryFilter
      if (categorySelect) {
        categorySelect.addEventListener("change", applyFilters);
      }
      
      if (statusSelect) {
        statusSelect.addEventListener("change", applyFilters);
      }
      
      if (dateInput) {
        dateInput.addEventListener("change", applyFilters);
      }

      console.log('🚀 Loading all items...');
      fetchFromLambda({ search_mode: "admin" });
    });
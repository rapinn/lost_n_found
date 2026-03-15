
  // ⭐️ 1. URL ของ Lambda "แจ้งของหาย" (Lost)
  const LAMBDA_LOST_URL = "https://sv7tbffuhi5tdtqix5a3lanp740xxggi.lambda-url.us-east-1.on.aws/";
  const LIFF_ID = "2008305063-P2NpboxX";

  function showStatus(msg, type = 'info') {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.style.color = type === 'error' ? '#b91c1c' : type === 'success' ? '#166534' : '#374151';
  }
  function setSubmitting(disabled) {
    const btn = document.getElementById('reportBtn');
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.6' : '1';
    btn.textContent = disabled ? 'กำลังส่ง...' : 'ส่งข้อมูลแจ้งของหาย';
  }


  function readFileAsDataURL(file) {
    return new Promise((resolve) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
  function compressImage(file, maxW = 1024, maxH = 1024, quality = 0.7) {
    return new Promise((resolve) => {
      if (!file) return resolve('');
      const img = new Image();
      const fr = new FileReader();
      fr.onload = () => { img.src = fr.result; };
      fr.onerror = () => resolve('');
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxW / width, maxH / height, 1);
        const w = Math.round(width * ratio);
        const h = Math.round(height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl || '');
        } catch {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      fr.readAsDataURL(file);
    });
  }

  let liffProfile = null;
  async function initLiffSafe() {
    try { 
      // (สันนิษฐานว่า liff.js มีฟังก์ชัน initializeLiff)
      // liffProfile = await initializeLiff(LIFF_ID); 
    }
    catch (e) { console.warn('LIFF init skipped:', e); }
  }


  // ⭐️ 2. ฟังก์ชันสำหรับส่งข้อมูลไป Lambda (ตัวเดียว)
  // (ลบ sendToGoogleSheet ทิ้ง)
  async function sendToLambda(data) {
      // "แมป" (map) ข้อมูลจากฟอร์ม ให้ตรงกับที่ Lambda คาดหวัง
      const lambdaPayload = {
          itemDescription: data.itemName,// (ฟอร์มใช้ itemName)
          brandOrId: data.brand,
          distinguishingFeatures: data.description,
          lostLocation: data.location,
          lostDate: data.date,
          lostTime: data.time,
          imageBase64: data.itemImage || "",
          reporterName: data.reporterName,
          reporterContact: data.reporterPhone,
          reporterStudentId: data.reporterStudentId
      };


      const response = await fetch(LAMBDA_LOST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lambdaPayload)
      });


      if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: "Unknown error from Lambda" }));
          throw new Error(errorBody.error || `HTTP Error ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Sent to Lambda (Lost), got response:', result);
      return result; 
  }

  // ⭐️ 3. แก้ไข handleSubmit (ตัวหลัก)
  document.getElementById("reportBtn").addEventListener("click", async function () {
    setSubmitting(true);
    showStatus('กำลังส่ง...', 'info');


    const itemName = document.getElementById("itemName").value.trim();
    const brand = document.getElementById("brand").value.trim();
    const description = document.getElementById("description").value.trim();
    const location = document.getElementById("location").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const reporterName = document.getElementById("reporterName").value.trim();
    const reporterPhone = document.getElementById("reporterPhone").value.trim();
    const reporterStudentId = document.getElementById("reporterStudentId").value.trim();

    // Validate (เหมือนเดิม)
    if (!itemName || !description || !location || !date || !time || !reporterName || !reporterPhone || !reporterStudentId) {
      showStatus('❌ กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      setSubmitting(false);
      return;
    }
    if (reporterPhone.length !== 10 || !/^\d{10}$/.test(reporterPhone)) {
      showStatus('❌ เบอร์โทรต้องเป็นตัวเลข 10 หลัก', 'error');
      setSubmitting(false);
      return;
    }
    if (reporterStudentId.length !== 10 || !/^\d{10}$/.test(reporterStudentId)) {
      showStatus('❌ รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก', 'error');
      setSubmitting(false);
      return;
    }


    // Process Image (เหมือนเดิม)
    const file = document.getElementById("itemImage").files?.[0] || null;
    let itemImage = '';
    try {
      itemImage = await compressImage(file);
      if (!itemImage && file) itemImage = await readFileAsDataURL(file);
      if (itemImage && itemImage.length > 3_500_000) {
        itemImage = '';
        showStatus('รูปภาพใหญ่เกินไป จะส่งข้อมูลโดยไม่แนบรูป', 'info');
      }
    } catch (e) {
      console.warn("Could not process image", e);
      itemImage = '';
    }


    const data = {
      itemName, brand, description, location, date, time,
      reporterName, reporterPhone, reporterStudentId,
      itemImage,
    };


    // ⭐️ 5. ส่งข้อมูลไป AWS ที่เดียว
    try {
      showStatus('กำลังเชื่อมต่อฐานข้อมูล AWS...', 'info');
      const lambdaResult = await sendToLambda(data);


      showStatus(`✅ ส่งข้อมูลแจ้งของหายเรียบร้อย! (Case ID: ${lambdaResult.caseId || 'N/A'})`, 'success');
      
      // ล้างฟอร์ม
      document.getElementById("itemName").value = "";
      document.getElementById("brand").value = "";
      document.getElementById("description").value = "";
      document.getElementById("location").value = "";
      document.getElementById("date").value = "";
      document.getElementById("time").value = "";
      document.getElementById("reporterName").value = "";
      document.getElementById("reporterPhone").value = "";
      document.getElementById("reporterStudentId").value = "";
      document.getElementById("itemImage").value = "";
      
    } catch (error) {
      console.error('Submit failed:', error);
      showStatus(`❌ ส่งข้อมูลไม่สำเร็จ: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    initLiffSafe();
    // (Event Listener ถูกย้ายไปอยู่ข้างบนแล้ว)
  });
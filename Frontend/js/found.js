const LAMBDA_FOUND_URL =
  "https://pg64fx4orrlpqeczch4r2r4o4y0bbllg.lambda-url.us-east-1.on.aws/";
const LIFF_ID = "2008305063-P2NpboxX";

// แสดง/ซ่อนช่องกรอกหมวดหมู่เอง
function toggleOtherCategory() {
  const category = document.getElementById("category").value;
  const otherGroup = document.getElementById("otherCategoryGroup");
  if (category === "other") {
    otherGroup.style.display = "block";
    document.getElementById("otherCategory").required = true;
  } else {
    otherGroup.style.display = "none";
    document.getElementById("otherCategory").required = false;
    document.getElementById("otherCategory").value = "";
  }
}

// แสดง/ซ่อนช่องกรอกข้อมูลสำหรับนักศึกษา
function toggleStudentFields() {
  const userStatus = document.getElementById("userStatus")?.value;
  const studentOnlyFields = document.getElementById("studentOnlyFields");
  const studentIdInput = document.getElementById("reporterStudentId");
  const facultyInput = document.getElementById("reporterFaculty");
  const majorInput = document.getElementById("reporterMajor");

  if (!studentOnlyFields || !studentIdInput) return;

  if (userStatus === "student") {
    studentOnlyFields.style.display = "block";
    studentIdInput.required = true;
  } else {
    studentOnlyFields.style.display = "none";
    studentIdInput.required = false;
    studentIdInput.value = "";
    if (facultyInput) facultyInput.value = "";
    if (majorInput) majorInput.value = "";
  }
}

// UI helpers
function showStatus(msg, type = "info") {
  const el = document.getElementById("status");
  if (el) {
    el.textContent = msg;
    el.style.color =
      type === "error" ? "#b91c1c" : type === "success" ? "#166534" : "#374151";
  }
}

function setSubmitting(disabled) {
  const btn = document.getElementById("submitBtn");
  if (btn) {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? "0.6" : "1";
    btn.textContent = disabled ? "กำลังส่ง..." : "ส่งข้อมูลพบของหาย";
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64 || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

let liffProfile = null;
async function initLiffSafe() {
  try {
    await liff.init({ liffId: LIFF_ID });
    console.log("✅ LIFF initialized");
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  } catch (e) {
    console.warn("LIFF init skipped:", e);
  }
}

// ฟังก์ชันส่งข้อมูลไป Lambda
async function sendToLambda(data) {
  let imageUrl = null;

  // Upload รูปภาพก่อน (ถ้ามี)
  if (data.itemImage) {
    try {
      console.log("📤 Uploading image...");
      const uploadPayload = {
        action: "upload_image",
        image_data: data.itemImage,
        image_name: `found_${Date.now()}.jpg`,
        folder: "found",
      };

      const uploadResponse = await fetch(LAMBDA_FOUND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadPayload),
      });

      const uploadResult = await uploadResponse.json();
      console.log("📥 Upload response:", uploadResult);

      if (uploadResult.status === "success") {
        imageUrl = uploadResult.image_url;
        console.log("✅ Image uploaded:", imageUrl);
      } else {
        console.warn("⚠️ Image upload failed:", uploadResult.error);
      }
    } catch (err) {
      console.error("❌ Image upload error:", err);
    }
  }

  // ส่งข้อมูลหลัก
  const reportPayload = {
    action: "report_found",
    item_type: "FOUND",
    category: data.category,
    brand: data.brand || "-",
    details: data.details,
    location: data.location,
    date: data.date,
    time: data.time,
    reporter_name: data.reporterName,
    reporter_contact: data.reporterPhone,
    reporter_student_id: data.reporterStudentId,
  };

  if (imageUrl) {
    reportPayload.image_url = imageUrl;
  }

  console.log("📤 Sending report:", reportPayload);

  const response = await fetch(LAMBDA_FOUND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportPayload),
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorBody.error || `HTTP Error ${response.status}`);
  }

  const result = await response.json();
  console.log("✅ Report response:", result);
  return result;
}

async function handleSubmit() {
  setSubmitting(true);
  showStatus("กำลังส่ง...", "info");

  let category = document.getElementById("category").value;

  // ถ้าเลือก "อื่น ๆ" ให้ใช้ค่าที่กรอกเอง
  if (category === "other") {
    const otherCat = document.getElementById("otherCategory").value.trim();
    if (!otherCat) {
      showStatus("❌ กรุณาระบุหมวดหมู่", "error");
      setSubmitting(false);
      return;
    }
    category = otherCat;
  }

  const brand = document.getElementById("brand").value.trim();
  const details = document.getElementById("details").value.trim();
  const location = document.getElementById("location").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const reporterName = document.getElementById("reporterName").value.trim();
  const reporterPhone = document.getElementById("reporterPhone").value.trim();
  const userStatus = document.getElementById("userStatus").value;
  let reporterStudentId = document
    .getElementById("reporterStudentId")
    .value.trim();

  // หากไม่ใช่นักศึกษา ให้ล้างค่า studentId เพื่อไม่ส่งข้อมูลที่ไม่เกี่ยวข้อง
  if (userStatus !== "student") {
    reporterStudentId = "";
  }

  // Validate
  if (
    !category ||
    !details ||
    !location ||
    !date ||
    !time ||
    !reporterName ||
    !reporterPhone ||
    !userStatus ||
    (userStatus === "student" && !reporterStudentId)
  ) {
    showStatus("❌ กรุณากรอกข้อมูลให้ครบถ้วน", "error");
    setSubmitting(false);
    return;
  }

  if (!/^\d{10}$/.test(reporterPhone)) {
    showStatus("❌ เบอร์โทรต้องเป็นตัวเลข 10 หลัก", "error");
    setSubmitting(false);
    return;
  }

  if (userStatus === "student" && !/^\d{10}$/.test(reporterStudentId)) {
    showStatus("❌ รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก", "error");
    setSubmitting(false);
    return;
  }

  // Process Image (แปลงเป็น Base64)
  const file = document.getElementById("itemImage").files?.[0] || null;
  let itemImage = "";

  if (file) {
    try {
      console.log("📷 Processing image:", file.name, file.size, "bytes");
      itemImage = await fileToBase64(file);
      console.log("✅ Image converted to Base64, length:", itemImage.length);

      // ถ้ารูปใหญ่เกินไป (> 6 MB in base64) ให้ข้าม
      if (itemImage.length > 6_000_000) {
        console.warn("⚠️ Image too large, skipping");
        itemImage = "";
        showStatus("รูปภาพใหญ่เกินไป จะส่งข้อมูลโดยไม่แนบรูป", "info");
      }
    } catch (e) {
      console.error("❌ Could not process image", e);
      itemImage = "";
    }
  }

  const data = {
    category,
    brand,
    details,
    location,
    date,
    time,
    reporterName,
    reporterPhone,
    reporterStudentId,
    itemImage,
  };

  // ส่งข้อมูลไป Lambda
  try {
    showStatus("กำลังบันทึกข้อมูล...", "info");
    const result = await sendToLambda(data);

    if (result.status === "success") {
      showStatus(
        `✅ ส่งข้อมูลพบของเรียบร้อย!\n\nCase ID: ${result.case_id || "N/A"}`,
        "success",
      );

      // ล้างฟอร์ม
      document.getElementById("category").value = "";
      document.getElementById("otherCategory").value = "";
      const otherGroup = document.getElementById("otherCategoryGroup");
      if (otherGroup) otherGroup.style.display = "none";
      document.getElementById("brand").value = "";
      document.getElementById("details").value = "";
      document.getElementById("location").value = "";
      document.getElementById("date").value = "";
      document.getElementById("time").value = "";
      document.getElementById("reporterName").value = "";
      document.getElementById("reporterPhone").value = "";
      document.getElementById("userStatus").value = "";
      document.getElementById("reporterStudentId").value = "";
      document.getElementById("reporterFaculty").value = "";
      document.getElementById("reporterMajor").value = "";
      toggleStudentFields();
      document.getElementById("itemImage").value = "";

      // ปิด LIFF (ถ้าอยู่ใน LINE)
      if (typeof liff !== "undefined" && liff.isInClient()) {
        setTimeout(() => liff.closeWindow(), 2000);
      }
    } else {
      showStatus(
        `❌ เกิดข้อผิดพลาด: ${result.error || "Unknown error"}`,
        "error",
      );
    }
  } catch (error) {
    console.error("❌ Submit failed:", error);
    showStatus(`❌ ส่งข้อมูลไม่สำเร็จ: ${error.message}`, "error");
  } finally {
    setSubmitting(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLiffSafe();

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", handleSubmit);
  }

  const userStatusSelect = document.getElementById("userStatus");
  if (userStatusSelect) {
    userStatusSelect.addEventListener("change", toggleStudentFields);
    toggleStudentFields();
  }

  const categorySelect = document.getElementById("category");
  if (categorySelect) {
    categorySelect.addEventListener("change", toggleOtherCategory);
  }
});

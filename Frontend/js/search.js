const LAMBDA_SEARCH_URL =
  "https://5mv3jbv75h3naskrlvb7esop4e0xnyqv.lambda-url.us-east-1.on.aws/";

const searchButton = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("adminTableBody");
const container = document.getElementById("adminTableContainer");

// Event Listener พร้อม Validate ก่อนค้นหา
searchButton.addEventListener("click", async function (e) {
  const itemName = document.getElementById("searchItemName").value.trim();
  const location = document.getElementById("searchLocation").value.trim();
  const date = document.getElementById("searchDate").value;
  const details = document.getElementById("searchDetails").value.trim();

  // ถ้าไม่ได้กรอกอะไรเลย
  if (!itemName && !location && !date && !details) {
    alert("โปรดกรอกข้อมูลอย่างน้อย 1 ช่องในการค้นหา");
    return;
  }

  // รวมคำค้นหา
  const keyword = itemName || details;

  const payload = {
    keyword: keyword || "",
    location: location || "",
    date: date || "",
    moreDetails: details || "",
  };

  await fetchFromLambda(payload);
});

// ฟังก์ชันเรียก Lambda และแสดงผลลัพธ์
async function fetchFromLambda(payload) {
  const tbody = document.getElementById("adminTableBody");
  tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">🔄 กำลังค้นหา...</td></tr>`;
  container.style.display = "block";
  if (searchButton) searchButton.disabled = true;

  try {
    const response = await fetch(LAMBDA_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errData = await response
        .json()
        .catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(
        errData.error || `HTTP error! status: ${response.status}`,
      );
    }
    const result = await response.json();
    renderAdminTable(result.items || []);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="12" style="color:red; text-align:center; padding: 40px;">⚠️ เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
    container.style.display = "block";
  } finally {
    if (searchButton) searchButton.disabled = false;
  }
}

// ฟังก์ชันแสดงผลตารางทั้ง LOST/FOUND
function renderAdminTable(items) {
  const tbody = document.getElementById("adminTableBody");
  const contactSection = document.getElementById("contactSection");
  const contactForm = document.getElementById("contactForm");
  const contactItemsContainer = document.getElementById(
    "contactItemsContainer",
  );

  if (!tbody) return;

  items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  container.style.display = "block";

  if (items.length === 0) {
    tbody.innerHTML = `
          <tr>
            <td colspan="12" style="text-align:center; padding: 40px; color:#b22222; font-weight:bold;">
              ❌ ไม่พบข้อมูลที่ตรงกัน
            </td>
          </tr>
        `;
    if (contactSection) contactSection.style.display = "none";
    if (contactForm) contactForm.style.display = "none";
    if (contactItemsContainer) contactItemsContainer.innerHTML = "";
    return;
  }

  tbody.innerHTML = items
    .map((item, index) => {
      let displayBrandInfo = item.brand || "-";
      const isFound = item.item_type === "FOUND";
      const typeColor = isFound ? "#dcfce7" : "#fee2e2";
      const typeTextColor = isFound ? "#166534" : "#991b1b";
      const typeText = isFound ? "พบของ" : "ของหาย";

      const statusMap = {
        รอรับคืน: { class: "waiting", text: "รอรับคืน" },
        คืนแล้ว: { class: "received", text: "คืนแล้ว" },
        ระบายแล้ว: { class: "expired", text: "ระบายแล้ว" },
        แจ้งแล้ว: { class: "waiting", text: "แจ้งแล้ว" },
      };
      const statusInfo = statusMap[item.status] || {
        class: "waiting",
        text: item.status || "-",
      };

      return `
          <tr>
            <td data-label="ลำดับ">${index + 1}</td>
            <td data-label="ประเภท">
              <span style="display:inline-block;padding:4px 8px;border-radius:4px;font-weight:600;background-color:${typeColor};color:${typeTextColor};">
                ${typeText}
              </span>
            </td>
            <td data-label="หมวดหมู่">${item.category || "-"}</td>
            <td data-label="รูปภาพ">
              ${item.image_url ? `<a href="${item.image_url}" target="_blank"><img src="${item.image_url}" alt="item" style="width:50px;height:50px;object-fit:cover;"></a>` : "ไม่มี"}
            </td>
            <td data-label="ยี่ห้อ/รุ่น">${displayBrandInfo}</td>
            <td data-label="รายละเอียด">${item.details || "-"}</td>
            <td data-label="วันที่">${item.date || "-"}</td>
            <td data-label="เวลา">${item.time || "-"}</td>
            <td data-label="สถานที่">${item.location || "-"}</td>
            <td data-label="ผู้แจ้ง">
              <div style="font-size:0.875rem;">
                <div><strong>ชื่อ:</strong> ${item.reporter_name || "-"}</div>
              </div>
            </td>
          </tr>
        `;
    })
    .join("");

  // เตรียมฟอร์มติดต่อรับของ
  if (contactSection) {
    contactSection.style.display = "block";
  }
  if (contactForm) {
    contactForm.style.display = "none";
  }
  if (contactItemsContainer) {
    contactItemsContainer.innerHTML = renderContactItems(items);
  }
}

function renderContactItems(items) {
  if (!items || items.length === 0) return "";

  return `
    <p class="contact-items-title">เลือกสิ่งของที่ต้องการรับคืน (ติ๊กเลือก)</p>
    <div class="contact-items-list">
      ${items
        .map((item, index) => {
          const label =
            `${index + 1}. ${item.category || "-"} / ${item.brand || ""} ${item.model || ""}`.trim();
          const id = `contactItem_${index}`;
          return `
            <label class="contact-item-label">
              <input type="checkbox" id="${id}" name="contactItem" value="${item.id || index}" />
              <span>${label}</span>
            </label>
          `;
        })
        .join("")}
    </div>
  `;
}

// เพิ่ม Enter Search ทุกฟิลด์
["searchItemName", "searchLocation", "searchDate", "searchDetails"].forEach(
  (id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          searchButton.click();
        }
      });
    }
  },
);

// ติดตั้ง event listener สำหรับฟอร์มติดต่อรับของ
const contactToggleBtn = document.getElementById("contactToggleBtn");
const contactForm = document.getElementById("contactForm");
const contactSubmitBtn = document.getElementById("contactSubmitBtn");

if (contactToggleBtn) {
  contactToggleBtn.addEventListener("click", () => {
    if (!contactForm) return;
    const showing = contactForm.style.display === "block";
    contactForm.style.display = showing ? "none" : "block";
    if (!showing) {
      contactForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (contactSubmitBtn) {
  contactSubmitBtn.addEventListener("click", () => {
    const selectedItems = Array.from(
      document.querySelectorAll(
        "#contactItemsContainer input[type=checkbox]:checked",
      ),
    ).map((checkbox) => checkbox.value);

    const name = document.getElementById("contactName")?.value.trim() || "";
    const phone = document.getElementById("contactPhone")?.value.trim() || "";
    const date = document.getElementById("contactDate")?.value || "";
    const time = document.getElementById("contactTime")?.value || "";

    if (selectedItems.length === 0) {
      alert("โปรดเลือกสิ่งของที่ต้องการรับ");
      return;
    }
    if (!name) {
      alert("โปรดกรอกชื่อ-นามสกุล");
      return;
    }
    if (!phone) {
      alert("โปรดกรอกเบอร์ติดต่อ");
      return;
    }
    if (!date) {
      alert("โปรดเลือกวันที่ที่จะมารับของ");
      return;
    }
    if (!time) {
      alert("โปรดเลือกเวลาที่จะมารับของ");
      return;
    }

    // TODO: ส่งข้อมูลไปยัง backend หรือบันทึก
    alert(
      `คุณได้เลือก ${selectedItems.length} ชิ้น\nชื่อ: ${name}\nเบอร์: ${phone}\nวันที่: ${date}\nเวลา: ${time}`,
    );
  });
}

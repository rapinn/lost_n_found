// PDPA
(function () {
  const storageKey = "pdpaConsentAccepted";

  // Exclude admin pages
  const excludePaths = ["admin.html", "/admin"];
  if (excludePaths.some((p) => window.location.pathname.includes(p))) {
    return;
  }

  let hasConsent = false;
  try {
    hasConsent = localStorage.getItem(storageKey) === "true";
  } catch (e) {
    console.warn("PDPA consent: localStorage unavailable", e);
  }

  if (hasConsent) return;

  const overlay = document.createElement("div");
  overlay.id = "pdpaConsentOverlay";
  overlay.className = "pdpa-consent-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "pdpaConsentTitle");

  overlay.innerHTML = `
      <div class="pdpa-consent-card">
        <h2 id="pdpaConsentTitle">การขอความยินยอมในการเก็บรวบรวมข้อมูลส่วนบุคคล (PDPA)</h2>
        <div class="pdpa-consent-body">
          <p>ข้อมูลส่วนบุคคลที่ท่านกรอกในแบบฟอร์มนี้ เช่น ชื่อ-นามสกุล เบอร์โทรศัพท์ หรือข้อมูลอื่น ๆ ที่เกี่ยวข้อง จะถูกเก็บรวบรวมและนำไปใช้เพื่อวัตถุประสงค์ในการติดต่อกลับ การให้บริการ และการปรับปรุงระบบหรือบริการของผู้ให้บริการเท่านั้น</p>
          <p>ผู้ให้บริการจะดำเนินการเก็บรักษาข้อมูลส่วนบุคคลของท่านอย่างเหมาะสมและปลอดภัย ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และจะไม่เปิดเผยข้อมูลของท่านแก่บุคคลภายนอกโดยไม่ได้รับความยินยอม เว้นแต่กรณีที่กฎหมายกำหนด</p>
          <p>โดยการกรอกข้อมูลและกดยืนยันในแบบฟอร์มนี้ ถือว่าท่านได้อ่านและยินยอมให้มีการเก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคลตามวัตถุประสงค์ดังกล่าว
          </p>
          <p>‎</p>
        </div>
        <button type="button" id="pdpaConsentAgreeBtn" class="pdpa-consent-btn">ยินยอม ✓</button>
      </div>
    `;

  document.body.appendChild(overlay);

  const agreeBtn = document.getElementById("pdpaConsentAgreeBtn");
  agreeBtn?.addEventListener("click", () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch (e) {
      console.warn("PDPA consent: could not save to localStorage", e);
    }
    overlay.remove();
  });
})();

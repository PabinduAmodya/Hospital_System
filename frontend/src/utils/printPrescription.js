/**
 * Generates and prints a professional A5 prescription document.
 *
 * @param {Object} consultation - The consultation data
 * @param {Object} hospitalInfo - Hospital details (name, address, phone, email)
 */
export function printPrescription(consultation, hospitalInfo) {
  const {
    patient = {},
    doctor = {},
    prescriptionItems = [],
    diagnosis = "",
    followUpDate = "",
    specialInstructions = "",
    consultationNumber = "",
    consultationDate = "",
    labOrders = [],
  } = consultation;

  const patientAge = calculateAge(patient.dateOfBirth || patient.dob);
  const formattedDate = formatDate(consultationDate);
  const formattedFollowUp = followUpDate ? formatDate(followUpDate) : "";

  const prescriptionRows = prescriptionItems
    .map(
      (item, i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:12px;">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:12px;">
          ${esc(item.drugName || item.medication || "")}
          ${item.genericName ? `<br><span style="font-weight:400;color:#6b7280;font-size:11px;">${esc(item.genericName)}</span>` : ""}
        </td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${esc(item.dosage || "")}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${esc(item.frequency || "")}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${esc(item.duration || "")}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${esc(item.route || "")}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">${esc(item.instructions || item.notes || "")}</td>
      </tr>`
    )
    .join("");

  const labOrdersHtml =
    labOrders && labOrders.length > 0
      ? `
      <div style="margin-top:16px;">
        <h3 style="font-size:13px;font-weight:700;color:#1e3a5f;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.5px;">Lab Orders</h3>
        <ul style="margin:0;padding-left:20px;">
          ${labOrders.map((t) => `<li style="font-size:12px;color:#374151;margin-bottom:3px;">${esc(typeof t === "string" ? t : t.testName || t.name || "")}</li>`).join("")}
        </ul>
      </div>`
      : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Prescription - ${esc(consultationNumber)}</title>
<style>
  @page {
    size: A5 portrait;
    margin: 12mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #1f2937;
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<!-- Header -->
<div style="text-align:center;border-bottom:2px solid #1e40af;padding-bottom:10px;margin-bottom:12px;">
  <h1 style="font-size:20px;font-weight:800;color:#1e40af;margin-bottom:2px;letter-spacing:0.5px;">${esc(hospitalInfo?.name || "Hospital")}</h1>
  <p style="font-size:10px;color:#6b7280;font-style:italic;margin:0 0 2px 0;">Your Health, Our Priority</p>
  <p style="font-size:10px;color:#6b7280;margin:0;">${esc(hospitalInfo?.address || "")}</p>
  <p style="font-size:10px;color:#6b7280;margin:0;">
    ${hospitalInfo?.phone ? `Tel: ${esc(hospitalInfo.phone)}` : ""}
    ${hospitalInfo?.phone && hospitalInfo?.email ? " | " : ""}
    ${hospitalInfo?.email ? `Email: ${esc(hospitalInfo.email)}` : ""}
  </p>
</div>

<!-- Doctor & Patient Info -->
<div style="display:flex;justify-content:space-between;margin-bottom:14px;">
  <div>
    <p style="font-size:13px;font-weight:700;color:#1e3a5f;">Dr. ${esc(doctor.name || doctor.firstName ? (doctor.firstName + " " + (doctor.lastName || "")) : "")}</p>
    <p style="font-size:11px;color:#6b7280;">${esc(doctor.specialization || doctor.specialty || "")}</p>
    <p style="font-size:11px;color:#6b7280;">Consultation: ${esc(consultationNumber)}</p>
    <p style="font-size:11px;color:#6b7280;">Date: ${esc(formattedDate)}</p>
  </div>
  <div style="text-align:right;">
    <p style="font-size:13px;font-weight:700;color:#1e3a5f;">Patient: ${esc(patient.name || (patient.firstName ? patient.firstName + " " + (patient.lastName || "") : ""))}</p>
    <p style="font-size:11px;color:#6b7280;">Age/Gender: ${patientAge ? patientAge + " yrs" : "—"} / ${esc(patient.gender || "—")}</p>
    <p style="font-size:11px;color:#6b7280;">Patient ID: #${esc(String(patient.id || patient._id || ""))}</p>
  </div>
</div>

<!-- Rx Symbol -->
<div style="margin-bottom:10px;">
  <span style="font-size:28px;font-weight:900;color:#1e40af;font-family:serif;">&#8478;</span>
</div>

<!-- Prescription Table -->
${
  prescriptionItems.length > 0
    ? `
<table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
  <thead>
    <tr style="background:#f0f4ff;">
      <th style="padding:6px 8px;text-align:center;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;width:30px;">#</th>
      <th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Medication</th>
      <th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Dosage</th>
      <th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Frequency</th>
      <th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Duration</th>
      <th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Route</th>
      <th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Instructions</th>
    </tr>
  </thead>
  <tbody>${prescriptionRows}</tbody>
</table>`
    : '<p style="font-size:12px;color:#6b7280;margin-bottom:14px;">No medications prescribed.</p>'
}

<!-- Diagnosis -->
${
  diagnosis
    ? `
<div style="margin-bottom:12px;">
  <h3 style="font-size:13px;font-weight:700;color:#1e3a5f;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.5px;">Diagnosis</h3>
  <p style="font-size:12px;color:#374151;padding:6px 10px;background:#f9fafb;border-radius:6px;border-left:3px solid #1e40af;">${esc(diagnosis)}</p>
</div>`
    : ""
}

<!-- Lab Orders -->
${labOrdersHtml}

<!-- Follow-up & Instructions -->
${
  formattedFollowUp || specialInstructions
    ? `
<div style="margin-top:14px;padding:8px 10px;background:#f0f9ff;border-radius:6px;border:1px solid #bfdbfe;">
  ${formattedFollowUp ? `<p style="font-size:12px;color:#1e3a5f;margin-bottom:4px;"><strong>Follow-up:</strong> ${esc(formattedFollowUp)}</p>` : ""}
  ${specialInstructions ? `<p style="font-size:12px;color:#1e3a5f;"><strong>Special Instructions:</strong> ${esc(specialInstructions)}</p>` : ""}
</div>`
    : ""
}

<!-- Footer -->
<div style="margin-top:30px;border-top:1px solid #e5e7eb;padding-top:10px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <p style="margin-bottom:6px;">________________________</p>
      <p style="font-size:12px;font-weight:700;color:#1e3a5f;">Dr. ${esc(doctor.name || (doctor.firstName ? doctor.firstName + " " + (doctor.lastName || "") : ""))}</p>
      <p style="font-size:11px;color:#6b7280;">${esc(doctor.specialization || doctor.specialty || "")}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:10px;color:#9ca3af;font-style:italic;">This is a computer-generated prescription</p>
      <p style="font-size:10px;color:#9ca3af;">${esc(hospitalInfo?.name || "")} - ${esc(hospitalInfo?.address || "")}</p>
    </div>
  </div>
</div>

</body>
</html>`;

  openPrintWindow(html);
}

// --- Helpers ---

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function calculateAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function openPrintWindow(html) {
  const win = window.open("", "_blank", "width=600,height=800");
  if (!win) {
    alert("Please allow popups to print the prescription.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

/**
 * Generates and prints a full visit summary document.
 *
 * @param {Object} consultation - The consultation data
 * @param {Object} hospitalInfo - Hospital details (name, address, phone, email)
 */
export function printVisitSummary(consultation, hospitalInfo) {
  const {
    patient = {},
    doctor = {},
    prescriptionItems = [],
    diagnosis = "",
    followUpDate = "",
    specialInstructions = "",
    consultationNumber = "",
    consultationDate = "",
    vitals = {},
    labOrders = [],
    chiefComplaint = "",
    historyOfPresentIllness = "",
    pastMedicalHistory = "",
    allergies = "",
    clinicalNotes = "",
    examination = "",
    assessment = "",
    plan = "",
    aiSummary = "",
  } = consultation;

  const patientAge = calculateAge(patient.dateOfBirth || patient.dob);
  const formattedDate = formatDate(consultationDate);
  const formattedFollowUp = followUpDate ? formatDate(followUpDate) : "";

  // Build vitals table rows
  const vitalEntries = [];
  if (vitals.bloodPressure || vitals.bp)
    vitalEntries.push(["Blood Pressure", vitals.bloodPressure || vitals.bp, "mmHg"]);
  if (vitals.heartRate || vitals.pulse)
    vitalEntries.push(["Heart Rate", vitals.heartRate || vitals.pulse, "bpm"]);
  if (vitals.temperature || vitals.temp)
    vitalEntries.push(["Temperature", vitals.temperature || vitals.temp, "\u00B0C"]);
  if (vitals.respiratoryRate)
    vitalEntries.push(["Respiratory Rate", vitals.respiratoryRate, "/min"]);
  if (vitals.oxygenSaturation || vitals.spo2)
    vitalEntries.push(["SpO2", vitals.oxygenSaturation || vitals.spo2, "%"]);
  if (vitals.weight) vitalEntries.push(["Weight", vitals.weight, "kg"]);
  if (vitals.height) vitalEntries.push(["Height", vitals.height, "cm"]);
  if (vitals.bmi) vitalEntries.push(["BMI", vitals.bmi, ""]);

  const vitalsHtml =
    vitalEntries.length > 0
      ? `
    <div style="margin-bottom:16px;">
      <h3 style="${sectionHeadingStyle}">Vitals</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${vitalEntries
            .map(
              ([label, value, unit], i) => `
            <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"};">
              <td style="padding:5px 10px;font-size:12px;font-weight:600;color:#374151;width:40%;">${esc(label)}</td>
              <td style="padding:5px 10px;font-size:12px;color:#1f2937;">${esc(String(value))} ${esc(unit)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
      : "";

  // Prescription rows
  const prescriptionRows = prescriptionItems
    .map(
      (item, i) => `
      <tr>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:12px;">${i + 1}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:12px;">
          ${esc(item.drugName || item.medication || "")}
          ${item.genericName ? `<br><span style="font-weight:400;color:#6b7280;font-size:11px;">${esc(item.genericName)}</span>` : ""}
        </td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${esc(item.dosage || "")}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${esc(item.frequency || "")}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${esc(item.duration || "")}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${esc(item.route || "")}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">${esc(item.instructions || item.notes || "")}</td>
      </tr>`
    )
    .join("");

  const labOrdersHtml =
    labOrders && labOrders.length > 0
      ? `
    <div style="margin-bottom:16px;">
      <h3 style="${sectionHeadingStyle}">Lab Orders</h3>
      <ul style="margin:0;padding-left:20px;">
        ${labOrders.map((t) => `<li style="font-size:12px;color:#374151;margin-bottom:3px;">${esc(typeof t === "string" ? t : t.testName || t.name || "")}</li>`).join("")}
      </ul>
    </div>`
      : "";

  // Build clinical sections
  const clinicalSections = [
    ["Chief Complaint", chiefComplaint],
    ["History of Present Illness", historyOfPresentIllness],
    ["Past Medical History", pastMedicalHistory],
    ["Allergies", allergies],
    ["Examination", examination],
    ["Clinical Notes", clinicalNotes],
    ["Assessment", assessment],
    ["Plan", plan],
    ["Diagnosis", diagnosis],
  ]
    .filter(([, val]) => val)
    .map(
      ([title, val]) => `
    <div style="margin-bottom:12px;">
      <h3 style="${sectionHeadingStyle}">${esc(title)}</h3>
      <p style="font-size:12px;color:#374151;padding:6px 10px;background:#f9fafb;border-radius:6px;border-left:3px solid #1e40af;white-space:pre-wrap;">${esc(val)}</p>
    </div>`
    )
    .join("");

  // AI Summary - render simple markdown-like formatting
  const aiSummaryHtml = aiSummary
    ? `
    <div style="margin-bottom:16px;">
      <h3 style="${sectionHeadingStyle}">AI Clinical Summary</h3>
      <div style="font-size:12px;color:#374151;padding:8px 12px;background:#f0f4ff;border-radius:6px;border:1px solid #bfdbfe;white-space:pre-wrap;line-height:1.6;">${formatMarkdown(aiSummary)}</div>
    </div>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Visit Summary - ${esc(consultationNumber)}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm;
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
    div { break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Header -->
<div style="text-align:center;border-bottom:2px solid #1e40af;padding-bottom:10px;margin-bottom:14px;">
  <h1 style="font-size:22px;font-weight:800;color:#1e40af;margin-bottom:2px;letter-spacing:0.5px;">${esc(hospitalInfo?.name || "Hospital")}</h1>
  <p style="font-size:10px;color:#6b7280;">${esc(hospitalInfo?.address || "")}</p>
  <p style="font-size:10px;color:#6b7280;">
    ${hospitalInfo?.phone ? `Tel: ${esc(hospitalInfo.phone)}` : ""}
    ${hospitalInfo?.phone && hospitalInfo?.email ? " | " : ""}
    ${hospitalInfo?.email ? `Email: ${esc(hospitalInfo.email)}` : ""}
  </p>
  <p style="font-size:14px;font-weight:700;color:#1e40af;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">Visit Summary</p>
</div>

<!-- Doctor & Patient Info -->
<div style="display:flex;justify-content:space-between;margin-bottom:16px;padding:10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
  <div>
    <p style="font-size:13px;font-weight:700;color:#1e3a5f;">Dr. ${esc(doctor.name || (doctor.firstName ? doctor.firstName + " " + (doctor.lastName || "") : ""))}</p>
    <p style="font-size:11px;color:#6b7280;">${esc(doctor.specialization || doctor.specialty || "")}</p>
    <p style="font-size:11px;color:#6b7280;">Consultation: ${esc(consultationNumber)}</p>
    <p style="font-size:11px;color:#6b7280;">Date: ${esc(formattedDate)}</p>
  </div>
  <div style="text-align:right;">
    <p style="font-size:13px;font-weight:700;color:#1e3a5f;">Patient: ${esc(patient.name || (patient.firstName ? patient.firstName + " " + (patient.lastName || "") : ""))}</p>
    <p style="font-size:11px;color:#6b7280;">Age/Gender: ${patientAge ? patientAge + " yrs" : "\u2014"} / ${esc(patient.gender || "\u2014")}</p>
    <p style="font-size:11px;color:#6b7280;">Patient ID: #${esc(String(patient.id || patient._id || ""))}</p>
  </div>
</div>

<!-- Vitals -->
${vitalsHtml}

<!-- Clinical Sections -->
${clinicalSections}

<!-- AI Summary -->
${aiSummaryHtml}

<!-- Prescription -->
${
  prescriptionItems.length > 0
    ? `
<div style="margin-bottom:16px;">
  <h3 style="${sectionHeadingStyle}">
    <span style="font-size:20px;font-weight:900;color:#1e40af;font-family:serif;margin-right:8px;">&#8478;</span>
    Prescription
  </h3>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#f0f4ff;">
        <th style="padding:5px 8px;text-align:center;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;width:28px;">#</th>
        <th style="padding:5px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Medication</th>
        <th style="padding:5px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Dosage</th>
        <th style="padding:5px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Frequency</th>
        <th style="padding:5px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Duration</th>
        <th style="padding:5px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Route</th>
        <th style="padding:5px 8px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Instructions</th>
      </tr>
    </thead>
    <tbody>${prescriptionRows}</tbody>
  </table>
</div>`
    : ""
}

<!-- Lab Orders -->
${labOrdersHtml}

<!-- Follow-up & Instructions -->
${
  formattedFollowUp || specialInstructions
    ? `
<div style="margin-bottom:16px;padding:8px 12px;background:#f0f9ff;border-radius:6px;border:1px solid #bfdbfe;">
  ${formattedFollowUp ? `<p style="font-size:12px;color:#1e3a5f;margin-bottom:4px;"><strong>Follow-up Date:</strong> ${esc(formattedFollowUp)}</p>` : ""}
  ${specialInstructions ? `<p style="font-size:12px;color:#1e3a5f;"><strong>Special Instructions:</strong> ${esc(specialInstructions)}</p>` : ""}
</div>`
    : ""
}

<!-- Footer -->
<div style="margin-top:30px;border-top:1px solid #e5e7eb;padding-top:12px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <p style="margin-bottom:6px;">________________________</p>
      <p style="font-size:12px;font-weight:700;color:#1e3a5f;">Dr. ${esc(doctor.name || (doctor.firstName ? doctor.firstName + " " + (doctor.lastName || "") : ""))}</p>
      <p style="font-size:11px;color:#6b7280;">${esc(doctor.specialization || doctor.specialty || "")}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:10px;color:#9ca3af;font-style:italic;">This is a computer-generated visit summary</p>
      <p style="font-size:10px;color:#9ca3af;">${esc(hospitalInfo?.name || "")} - ${esc(hospitalInfo?.address || "")}</p>
    </div>
  </div>
</div>

</body>
</html>`;

  openPrintWindow(html);
}

// --- Constants ---

const sectionHeadingStyle =
  "font-size:13px;font-weight:700;color:#1e3a5f;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;";

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

/**
 * Simple markdown-to-HTML converter for AI summaries.
 * Handles: bold, italic, headers, lists, line breaks.
 */
function formatMarkdown(text) {
  if (!text) return "";
  let html = esc(text);
  // Headers: ### -> h4, ## -> h3
  html = html.replace(/^### (.+)$/gm, '<strong style="font-size:13px;display:block;margin-top:8px;">$1</strong>');
  html = html.replace(/^## (.+)$/gm, '<strong style="font-size:14px;display:block;margin-top:10px;">$1</strong>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Bullet lists
  html = html.replace(/^[-*] (.+)$/gm, '\u2022 $1');
  // Numbered lists (already fine as text)
  return html;
}

function openPrintWindow(html) {
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) {
    alert("Please allow popups to print the visit summary.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import SearchBar from "../components/ui/SearchBar";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import Pagination from "../components/ui/Pagination";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatCard from "../components/ui/StatCard";
import { useToast, Toast } from "../components/ui/Toast";

const ITEMS_PER_PAGE = 12;
const TEST_CATEGORIES = ["ALL", "LAB", "XRAY", "SCAN", "ECG", "ULTRASOUND", "MRI", "CT", "OTHER"];

// ── Currency Formatter ──────────────────────────────────────────────────────
const fmtRs = (v) =>
  `Rs. ${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── SVG Icon Components ─────────────────────────────────────────────────────
function RevenueIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function OutstandingIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function TodayIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function RefundIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}
function BillEmptyIcon() {
  return (
    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
function PrinterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function XFilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Print Receipt ───────────────────────────────────────────────────────────
async function printBill(bill) {
  let hospitalInfo = { name: "Hospital", address: "", phone: "", email: "" };
  try {
    const res = await API.get("/master/hospital-info");
    hospitalInfo = res.data;
  } catch {
    /* fallback */
  }

  const items = bill.items || [];
  const isTestOnly = bill.billType === "TEST_ONLY";
  const appt = bill.appointment;
  const doctor = appt?.schedule?.doctor?.name || null;
  const specialization = appt?.schedule?.doctor?.specialization || null;
  const apptDate = appt?.appointmentDate || null;
  const tokenNo = appt?.tokenNumber || null;

  const statusLabel = bill.refunded ? "REFUNDED" : bill.paymentStatus === "PARTIAL" ? "PARTIAL" : bill.paid ? "PAID" : "UNPAID";
  const stampColor = bill.refunded ? "#7c3aed" : bill.paid ? "#059669" : bill.paymentStatus === "PARTIAL" ? "#d97706" : "#d97706";

  const itemRows = items.map((item, idx) => `
    <tr>
      <td class="idx">${idx + 1}</td>
      <td class="desc">${item.itemName}</td>
      <td class="type">${(item.itemType || "").replace(/_/g, " ")}</td>
      <td class="qty">${item.quantity || 1}</td>
      <td class="amt">Rs. ${Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="amt">${Number(item.discount || 0) > 0 ? "-Rs. " + Number(item.discount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</td>
      <td class="amt">Rs. ${Number(item.total || item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>`).join("");

  const subTotal = Number(bill.subTotal || bill.totalAmount || 0);
  const discountAmt = Number(bill.discountAmount || 0);
  const discountPct = Number(bill.discountPercentage || 0);
  const netAmount = Number(bill.netAmount || subTotal - discountAmt);
  const taxAmt = Number(bill.taxAmount || 0);
  const taxPct = Number(bill.taxPercentage || 0);
  const totalAmount = Number(bill.totalAmount || 0);
  const paidAmount = Number(bill.paidAmount || 0);
  const dueAmount = Number(bill.dueAmount || 0);
  const insuranceCoverage = Number(bill.insuranceCoverage || 0);

  const doctorSection = !isTestOnly && doctor ? `
    <div class="section">
      <h3>Doctor Details</h3>
      <table class="info-table">
        <tr><td class="label">Doctor</td><td class="value">Dr. ${doctor}</td></tr>
        ${specialization ? `<tr><td class="label">Specialization</td><td class="value">${specialization}</td></tr>` : ""}
        ${apptDate ? `<tr><td class="label">Appointment Date</td><td class="value">${apptDate}</td></tr>` : ""}
        ${tokenNo ? `<tr><td class="label">Token Number</td><td class="value">${tokenNo}</td></tr>` : ""}
      </table>
    </div>` : "";

  const insuranceSection = bill.insuranceProvider ? `
    <div class="section">
      <h3>Insurance Information</h3>
      <table class="info-table">
        <tr><td class="label">Provider</td><td class="value">${bill.insuranceProvider}</td></tr>
        <tr><td class="label">Policy #</td><td class="value">${bill.insurancePolicyNumber || "-"}</td></tr>
        <tr><td class="label">Coverage</td><td class="value">Rs. ${insuranceCoverage.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
      </table>
    </div>` : "";

  const paymentSection = bill.paid || bill.paidAmount > 0 ? `
    <div class="section">
      <h3>Payment Information</h3>
      <table class="info-table">
        <tr><td class="label">Amount Paid</td><td class="value">Rs. ${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
        <tr><td class="label">Payment Method</td><td class="value">${bill.paymentMethod || "-"}</td></tr>
        <tr><td class="label">Paid On</td><td class="value">${bill.paidAt ? new Date(bill.paidAt).toLocaleString() : "-"}</td></tr>
        ${bill.paidBy ? `<tr><td class="label">Received By</td><td class="value">${bill.paidBy}</td></tr>` : ""}
      </table>
    </div>` : "";

  const balanceSection = dueAmount > 0 ? `
    <div class="balance-due">
      <strong>Balance Due: Rs. ${dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
    </div>` : "";

  const refundSection = bill.refunded ? `
    <div class="refund-section">
      <div class="refund-stamp">REFUNDED</div>
      <table class="info-table">
        <tr><td class="label">Refund Amount</td><td class="value">Rs. ${Number(bill.refundAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
        <tr><td class="label">Refund Method</td><td class="value">${bill.refundMethod || "-"}</td></tr>
        <tr><td class="label">Reason</td><td class="value">${bill.refundReason || "-"}</td></tr>
        <tr><td class="label">Refunded On</td><td class="value">${bill.refundedAt ? new Date(bill.refundedAt).toLocaleString() : "-"}</td></tr>
      </table>
    </div>` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Receipt - ${bill.billNumber || "Bill #" + bill.id}</title>
  <style>
    @page { size: A5; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; font-size: 11px; line-height: 1.5; position: relative; }
    .receipt { max-width: 148mm; margin: 0 auto; padding: 6mm; position: relative; }

    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 72px; font-weight: 900; opacity: 0.06; color: ${stampColor}; letter-spacing: 8px; pointer-events: none; z-index: 0; text-transform: uppercase; }

    .header { text-align: center; padding-bottom: 12px; border-bottom: 2px solid #1d4ed8; margin-bottom: 14px; position: relative; z-index: 1; }
    .logo-area { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 4px; }
    .logo-placeholder { width: 36px; height: 36px; border-radius: 50%; background: #1d4ed8; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
    .hospital-name { font-size: 20px; font-weight: 700; color: #1d4ed8; letter-spacing: -0.5px; }
    .hospital-sub { font-size: 9px; color: #6b7280; margin-top: 2px; }
    .receipt-title { font-size: 13px; font-weight: 600; color: #374151; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .receipt-meta { font-size: 9px; color: #6b7280; margin-top: 2px; }

    .section { margin-bottom: 12px; position: relative; z-index: 1; }
    .section h3 { font-size: 9px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid #e5e7eb; }
    .info-table { width: 100%; }
    .info-table td { padding: 2px 0; vertical-align: top; }
    .info-table .label { color: #6b7280; width: 120px; font-size: 10px; }
    .info-table .value { font-weight: 500; font-size: 10px; }

    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .items-table thead { background: #1d4ed8; color: white; }
    .items-table thead th { padding: 6px 6px; text-align: left; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .items-table thead th:first-child { width: 22px; text-align: center; }
    .items-table thead th.r { text-align: right; }
    .items-table tbody td { padding: 5px 6px; border-bottom: 1px solid #f3f4f6; font-size: 10px; }
    .items-table tbody td.idx { text-align: center; color: #9ca3af; }
    .items-table tbody td.type { color: #6b7280; font-size: 9px; }
    .items-table tbody td.qty { text-align: center; }
    .items-table tbody td.amt { text-align: right; font-weight: 500; }
    .items-table tbody tr:nth-child(even) { background: #f9fafb; }

    .calc-box { margin: 10px 0 14px; float: right; width: 220px; font-size: 10px; position: relative; z-index: 1; }
    .calc-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .calc-row.total { border-top: 2px solid #1d4ed8; font-weight: 700; font-size: 12px; color: #1d4ed8; padding-top: 6px; margin-top: 4px; }
    .calc-row.due { border-top: 2px double #374151; font-weight: 700; font-size: 12px; color: #dc2626; padding-top: 6px; margin-top: 4px; }
    .calc-sep { border-top: 1px solid #d1d5db; margin: 4px 0; }
    .clear { clear: both; }

    .balance-due { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; text-align: center; color: #dc2626; font-size: 11px; margin: 10px 0; }

    .refund-section { margin-top: 12px; padding: 8px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; position: relative; z-index: 1; }
    .refund-stamp { display: inline-block; background: #7c3aed; color: white; padding: 3px 12px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }

    .divider { border: none; border-top: 1px dashed #d1d5db; margin: 14px 0; }
    .footer { text-align: center; padding-top: 10px; border-top: 1px solid #e5e7eb; position: relative; z-index: 1; }
    .footer p { font-size: 9px; color: #9ca3af; margin: 1px 0; }
    .footer .thanks { font-size: 10px; font-weight: 600; color: #374151; margin-bottom: 4px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .receipt { padding: 0; }
    }
  </style></head><body>
  <div class="watermark">${statusLabel}</div>
  <div class="receipt">
    <div class="header">
      <div class="logo-area">
        <div class="logo-placeholder">H</div>
        <div class="hospital-name">${hospitalInfo.name || "Hospital"}</div>
      </div>
      ${hospitalInfo.address ? `<div class="hospital-sub">${hospitalInfo.address}</div>` : ""}
      ${hospitalInfo.phone || hospitalInfo.email ? `<div class="hospital-sub">${[hospitalInfo.phone, hospitalInfo.email].filter(Boolean).join(" | ")}</div>` : ""}
      <div class="receipt-title">${bill.refunded ? "Refund Receipt" : "Payment Receipt"}</div>
      <div class="receipt-meta">${bill.billNumber || "Bill #" + bill.id} | ${isTestOnly ? "Medical Tests" : "Appointment"} | Issued: ${new Date(bill.createdAt || Date.now()).toLocaleDateString()}</div>
      ${bill.createdBy ? `<div class="receipt-meta">Created by: ${bill.createdBy}</div>` : ""}
    </div>

    <div class="section">
      <h3>Patient Information</h3>
      <table class="info-table">
        <tr><td class="label">Patient Name</td><td class="value">${bill.patientName}</td></tr>
        <tr><td class="label">Patient ID</td><td class="value">#${bill.patientId || "-"}</td></tr>
      </table>
    </div>

    ${doctorSection}

    <div class="section">
      <h3>Itemized Charges</h3>
      <table class="items-table">
        <thead><tr><th>#</th><th>Description</th><th>Type</th><th>Qty</th><th class="r">Price</th><th class="r">Disc.</th><th class="r">Total</th></tr></thead>
        <tbody>${itemRows || '<tr><td colspan="7" style="padding:10px;text-align:center;color:#9ca3af">No items</td></tr>'}</tbody>
      </table>
    </div>

    <div class="calc-box">
      <div class="calc-row"><span>Sub Total:</span><span>Rs. ${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      ${discountAmt > 0 ? `<div class="calc-row"><span>Discount${discountPct > 0 ? " (" + discountPct + "%)" : ""}:</span><span>-Rs. ${discountAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
      <div class="calc-sep"></div>
      <div class="calc-row"><span>Net Amount:</span><span>Rs. ${netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      ${taxAmt > 0 ? `<div class="calc-row"><span>Tax${taxPct > 0 ? " (" + taxPct + "%)" : ""}:</span><span>Rs. ${taxAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
      <div class="calc-row total"><span>TOTAL:</span><span>Rs. ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      ${insuranceCoverage > 0 ? `<div class="calc-row"><span>Insurance:</span><span>-Rs. ${insuranceCoverage.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
      ${paidAmount > 0 ? `<div class="calc-row"><span>Paid:</span><span>-Rs. ${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
      ${dueAmount > 0 ? `<div class="calc-row due"><span>BALANCE DUE:</span><span>Rs. ${dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ""}
    </div>
    <div class="clear"></div>

    ${insuranceSection}
    ${paymentSection}
    ${balanceSection}
    ${refundSection}

    <hr class="divider" />

    <div class="footer">
      <p class="thanks">Thank you for choosing ${hospitalInfo.name || "our hospital"}</p>
      ${hospitalInfo.address ? `<p>${hospitalInfo.address}</p>` : ""}
      ${hospitalInfo.phone || hospitalInfo.email ? `<p>${[hospitalInfo.phone ? "Phone: " + hospitalInfo.phone : "", hospitalInfo.email ? "Email: " + hospitalInfo.email : ""].filter(Boolean).join(" | ")}</p>` : ""}
      <p style="margin-top:4px;">Printed on ${new Date().toLocaleString()}</p>
    </div>
  </div>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`;

  const win = window.open("", "_blank", "width=600,height=800");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ── Main Billing Component ─────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

function Billing() {
  const role = localStorage.getItem("role");
  const canManage = role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST";
  const canPay = role === "ADMIN" || role === "CASHIER";
  const isAdmin = role === "ADMIN";

  const { toasts, toast, remove } = useToast();

  // ── Core Data ─────────────────────────────────────────────────────────────
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem("billing_status_filter") || "ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // ── Bill Detail ───────────────────────────────────────────────────────────
  const [detailBill, setDetailBill] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Notes editing ─────────────────────────────────────────────────────────
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // ── Add Test modal (from detail) ──────────────────────────────────────────
  const [addTestOpen, setAddTestOpen] = useState(false);
  const [allTests, setAllTests] = useState([]);
  const [addTestSearch, setAddTestSearch] = useState("");
  const [addTestCategory, setAddTestCategory] = useState("ALL");
  const [addingTestId, setAddingTestId] = useState(null);

  // ── Remove item ───────────────────────────────────────────────────────────
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeItemId, setRemoveItemId] = useState(null);
  const [removingItem, setRemovingItem] = useState(false);

  // ── Discount modal ────────────────────────────────────────────────────────
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountType, setDiscountType] = useState("percentage"); // percentage | flat
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [discountReasons, setDiscountReasons] = useState([]);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // ── Insurance modal ───────────────────────────────────────────────────────
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [insProvider, setInsProvider] = useState("");
  const [insPolicyNumber, setInsPolicyNumber] = useState("");
  const [insCoverage, setInsCoverage] = useState("");
  const [applyingInsurance, setApplyingInsurance] = useState(false);

  // ── Payment modal ─────────────────────────────────────────────────────────
  const [payOpen, setPayOpen] = useState(false);
  const [payBill, setPayBill] = useState(null);
  const [payMode, setPayMode] = useState("full"); // full | partial
  const [payAmount, setPayAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paying, setPaying] = useState(false);

  // ── Refund modal ──────────────────────────────────────────────────────────
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundBill, setRefundBill] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("");
  const [refunding, setRefunding] = useState(false);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Create Appointment Bill ───────────────────────────────────────────────
  const [apptBillOpen, setApptBillOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [apptSearch, setApptSearch] = useState("");
  const [apptLoading, setApptLoading] = useState(false);
  const [creatingApptBill, setCreatingApptBill] = useState(false);

  // ── Create Test Bill wizard ───────────────────────────────────────────────
  const [testBillOpen, setTestBillOpen] = useState(false);
  const [tbStep, setTbStep] = useState(1);
  const [tbPatients, setTbPatients] = useState([]);
  const [tbAllTests, setTbAllTests] = useState([]);
  const [tbPatientSearch, setTbPatientSearch] = useState("");
  const [tbSelPatient, setTbSelPatient] = useState(null);
  const [tbSelTests, setTbSelTests] = useState([]);
  const [tbCreating, setTbCreating] = useState(false);
  const [tbTestCategory, setTbTestCategory] = useState("ALL");

  // ════════════════════════════════════════════════════════════════════════════
  // ── Data Loading ────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/bills");
      setBills(res.data);
    } catch {
      toast.error("Failed to load bills. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ════════════════════════════════════════════════════════════════════════════
  // ── Filtering ───────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  const changeStatusFilter = (val) => {
    setStatusFilter(val);
    localStorage.setItem("billing_status_filter", val);
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== "ALL" || typeFilter !== "ALL" || q || dateFrom || dateTo;

  const clearFilters = () => {
    changeStatusFilter("ALL");
    setTypeFilter("ALL");
    setQ("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const getBillStatus = (bill) => {
    if (bill.refunded) return "REFUNDED";
    if (bill.paymentStatus) return bill.paymentStatus;
    if (bill.paid) return "PAID";
    return "UNPAID";
  };

  const filtered = useMemo(() => {
    let list = bills;

    // Status filter
    if (statusFilter === "UNPAID") list = list.filter((b) => getBillStatus(b) === "UNPAID");
    else if (statusFilter === "PARTIAL") list = list.filter((b) => getBillStatus(b) === "PARTIAL");
    else if (statusFilter === "PAID") list = list.filter((b) => getBillStatus(b) === "PAID");
    else if (statusFilter === "REFUNDED") list = list.filter((b) => b.refunded);

    // Type filter
    if (typeFilter === "APPOINTMENT") list = list.filter((b) => (b.billType || "APPOINTMENT") === "APPOINTMENT");
    else if (typeFilter === "TEST_ONLY") list = list.filter((b) => b.billType === "TEST_ONLY");

    // Search
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter((b) =>
        [b.billNumber, String(b.id), b.patientName, String(b.patientId)].some(
          (v) => (v || "").toLowerCase().includes(s)
        )
      );
    }

    // Date range
    if (dateFrom) {
      list = list.filter((b) => {
        const d = (b.createdAt || "").slice(0, 10);
        return d >= dateFrom;
      });
    }
    if (dateTo) {
      list = list.filter((b) => {
        const d = (b.createdAt || "").slice(0, 10);
        return d <= dateTo;
      });
    }

    return list;
  }, [bills, statusFilter, typeFilter, q, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [totalPages, page]);

  // ════════════════════════════════════════════════════════════════════════════
  // ── Revenue Summary ─────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let totalRevenue = 0;
    let outstanding = 0;
    let billsToday = 0;
    let refundCount = 0;

    bills.forEach((b) => {
      const paid = Number(b.paidAmount || 0);
      const due = Number(b.dueAmount || 0);

      if (paid > 0 && !b.refunded) totalRevenue += paid;
      if (b.paid && !b.refunded && !b.paidAmount) totalRevenue += Number(b.totalAmount || 0);

      if (due > 0 && !b.refunded) outstanding += due;
      if (!b.paid && !b.refunded && !b.dueAmount) outstanding += Number(b.totalAmount || 0);

      const createdDate = (b.createdAt || "").slice(0, 10);
      if (createdDate === today) billsToday++;

      if (b.refunded) refundCount++;
    });

    return { totalRevenue, outstanding, billsToday, refundCount };
  }, [bills]);

  // ════════════════════════════════════════════════════════════════════════════
  // ── Bill Detail ─────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  const openDetail = async (bill) => {
    setDetailLoading(true);
    setDetailOpen(true);
    setEditingNotes(false);
    try {
      const res = await API.get(`/bills/${bill.id}`);
      setDetailBill(res.data);
      setNotesText(res.data.notes || "");
    } catch {
      toast.error("Failed to load bill details.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!detailBill) return;
    try {
      const res = await API.get(`/bills/${detailBill.id}`);
      setDetailBill(res.data);
      setNotesText(res.data.notes || "");
      load();
    } catch {
      toast.error("Failed to refresh bill details.");
    }
  };

  // ── Notes ─────────────────────────────────────────────────────────────────
  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await API.put(`/bills/${detailBill.id}/notes`, { notes: notesText });
      toast.success("Notes updated.");
      setEditingNotes(false);
      refreshDetail();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to update notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  // ── Add Test (from detail) ────────────────────────────────────────────────
  const openAddTest = async () => {
    setAddTestOpen(true);
    setAddTestSearch("");
    setAddTestCategory("ALL");
    try {
      const res = await API.get("/tests");
      setAllTests(res.data.filter((t) => t.active));
    } catch {
      toast.error("Failed to load tests.");
    }
  };

  const addTestToBill = async (testId) => {
    setAddingTestId(testId);
    try {
      await API.post(`/bills/${detailBill.id}/add-test/${testId}`);
      toast.success("Test added to the bill.");
      refreshDetail();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to add test.");
    } finally {
      setAddingTestId(null);
    }
  };

  const addTestGrouped = useMemo(() => {
    const groups = {};
    let list = allTests;
    const s = addTestSearch.trim().toLowerCase();
    if (s) list = list.filter((t) => t.name.toLowerCase().includes(s));
    if (addTestCategory !== "ALL") list = list.filter((t) => t.type === addTestCategory);
    list.forEach((t) => {
      if (!groups[t.type]) groups[t.type] = [];
      groups[t.type].push(t);
    });
    return groups;
  }, [allTests, addTestSearch, addTestCategory]);

  const addTestAvailableCategories = useMemo(() => {
    const cats = new Set(allTests.map((t) => t.type));
    return ["ALL", ...TEST_CATEGORIES.filter((c) => c !== "ALL" && cats.has(c))];
  }, [allTests]);

  // ── Remove Item ───────────────────────────────────────────────────────────
  const confirmRemoveItem = (itemId) => {
    setRemoveItemId(itemId);
    setRemoveConfirmOpen(true);
  };

  const removeItem = async () => {
    setRemovingItem(true);
    try {
      await API.delete(`/bills/${detailBill.id}/items/${removeItemId}`);
      setRemoveConfirmOpen(false);
      setRemoveItemId(null);
      toast.success("Item removed from the bill.");
      refreshDetail();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to remove item.");
    } finally {
      setRemovingItem(false);
    }
  };

  // ── Discount ──────────────────────────────────────────────────────────────
  const openDiscount = async () => {
    setDiscountOpen(true);
    setDiscountType("percentage");
    setDiscountValue("");
    setDiscountReason("");
    try {
      const res = await API.get("/master/discount-reasons");
      setDiscountReasons(res.data || []);
    } catch {
      setDiscountReasons([]);
    }
  };

  const discountPreview = useMemo(() => {
    if (!detailBill || !discountValue) return null;
    const sub = Number(detailBill.subTotal || detailBill.totalAmount || 0);
    const val = Number(discountValue) || 0;
    if (discountType === "percentage") {
      const amt = sub * (val / 100);
      return { amount: amt, newTotal: Math.max(0, sub - amt) };
    }
    return { amount: val, newTotal: Math.max(0, sub - val) };
  }, [detailBill, discountValue, discountType]);

  const applyDiscount = async () => {
    setApplyingDiscount(true);
    try {
      const body = { reason: discountReason };
      if (discountType === "percentage") {
        body.percentage = Number(discountValue);
      } else {
        body.amount = Number(discountValue);
      }
      await API.post(`/bills/${detailBill.id}/discount`, body);
      setDiscountOpen(false);
      toast.success("Discount applied successfully.");
      refreshDetail();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to apply discount.");
    } finally {
      setApplyingDiscount(false);
    }
  };

  // ── Insurance ─────────────────────────────────────────────────────────────
  const openInsurance = () => {
    setInsuranceOpen(true);
    setInsProvider(detailBill?.insuranceProvider || "");
    setInsPolicyNumber(detailBill?.insurancePolicyNumber || "");
    setInsCoverage(detailBill?.insuranceCoverage || "");
  };

  const applyInsurance = async () => {
    setApplyingInsurance(true);
    try {
      await API.post(`/bills/${detailBill.id}/insurance`, {
        provider: insProvider,
        policyNumber: insPolicyNumber,
        coverage: Number(insCoverage),
      });
      setInsuranceOpen(false);
      toast.success("Insurance applied successfully.");
      refreshDetail();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to apply insurance.");
    } finally {
      setApplyingInsurance(false);
    }
  };

  // ── Payment ───────────────────────────────────────────────────────────────
  const openPay = async (bill) => {
    const b = bill.id ? bill : detailBill;
    if (!b) return;
    setPayBill(b);
    const due = Number(b.dueAmount || b.totalAmount || 0);
    setPayAmount(String(due));
    setPayMode("full");
    setPaymentMethod("");
    setPayOpen(true);
    try {
      const res = await API.get("/master/payment-methods");
      setPaymentMethods(res.data || []);
      if (res.data?.length > 0) setPaymentMethod(res.data[0]);
    } catch {
      setPaymentMethods(["CASH", "CARD", "ONLINE"]);
      setPaymentMethod("CASH");
    }
  };

  const pay = async () => {
    if (!payBill) return;
    setPaying(true);
    try {
      const due = Number(payBill.dueAmount || payBill.totalAmount || 0);
      const amount = Number(payAmount) || 0;

      if (payMode === "full" || amount >= due) {
        await API.post(`/bills/${payBill.id}/payment`, { paymentMethod, amount: due });
      } else {
        await API.post(`/bills/${payBill.id}/payment`, { paymentMethod, amount });
      }
      setPayOpen(false);
      toast.success(`Payment of ${fmtRs(payMode === "full" ? due : amount)} processed for ${payBill.billNumber || "Bill #" + payBill.id}.`, "Payment Successful");
      if (detailOpen) refreshDetail();
      else load();
    } catch (e) {
      toast.error(e?.response?.data || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // ── Refund ────────────────────────────────────────────────────────────────
  const openRefund = async (bill) => {
    setRefundBill(bill);
    setRefundReason("");
    setRefundMethod("");
    setRefundOpen(true);
    try {
      const res = await API.get("/master/payment-methods");
      setPaymentMethods(res.data || []);
      if (res.data?.length > 0) setRefundMethod(res.data[0]);
    } catch {
      setPaymentMethods(["CASH", "CARD", "BANK_TRANSFER"]);
      setRefundMethod("CASH");
    }
  };

  const processRefund = async () => {
    if (!refundBill) return;
    setRefunding(true);
    try {
      await API.post(`/bills/${refundBill.id}/refund`, {
        reason: refundReason,
        refundMethod,
      });
      setRefundOpen(false);
      setDetailOpen(false);
      toast.success(`Refund processed for ${refundBill.billNumber || "Bill #" + refundBill.id}.`, "Refund Successful");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Refund failed. Please try again.");
    } finally {
      setRefunding(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = (billId) => {
    setDeleteBillId(billId);
    setDeleteConfirmOpen(true);
  };

  const deleteBill = async () => {
    setDeleting(true);
    try {
      await API.delete(`/bills/${deleteBillId}`);
      setDeleteConfirmOpen(false);
      setDetailOpen(false);
      toast.success("Bill deleted successfully.");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to delete bill.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = async (bill) => {
    try {
      const res = await API.get(`/bills/${bill.id}`);
      await printBill(res.data);
    } catch {
      toast.error("Failed to load bill for printing.");
    }
  };

  // ── Create Appointment Bill ───────────────────────────────────────────────
  const openApptBill = async () => {
    setApptBillOpen(true);
    setApptSearch("");
    setApptLoading(true);
    try {
      const res = await API.get("/appointments");
      // Filter: only show appointments without bills, not cancelled/rescheduled
      const existing = new Set(bills.filter((b) => b.appointment?.id).map((b) => b.appointment.id));
      const eligible = (res.data || []).filter(
        (a) => !existing.has(a.id) && a.status !== "CANCELLED" && a.status !== "RESCHEDULED"
      );
      setAppointments(eligible);
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setApptLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    const s = apptSearch.trim().toLowerCase();
    if (!s) return appointments;
    return appointments.filter((a) =>
      [a.patient?.name, a.schedule?.doctor?.name, a.appointmentDate, String(a.id), String(a.tokenNumber)].some(
        (v) => (v || "").toLowerCase().includes(s)
      )
    );
  }, [appointments, apptSearch]);

  const createApptBill = async (appointmentId) => {
    setCreatingApptBill(true);
    try {
      await API.post(`/bills/appointment/${appointmentId}`);
      setApptBillOpen(false);
      toast.success("Appointment bill created successfully.", "Bill Created");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to create appointment bill.");
    } finally {
      setCreatingApptBill(false);
    }
  };

  // ── Create Test Bill Wizard ───────────────────────────────────────────────
  const openTestBill = async () => {
    setTbStep(1);
    setTbSelPatient(null);
    setTbSelTests([]);
    setTbPatientSearch("");
    setTbCreating(false);
    setTbTestCategory("ALL");
    setTestBillOpen(true);
    try {
      const [pRes, tRes] = await Promise.all([API.get("/patients"), API.get("/tests")]);
      setTbPatients(pRes.data);
      setTbAllTests(tRes.data.filter((t) => t.active));
    } catch {
      toast.error("Failed to load patients/tests.");
    }
  };

  const tbToggleTest = (t) => {
    setTbSelTests((prev) => (prev.find((x) => x.id === t.id) ? prev.filter((x) => x.id !== t.id) : [...prev, t]));
  };

  const tbTotal = useMemo(() => tbSelTests.reduce((s, t) => s + Number(t.price), 0), [tbSelTests]);

  const tbCreateBill = async () => {
    if (!tbSelPatient || tbSelTests.length === 0) return;
    setTbCreating(true);
    try {
      await API.post(`/bills/patient/${tbSelPatient.id}/tests`, {
        testIds: tbSelTests.map((t) => t.id),
      });
      setTestBillOpen(false);
      toast.success(`Test bill created for ${tbSelPatient.name}.`, "Bill Created");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to create test bill.");
    } finally {
      setTbCreating(false);
    }
  };

  const tbFilteredPatients = useMemo(() => {
    const s = tbPatientSearch.trim().toLowerCase();
    if (!s) return tbPatients;
    return tbPatients.filter((p) => [p.name, String(p.id), p.phone || ""].some((v) => v.toLowerCase().includes(s)));
  }, [tbPatients, tbPatientSearch]);

  const tbGrouped = useMemo(() => {
    const groups = {};
    tbAllTests.forEach((t) => {
      if (!groups[t.type]) groups[t.type] = [];
      groups[t.type].push(t);
    });
    return groups;
  }, [tbAllTests]);

  const tbFilteredGrouped = useMemo(() => {
    if (tbTestCategory === "ALL") return tbGrouped;
    const filtered = {};
    if (tbGrouped[tbTestCategory]) {
      filtered[tbTestCategory] = tbGrouped[tbTestCategory];
    }
    return filtered;
  }, [tbGrouped, tbTestCategory]);

  const tbFilteredTests = useMemo(() => {
    if (tbTestCategory === "ALL") return tbAllTests;
    return tbAllTests.filter((t) => t.type === tbTestCategory);
  }, [tbAllTests, tbTestCategory]);

  // ── Row Helpers ───────────────────────────────────────────────────────────
  const getRowBorder = (bill) => {
    const st = getBillStatus(bill);
    if (st === "UNPAID") return "border-l-4 border-l-amber-300";
    if (st === "PARTIAL") return "border-l-4 border-l-yellow-300";
    if (st === "PAID") return "border-l-4 border-l-emerald-300";
    if (st === "REFUNDED") return "border-l-4 border-l-purple-300";
    return "";
  };

  const getRowBg = (bill) => {
    const st = getBillStatus(bill);
    if (st === "UNPAID") return "bg-amber-50/30";
    if (st === "PARTIAL") return "bg-yellow-50/30";
    if (st === "REFUNDED") return "bg-purple-50/30";
    return "";
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ── RENDER ──────────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
            <p className="text-gray-500 mt-1 text-sm">Manage bills, payments, discounts, insurance, and refunds.</p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button onClick={openApptBill}>
                <span className="flex items-center gap-2">
                  <PlusIcon />
                  New Appointment Bill
                </span>
              </Button>
              <Button variant="secondary" onClick={openTestBill}>
                <span className="flex items-center gap-2">
                  <PlusIcon />
                  New Test Bill
                </span>
              </Button>
            </div>
          )}
        </div>

        {/* ── Revenue Summary ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<RevenueIcon />}
            label="Total Revenue"
            value={fmtRs(summary.totalRevenue)}
            color="emerald"
            subtitle="Sum of paid amounts"
          />
          <StatCard
            icon={<OutstandingIcon />}
            label="Outstanding Balance"
            value={fmtRs(summary.outstanding)}
            color="amber"
            subtitle="Pending payments"
          />
          <StatCard
            icon={<TodayIcon />}
            label="Bills Today"
            value={summary.billsToday}
            color="blue"
            subtitle="Created today"
          />
          <StatCard
            icon={<RefundIcon />}
            label="Refunds"
            value={summary.refundCount}
            color="rose"
            subtitle="Refunded bills"
          />
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <SearchBar
            value={q}
            onChange={(val) => { setQ(val); setPage(1); }}
            placeholder="Search bill #, patient name, ID..."
            className="w-72"
          />
          <Select
            value={statusFilter}
            onChange={(e) => changeStatusFilter(e.target.value)}
            className="!w-auto min-w-[130px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="!w-auto min-w-[140px]"
          >
            <option value="ALL">All Types</option>
            <option value="APPOINTMENT">Appointment</option>
            <option value="TEST_ONLY">Test Only</option>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="!w-auto"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="!w-auto"
            placeholder="To"
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XFilterIcon />
              Clear Filters
            </button>
          )}
        </div>

        {/* ── Bills Table ─────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingSpinner message="Loading bills..." />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BillEmptyIcon />}
              title="No bills found"
              message={hasActiveFilters ? "Try adjusting your search or filters." : "No billing records yet."}
            />
          </Card>
        ) : (
          <Card noPadding subtitle={`${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill #</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Sub Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Discount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Tax</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Paid / Due</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((b) => {
                    const st = getBillStatus(b);
                    const discount = Number(b.discountAmount || 0);
                    const discPct = Number(b.discountPercentage || 0);
                    const tax = Number(b.taxAmount || 0);
                    const due = Number(b.dueAmount || 0);
                    const paid = Number(b.paidAmount || 0);
                    return (
                      <tr key={b.id} className={`hover:bg-gray-50/80 transition-colors ${getRowBorder(b)} ${getRowBg(b)}`}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDetail(b)}
                            className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                          >
                            {b.billNumber || `#${b.id}`}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {b.billType === "TEST_ONLY" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                              TEST
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              APPT
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[150px] truncate">{b.patientName}</td>
                        <td className="px-4 py-3 text-right text-gray-600 text-xs">
                          {fmtRs(b.subTotal || b.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {discount > 0 ? (
                            <span className="text-orange-600">
                              -{fmtRs(discount)}
                              {discPct > 0 && <span className="text-orange-400 ml-0.5">({discPct}%)</span>}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {tax > 0 ? (
                            <span className="text-gray-600">{fmtRs(tax)}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {fmtRs(b.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          <div>
                            {paid > 0 && <span className="text-emerald-600">{fmtRs(paid)}</span>}
                            {due > 0 && (
                              <span className="text-red-500 block">{fmtRs(due)} due</span>
                            )}
                            {paid === 0 && due === 0 && !b.paid && (
                              <span className="text-gray-400">{fmtRs(b.totalAmount)} due</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={st} size="xs" />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => openDetail(b)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                              <EyeIcon />
                            </button>
                            {(st === "UNPAID" || st === "PARTIAL") && canPay && (
                              <button onClick={() => openPay(b)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Pay">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </button>
                            )}
                            <button onClick={() => handlePrint(b)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
                              <PrinterIcon />
                            </button>
                            {st === "PAID" && canPay && (
                              <button onClick={() => openRefund(b)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Refund">
                                <RefundIcon />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setPage}
              />
            </div>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── BILL DETAIL MODAL ──────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={detailBill ? (detailBill.billNumber || `Bill #${detailBill.id}`) : "Bill Details"}
          size="xl"
          footer={
            detailBill && !detailLoading ? (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-lg font-bold text-gray-900">
                  Total: {fmtRs(detailBill.totalAmount)}
                  {Number(detailBill.dueAmount || 0) > 0 && (
                    <span className="text-sm font-medium text-red-500 ml-3">
                      Due: {fmtRs(detailBill.dueAmount)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Add Test */}
                  {getBillStatus(detailBill) === "UNPAID" && canManage && (
                    <Button variant="secondary" onClick={openAddTest}>
                      <span className="flex items-center gap-1"><PlusIcon /> Add Test</span>
                    </Button>
                  )}
                  {/* Discount */}
                  {!detailBill.paid && !detailBill.refunded && canPay && (
                    <Button variant="secondary" onClick={openDiscount}>
                      Apply Discount
                    </Button>
                  )}
                  {/* Insurance */}
                  {!detailBill.paid && !detailBill.refunded && canPay && (
                    <Button variant="secondary" onClick={openInsurance}>
                      Apply Insurance
                    </Button>
                  )}
                  {/* Pay */}
                  {(getBillStatus(detailBill) === "UNPAID" || getBillStatus(detailBill) === "PARTIAL") && canPay && (
                    <Button variant="success" onClick={() => openPay(detailBill)}>
                      Make Payment
                    </Button>
                  )}
                  {/* Print */}
                  <Button variant="secondary" onClick={() => printBill(detailBill)}>
                    <span className="flex items-center gap-1"><PrinterIcon /> Print Receipt</span>
                  </Button>
                  {/* Refund */}
                  {detailBill.paid && !detailBill.refunded && canPay && (
                    <Button variant="danger" onClick={() => openRefund(detailBill)}>
                      Process Refund
                    </Button>
                  )}
                  {/* Delete */}
                  {isAdmin && !detailBill.paid && !detailBill.refunded && (
                    <Button variant="danger" onClick={() => confirmDelete(detailBill.id)}>
                      <span className="flex items-center gap-1"><TrashIcon /> Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : null
          }
        >
          {detailLoading ? (
            <LoadingSpinner message="Loading bill details..." size="md" />
          ) : detailBill ? (
            <div className="space-y-6">
              {/* ── Header Section ──────────────────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{detailBill.billNumber || `Bill #${detailBill.id}`}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Created: {detailBill.createdAt ? new Date(detailBill.createdAt).toLocaleString() : "-"}
                    {detailBill.createdBy && <span className="ml-2">by {detailBill.createdBy}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={getBillStatus(detailBill)} size="md" />
                  {detailBill.billType === "TEST_ONLY" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                      Medical Tests
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      Appointment
                    </span>
                  )}
                </div>
              </div>

              {/* ── Patient Section ─────────────────────────────────────────── */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Patient</p>
                    <p className="text-sm font-semibold text-gray-900">{detailBill.patientName}</p>
                    {detailBill.patientId && <p className="text-xs text-gray-500">Patient ID: #{detailBill.patientId}</p>}
                  </div>
                  {/* ── Doctor Section (if appointment) ─────────────────────── */}
                  {detailBill.appointment && detailBill.billType !== "TEST_ONLY" && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Doctor / Appointment</p>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {detailBill.appointment?.schedule?.doctor?.name || "-"}
                      </p>
                      {detailBill.appointment?.schedule?.doctor?.specialization && (
                        <p className="text-xs text-gray-500">{detailBill.appointment.schedule.doctor.specialization}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {detailBill.appointment?.appointmentDate || "-"}
                        {detailBill.appointment?.tokenNumber && (
                          <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            Token #{detailBill.appointment.tokenNumber}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Payment/Refund Banners ──────────────────────────────────── */}
              {detailBill.paid && !detailBill.refunded && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Paid via {detailBill.paymentMethod || "-"}
                    </p>
                    <p className="text-xs text-emerald-600">
                      {detailBill.paidAt ? new Date(detailBill.paidAt).toLocaleString() : "-"}
                      {detailBill.paidBy && <span className="ml-2">by {detailBill.paidBy}</span>}
                    </p>
                  </div>
                </div>
              )}

              {getBillStatus(detailBill) === "PARTIAL" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Partially Paid</p>
                    <p className="text-xs text-yellow-600">
                      {fmtRs(detailBill.paidAmount)} paid, {fmtRs(detailBill.dueAmount)} remaining
                    </p>
                  </div>
                </div>
              )}

              {detailBill.refunded && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <RefundIcon />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-800">Refunded</p>
                      <p className="text-xs text-purple-600">
                        {fmtRs(detailBill.refundAmount)} via {detailBill.refundMethod}
                        {detailBill.refundedAt && ` on ${new Date(detailBill.refundedAt).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  {detailBill.refundReason && (
                    <p className="text-xs text-purple-700 mt-2 pl-11">Reason: {detailBill.refundReason}</p>
                  )}
                </div>
              )}

              {/* ── Items Table ─────────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill Items</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">#</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Item</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Type</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Qty</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Unit Price</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Discount</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Total</th>
                        {!detailBill.paid && !detailBill.refunded && <th className="px-4 py-2.5 w-12"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detailBill.items || []).map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{item.itemName}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {(item.itemType || "").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{item.quantity || 1}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            {fmtRs(item.price)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            {Number(item.discount || 0) > 0 ? (
                              <span className="text-orange-600">-{fmtRs(item.discount)}</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">
                            {fmtRs(item.total || item.price)}
                          </td>
                          {!detailBill.paid && !detailBill.refunded && (
                            <td className="px-4 py-2.5 text-right">
                              {item.itemType !== "DOCTOR_FEE" && item.itemType !== "HOSPITAL_FEE" && (
                                <button
                                  onClick={() => confirmRemoveItem(item.id)}
                                  className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                                  title="Remove item"
                                >
                                  <TrashIcon />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      {(!detailBill.items || detailBill.items.length === 0) && (
                        <tr>
                          <td colSpan={detailBill.paid ? 7 : 8} className="px-4 py-8 text-center text-gray-400 text-sm">
                            No items in this bill.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Calculation Summary ─────────────────────────────────────── */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sub Total:</span>
                    <span className="font-medium">{fmtRs(detailBill.subTotal || detailBill.totalAmount)}</span>
                  </div>
                  {Number(detailBill.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>
                        Discount{Number(detailBill.discountPercentage || 0) > 0 ? ` (${detailBill.discountPercentage}%)` : ""}:
                      </span>
                      <span>-{fmtRs(detailBill.discountAmount)}</span>
                    </div>
                  )}
                  {Number(detailBill.discountAmount || 0) > 0 && detailBill.discountReason && (
                    <p className="text-xs text-gray-400 italic pl-1">{detailBill.discountReason}</p>
                  )}
                  <div className="border-t border-gray-300 pt-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Net Amount:</span>
                      <span className="font-medium">{fmtRs(detailBill.netAmount || (Number(detailBill.subTotal || detailBill.totalAmount) - Number(detailBill.discountAmount || 0)))}</span>
                    </div>
                  </div>
                  {Number(detailBill.taxAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Tax{Number(detailBill.taxPercentage || 0) > 0 ? ` (${detailBill.taxPercentage}%)` : ""}:
                      </span>
                      <span className="font-medium">{fmtRs(detailBill.taxAmount)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray-400 pt-2">
                    <div className="flex justify-between font-bold text-base">
                      <span>TOTAL:</span>
                      <span>{fmtRs(detailBill.totalAmount)}</span>
                    </div>
                  </div>
                  {Number(detailBill.insuranceCoverage || 0) > 0 && (
                    <div className="flex justify-between text-teal-600">
                      <span>Insurance:</span>
                      <span>-{fmtRs(detailBill.insuranceCoverage)}</span>
                    </div>
                  )}
                  {Number(detailBill.paidAmount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Paid:</span>
                      <span>-{fmtRs(detailBill.paidAmount)}</span>
                    </div>
                  )}
                  {(Number(detailBill.dueAmount || 0) > 0 || (!detailBill.paid && !detailBill.refunded)) && (
                    <div className="border-t-2 border-double border-gray-500 pt-2">
                      <div className="flex justify-between font-bold text-base text-red-600">
                        <span>BALANCE DUE:</span>
                        <span>{fmtRs(detailBill.dueAmount || detailBill.totalAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Insurance Section ──────────────────────────────────────── */}
              {detailBill.insuranceProvider && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">Insurance Information</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Provider</p>
                      <p className="font-medium text-gray-900">{detailBill.insuranceProvider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Policy #</p>
                      <p className="font-medium text-gray-900">{detailBill.insurancePolicyNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Coverage</p>
                      <p className="font-medium text-teal-700">{fmtRs(detailBill.insuranceCoverage)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Notes Section ──────────────────────────────────────────── */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</p>
                  {!editingNotes ? (
                    <button
                      onClick={() => { setEditingNotes(true); setNotesText(detailBill.notes || ""); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveNotes}
                        disabled={savingNotes}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                      >
                        {savingNotes ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
                    placeholder="Add notes about this bill..."
                  />
                ) : (
                  <p className="text-sm text-gray-600">{detailBill.notes || "No notes."}</p>
                )}
              </div>

              {/* ── Payment History ─────────────────────────────────────────── */}
              {(detailBill.paid || Number(detailBill.paidAmount || 0) > 0) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment History</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="font-medium text-gray-900">
                          {fmtRs(detailBill.paidAmount || detailBill.totalAmount)} paid
                        </span>
                        <span className="text-gray-400">via</span>
                        <span className="text-gray-700">{detailBill.paymentMethod || "-"}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {detailBill.paidAt ? new Date(detailBill.paidAt).toLocaleString() : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── ADD TEST MODAL (from detail) ───────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          open={addTestOpen}
          onClose={() => setAddTestOpen(false)}
          title="Add Medical Test"
          size="lg"
        >
          <div className="space-y-4">
            <SearchBar
              value={addTestSearch}
              onChange={setAddTestSearch}
              placeholder="Search tests..."
            />
            <div className="flex flex-wrap gap-1.5">
              {addTestAvailableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAddTestCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    addTestCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat === "ALL" ? "All" : cat}
                </button>
              ))}
            </div>
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {Object.entries(addTestGrouped).map(([type, tests]) => (
                <div key={type}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 sticky top-0 bg-white py-1">
                    {type}
                  </p>
                  <div className="space-y-1">
                    {tests.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-700">{t.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{t.type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-600">{fmtRs(t.price)}</span>
                          <Button
                            variant="primary"
                            onClick={() => addTestToBill(t.id)}
                            disabled={addingTestId === t.id}
                            className="!px-3 !py-1.5 !text-xs"
                          >
                            {addingTestId === t.id ? "Adding..." : "Add"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(addTestGrouped).length === 0 && (
                <EmptyState title="No tests found" message="Try a different search or category." />
              )}
            </div>
          </div>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── APPLY DISCOUNT MODAL ───────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          open={discountOpen}
          onClose={() => setDiscountOpen(false)}
          title="Apply Discount"
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDiscountOpen(false)}>Cancel</Button>
              <Button
                onClick={applyDiscount}
                disabled={applyingDiscount || !discountValue || !discountReason}
              >
                {applyingDiscount ? "Applying..." : "Apply Discount"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Toggle */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Discount Type</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => { setDiscountType("percentage"); setDiscountValue(""); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    discountType === "percentage" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => { setDiscountType("flat"); setDiscountValue(""); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    discountType === "flat" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Flat Amount
                </button>
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                {discountType === "percentage" ? "Percentage" : "Amount (Rs.)"}
              </label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 500"}
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Reason <span className="text-red-500">*</span>
              </label>
              <Select value={discountReason} onChange={(e) => setDiscountReason(e.target.value)}>
                <option value="">Select reason...</option>
                {discountReasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="__custom">Custom reason...</option>
              </Select>
              {discountReason === "__custom" && (
                <Input
                  className="mt-2"
                  value=""
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Enter custom reason..."
                />
              )}
            </div>

            {/* Preview */}
            {discountPreview && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Preview</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount Amount:</span>
                  <span className="font-semibold text-orange-600">-{fmtRs(discountPreview.amount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">New Total:</span>
                  <span className="font-bold text-gray-900">{fmtRs(discountPreview.newTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── APPLY INSURANCE MODAL ──────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          open={insuranceOpen}
          onClose={() => setInsuranceOpen(false)}
          title="Apply Insurance"
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setInsuranceOpen(false)}>Cancel</Button>
              <Button
                onClick={applyInsurance}
                disabled={applyingInsurance || !insProvider || !insCoverage}
              >
                {applyingInsurance ? "Applying..." : "Apply Insurance"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Insurance Provider <span className="text-red-500">*</span>
              </label>
              <Input
                value={insProvider}
                onChange={(e) => setInsProvider(e.target.value)}
                placeholder="e.g. ABC Insurance"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Policy Number</label>
              <Input
                value={insPolicyNumber}
                onChange={(e) => setInsPolicyNumber(e.target.value)}
                placeholder="e.g. POL-12345"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Coverage Amount (Rs.) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={insCoverage}
                onChange={(e) => setInsCoverage(e.target.value)}
                placeholder="e.g. 5000"
                min="0"
              />
            </div>
          </div>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── MAKE PAYMENT MODAL ─────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          open={payOpen}
          onClose={() => setPayOpen(false)}
          title={`Pay ${payBill?.billNumber || (payBill ? "Bill #" + payBill.id : "")}`}
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
              <Button variant="success" onClick={pay} disabled={paying || !paymentMethod}>
                {paying ? "Processing..." : `Confirm Payment - ${fmtRs(payMode === "full" ? (payBill?.dueAmount || payBill?.totalAmount) : payAmount)}`}
              </Button>
            </div>
          }
        >
          {payBill && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Patient</p>
                    <p className="font-semibold text-gray-900">{payBill.patientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">Total Due</p>
                    <p className="text-xl font-bold text-blue-600">
                      {fmtRs(payBill.dueAmount || payBill.totalAmount)}
                    </p>
                  </div>
                </div>
                {Number(payBill.insuranceCoverage || 0) > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-xs">
                    <span className="text-teal-600">Insurance Coverage</span>
                    <span className="font-medium text-teal-700">{fmtRs(payBill.insuranceCoverage)}</span>
                  </div>
                )}
              </div>

              {/* Full / Partial toggle */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Payment Type</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => { setPayMode("full"); setPayAmount(String(Number(payBill.dueAmount || payBill.totalAmount))); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      payMode === "full" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Pay Full
                  </button>
                  <button
                    onClick={() => { setPayMode("partial"); setPayAmount(""); }}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      payMode === "partial" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Pay Partial
                  </button>
                </div>
              </div>

              {/* Amount */}
              {payMode === "partial" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Payment Amount (Rs.)</label>
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter amount..."
                    min="0"
                    max={Number(payBill.dueAmount || payBill.totalAmount)}
                  />
                </div>
              )}

              {/* Method */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Payment Method</label>
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {paymentMethods.length === 0 && <option value="">Select method...</option>}
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── REFUND MODAL ───────────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          open={refundOpen}
          onClose={() => setRefundOpen(false)}
          title={`Refund ${refundBill?.billNumber || (refundBill ? "Bill #" + refundBill.id : "")}`}
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRefundOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={processRefund} disabled={refunding || !refundReason.trim() || !refundMethod}>
                {refunding ? "Processing..." : "Confirm Refund"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">This action cannot be undone</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  The full bill amount will be refunded. This may also update the linked appointment status.
                </p>
              </div>
            </div>

            {/* Amount */}
            {refundBill && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <p className="text-xs text-purple-600 font-medium">Refund Amount</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {fmtRs(refundBill.paidAmount || refundBill.totalAmount)}
                </p>
                <p className="text-xs text-purple-500 mt-1">for {refundBill.patientName}</p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Refund Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter the reason for this refund..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Method */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Refund Method</label>
              <Select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                {paymentMethods.length === 0 && <option value="">Select method...</option>}
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>
          </div>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── REMOVE ITEM CONFIRM ────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <ConfirmDialog
          open={removeConfirmOpen}
          onClose={() => { setRemoveConfirmOpen(false); setRemoveItemId(null); }}
          onConfirm={removeItem}
          title="Remove Item"
          message="Are you sure you want to remove this item from the bill? The bill total will be recalculated."
          confirmLabel="Remove"
          confirmVariant="danger"
          loading={removingItem}
        />

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── DELETE BILL CONFIRM ────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => { setDeleteConfirmOpen(false); setDeleteBillId(null); }}
          onConfirm={deleteBill}
          title="Delete Bill"
          message="Are you sure you want to delete this unpaid bill? This action cannot be undone."
          confirmLabel="Delete Bill"
          confirmVariant="danger"
          loading={deleting}
        />

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── CREATE APPOINTMENT BILL MODAL ──────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          open={apptBillOpen}
          onClose={() => setApptBillOpen(false)}
          title="Create Appointment Bill"
          size="lg"
        >
          <div className="space-y-4">
            <SearchBar
              value={apptSearch}
              onChange={setApptSearch}
              placeholder="Search by patient, doctor, date, token..."
            />
            {apptLoading ? (
              <LoadingSpinner message="Loading appointments..." size="sm" />
            ) : filteredAppointments.length === 0 ? (
              <EmptyState
                title="No eligible appointments"
                message={apptSearch ? "Try a different search term." : "All appointments already have bills or are cancelled."}
              />
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredAppointments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{a.patient?.name || "Unknown"}</span>
                        <StatusBadge status={a.status} size="xs" />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Dr. {a.schedule?.doctor?.name || "-"}
                        {a.schedule?.doctor?.specialization && ` (${a.schedule.doctor.specialization})`}
                        <span className="mx-1">|</span>
                        {a.appointmentDate || "-"}
                        {a.tokenNumber && (
                          <span className="ml-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            Token #{a.tokenNumber}
                          </span>
                        )}
                      </div>
                      {a.schedule?.fee && (
                        <p className="text-xs font-medium text-gray-700 mt-0.5">Fee: {fmtRs(a.schedule.fee)}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => createApptBill(a.id)}
                      disabled={creatingApptBill}
                      className="!px-4 !py-1.5 !text-xs"
                    >
                      {creatingApptBill ? "Creating..." : "Create Bill"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── CREATE TEST BILL WIZARD (3-step) ───────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          open={testBillOpen}
          title="Create Medical Test Bill"
          onClose={() => setTestBillOpen(false)}
          size="lg"
          footer={
            <div className="flex items-center justify-between">
              <div>
                {tbStep > 1 && (
                  <Button variant="secondary" onClick={() => setTbStep(tbStep - 1)}>Back</Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {tbSelTests.length > 0 && tbStep === 2 && (
                  <span className="text-sm font-semibold text-gray-700">
                    {fmtRs(tbTotal)}
                  </span>
                )}
                <Button variant="secondary" onClick={() => setTestBillOpen(false)}>Cancel</Button>
                {tbStep === 2 && (
                  <Button onClick={() => setTbStep(3)} disabled={tbSelTests.length === 0}>
                    Review
                  </Button>
                )}
                {tbStep === 3 && (
                  <Button onClick={tbCreateBill} disabled={tbCreating}>
                    {tbCreating ? "Creating..." : "Create Bill"}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-6">
            {["Select Patient", "Pick Tests", "Confirm"].map((label, i) => {
              const step = i + 1;
              const active = tbStep === step;
              const done = tbStep > step;
              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {done ? <CheckIcon /> : step}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${active ? "text-blue-600" : done ? "text-emerald-600" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`w-16 h-0.5 mx-2 mb-4 ${tbStep > step ? "bg-emerald-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1 -- Patient */}
          {tbStep === 1 && (
            <div className="space-y-3">
              <SearchBar
                value={tbPatientSearch}
                onChange={setTbPatientSearch}
                placeholder="Search by name, ID or phone..."
              />
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {tbFilteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setTbSelPatient(p); setTbStep(2); }}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      tbSelPatient?.id === p.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          ID #{p.id}
                          {p.phone ? ` -- ${p.phone}` : ""}
                          {p.email ? ` -- ${p.email}` : ""}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
                {tbFilteredPatients.length === 0 && (
                  <EmptyState
                    title="No patients found"
                    message={tbPatientSearch ? "Try a different search term." : "No patients registered yet."}
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 2 -- Tests */}
          {tbStep === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center justify-between">
                <div className="text-sm text-blue-700">
                  Patient: <strong>{tbSelPatient?.name}</strong>
                  <span className="text-blue-500 ml-2 text-xs">ID #{tbSelPatient?.id}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TEST_CATEGORIES.filter((cat) => cat === "ALL" || tbGrouped[cat]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTbTestCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      tbTestCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat === "ALL" ? "All Tests" : cat}
                    {cat !== "ALL" && tbGrouped[cat] ? ` (${tbGrouped[cat].length})` : ""}
                  </button>
                ))}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {Object.entries(tbFilteredGrouped).map(([type, typeTests]) => (
                  <div key={type}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 sticky top-0 bg-white py-1">
                      {type}
                    </p>
                    <div className="space-y-1">
                      {typeTests.map((t) => {
                        const selected = !!tbSelTests.find((x) => x.id === t.id);
                        return (
                          <button
                            key={t.id}
                            onClick={() => tbToggleTest(t)}
                            className={`w-full text-left flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                              selected
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                selected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                              }`}>
                                {selected && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-sm ${selected ? "font-semibold text-blue-700" : "font-medium text-gray-700"}`}>
                                {t.name}
                              </span>
                            </div>
                            <span className={`text-sm font-semibold ${selected ? "text-blue-700" : "text-gray-500"}`}>
                              {fmtRs(t.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {tbFilteredTests.length === 0 && (
                  <EmptyState
                    title="No tests available"
                    message="No active tests found for this category."
                  />
                )}
              </div>
              {tbSelTests.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{tbSelTests.length}</span>{" "}
                    test{tbSelTests.length !== 1 ? "s" : ""} selected
                  </div>
                  <div className="text-base font-bold text-gray-900">
                    Total: {fmtRs(tbTotal)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3 -- Confirm */}
          {tbStep === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Patient</p>
                <p className="text-sm font-semibold text-blue-800">{tbSelPatient?.name}</p>
                <p className="text-xs text-blue-600">
                  ID #{tbSelPatient?.id}
                  {tbSelPatient?.phone ? ` -- ${tbSelPatient.phone}` : ""}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Test</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Category</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tbSelTests.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{t.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{t.type}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">{fmtRs(t.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 border-t border-blue-100">
                      <td className="px-4 py-3 font-bold text-gray-900" colSpan="3">Total Amount</td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">{fmtRs(tbTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-500">
                  A new bill will be created with the selected tests. You can add more tests or apply discounts after creation.
                </p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default Billing;

import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Toast, useToast } from "../components/ui/Toast";

function printBill(bill) {
  const items = (bill.items || []);
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.itemName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${item.itemType}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">Rs. ${Number(item.price).toFixed(2)}</td>
    </tr>`).join("");

  const paidInfo = bill.refunded
    ? `<p style="color:#dc2626;font-weight:600;">⟲ REFUNDED</p>
       <p>Refund Method: <strong>${bill.refundMethod || "—"}</strong></p>
       <p>Reason: ${bill.refundReason || "—"}</p>
       <p>Refunded At: ${bill.refundedAt ? new Date(bill.refundedAt).toLocaleString() : "—"}</p>`
    : bill.paid
    ? `<p style="color:#059669;font-weight:600;">✓ PAID</p>
       <p>Method: <strong>${bill.paymentMethod || "—"}</strong></p>
       <p>Paid At: ${bill.paidAt ? new Date(bill.paidAt).toLocaleString() : "—"}</p>`
    : `<p style="color:#d97706;font-weight:600;">UNPAID</p>`;

  const appt = bill.appointment;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Bill #${bill.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;background:#fff}
    .page{max-width:720px;margin:40px auto;padding:0 32px 40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #1d4ed8;margin-bottom:28px}
    .hospital-name{font-size:22px;font-weight:700;color:#1d4ed8}
    .hospital-sub{font-size:12px;color:#6b7280;margin-top:2px}
    .bill-title{text-align:right}
    .bill-title h2{font-size:20px;font-weight:700;color:#1d4ed8}
    .bill-title p{font-size:12px;color:#6b7280;margin-top:4px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
    .info-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px}
    .info-box h3{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
    .info-box p{font-size:13px;color:#374151;margin:3px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:#1d4ed8;color:#fff}
    thead th{padding:10px 12px;text-align:left;font-size:12px;font-weight:600}
    thead th:last-child{text-align:right}
    tbody tr:nth-child(even){background:#f9fafb}
    .total-row{display:flex;justify-content:flex-end;margin-top:4px}
    .total-box{background:#1d4ed8;color:#fff;border-radius:8px;padding:12px 24px;font-size:16px;font-weight:700}
    .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{margin:0;padding:20px}}
  </style></head><body>
  <div class="page">
    <div class="header">
      <div><div class="hospital-name">🏥 City Hospital</div><div class="hospital-sub">Your health, our priority</div></div>
      <div class="bill-title"><h2>${bill.refunded ? "REFUND RECEIPT" : "RECEIPT"}</h2><p>Bill #${bill.id}</p><p>Issued: ${new Date(bill.createdAt || Date.now()).toLocaleDateString()}</p></div>
    </div>
    <div class="info-grid">
      <div class="info-box"><h3>Patient</h3><p><strong>${bill.patientName}</strong></p></div>
      <div class="info-box"><h3>Appointment</h3><p>Doctor: <strong>${appt?.schedule?.doctor?.name || "—"}</strong></p><p>Date: <strong>${appt?.appointmentDate || "—"}</strong></p></div>
      <div class="info-box"><h3>Payment Status</h3>${paidInfo}</div>
      <div class="info-box"><h3>Summary</h3><p>Items: <strong>${items.length}</strong></p><p>Total: <strong>Rs. ${Number(bill.totalAmount).toFixed(2)}</strong></p></div>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Type</th><th style="text-align:right;">Amount (Rs.)</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="total-row"><div class="total-box">Total: Rs. ${Number(bill.totalAmount).toFixed(2)}</div></div>
    <div class="footer"><p>Thank you for choosing City Hospital. Please retain this receipt for your records.</p><p style="margin-top:4px;">Printed on ${new Date().toLocaleString()}</p></div>
  </div>
  <script>window.onload=function(){window.print()}</script></body></html>`;

  const win = window.open("", "_blank", "width=800,height=700");
  win.document.write(html);
  win.document.close();
}

function Billing() {
  const role = localStorage.getItem("role");
  const { toasts, toast, remove } = useToast();

  const [bills, setBills]           = useState([]);
  const [filter, setFilter]         = useState(() => localStorage.getItem("billing_filter") || "all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [q, setQ]                   = useState("");
  const [loading, setLoading]       = useState(false);

  const [detailBill, setDetailBill]         = useState(null);
  const [detailOpen, setDetailOpen]         = useState(false);
  const [tests, setTests]                   = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");

  const [payOpen, setPayOpen]             = useState(false);
  const [payBillId, setPayBillId]         = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Refund modal
  const [refundOpen, setRefundOpen]     = useState(false);
  const [refundBill, setRefundBill]     = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("CASH");

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/bills");
      setBills(res.data);
    } catch { toast.error("Failed to load bills."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeFilter = (val) => {
    setFilter(val);
    localStorage.setItem("billing_filter", val);
  };

  const filtered = useMemo(() => {
    let list = bills;
    if (filter === "unpaid")   list = bills.filter((b) => !b.paid);
    if (filter === "paid")     list = bills.filter((b) => b.paid && !b.refunded);
    if (filter === "refunded") list = bills.filter((b) => b.refunded);
    if (typeFilter !== "all")  list = list.filter((b) => b.billType === typeFilter);
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((b) =>
      [String(b.id), b.patientName, String(b.totalAmount), b.paid ? "paid" : "unpaid", b.billType]
        .some((v) => (v || "").toLowerCase().includes(s))
    );
  }, [bills, filter, typeFilter, q]);

  const openDetail = async (bill) => {
    try {
      const res = await API.get(`/bills/${bill.id}`);
      setDetailBill(res.data);
      setDetailOpen(true);
      setSelectedTestId("");
      if (!bill.paid) {
        const tRes = await API.get("/tests");
        setTests(tRes.data);
      }
    } catch { toast.error("Failed to load bill details."); }
  };

  const refreshDetail = async () => {
    try {
      const res = await API.get(`/bills/${detailBill.id}`);
      setDetailBill(res.data);
      load();
    } catch { toast.error("Failed to refresh bill."); }
  };

  const addTest = async () => {
    if (!selectedTestId) return;
    try {
      await API.post(`/bills/${detailBill.id}/add-test/${selectedTestId}`);
      setSelectedTestId("");
      toast.success("Test added to bill.", "Test Added");
      refreshDetail();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to add test.", "Error");
    }
  };

  const removeTest = async (itemId) => {
    if (!confirm("Remove this test from the bill?")) return;
    try {
      await API.delete(`/bills/${detailBill.id}/items/${itemId}`);
      toast.success("Test removed from bill.", "Removed");
      refreshDetail();
    } catch (e) {
      toast.error(e?.response?.data || "Failed to remove test.", "Error");
    }
  };

  const openPay = (id) => {
    setPayBillId(id);
    setPaymentMethod("CASH");
    setPayOpen(true);
  };

  const pay = async () => {
    try {
      await API.post(`/bills/${payBillId}/pay`, { paymentMethod });
      setPayOpen(false);
      setDetailOpen(false);
      changeFilter("all");
      toast.success(`Bill #${payBillId} paid successfully via ${paymentMethod}.`, "Payment Collected ✓");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Payment failed.", "Payment Failed");
    }
  };

  // Refund
  const openRefund = (bill) => {
    if (!bill.paid) {
      toast.warning("Only paid bills can be refunded.");
      return;
    }
    if (bill.refunded) {
      toast.warning("This bill has already been refunded.");
      return;
    }
    setRefundBill(bill);
    setRefundReason("");
    setRefundMethod("CASH");
    setRefundOpen(true);
  };

  const doRefund = async () => {
    if (!refundReason.trim()) {
      toast.warning("Please enter a refund reason.");
      return;
    }
    try {
      await API.post(`/bills/${refundBill.id}/refund`, {
        reason: refundReason,
        refundMethod,
      });
      setRefundOpen(false);
      setDetailOpen(false);
      toast.success(
        `Refund of Rs. ${refundBill.totalAmount} processed for Bill #${refundBill.id}.`,
        "Refund Processed"
      );
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Refund failed.", "Refund Failed");
    }
  };

  const printFromRow = async (bill) => {
    try {
      const res = await API.get(`/bills/${bill.id}`);
      printBill(res.data);
    } catch { toast.error("Failed to load bill for printing."); }
  };

  const statusBadge = (b) => {
    if (b.refunded)
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">REFUNDED</span>;
    if (b.paid)
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">PAID</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">UNPAID</span>;
  };

  const typeBadge = (t) => {
    const map = {
      APPOINTMENT: "bg-blue-100 text-blue-700",
      TEST_ONLY:   "bg-violet-100 text-violet-700",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[t] || "bg-gray-100 text-gray-600"}`}>{t === "TEST_ONLY" ? "TESTS" : "APPT"}</span>;
  };

  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Billing</h2>
            <p className="text-gray-600 mt-1">View bills, add tests, collect payments and process refunds.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
            <Select value={filter} onChange={(e) => changeFilter(e.target.value)}>
              <option value="all">All Bills</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="APPOINTMENT">Appointment</option>
              <option value="TEST_ONLY">Tests Only</option>
            </Select>
            <div className="w-64">
              <Input placeholder="Search bills..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Table */}
        <Card title="Bills" subtitle={loading ? "Loading..." : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Bill ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Total (Rs.)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className={`border-t hover:bg-gray-50 ${b.refunded ? "opacity-60" : ""}`}>
                    <td className="p-3 text-gray-400">#{b.id}</td>
                    <td className="p-3 font-medium">{b.patientName}</td>
                    <td className="p-3">{typeBadge(b.billType)}</td>
                    <td className="p-3">Rs. {Number(b.totalAmount).toFixed(2)}</td>
                    <td className="p-3">{statusBadge(b)}</td>
                    <td className="p-3 text-gray-500">{b.refunded ? b.refundMethod : b.paymentMethod || "—"}</td>
                    <td className="p-3 text-gray-500 text-xs">
                      {b.refunded && b.refundedAt
                        ? new Date(b.refundedAt).toLocaleString()
                        : b.paidAt
                        ? new Date(b.paidAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" onClick={() => openDetail(b)}>Details</Button>
                        {(b.paid || b.refunded) && (
                          <Button variant="secondary" onClick={() => printFromRow(b)}>🖨 Print</Button>
                        )}
                        {!b.paid && (role === "ADMIN" || role === "CASHIER") && (
                          <Button variant="success" onClick={() => openPay(b.id)}>Pay</Button>
                        )}
                        {b.paid && !b.refunded && (role === "ADMIN" || role === "CASHIER") && (
                          <Button variant="danger" onClick={() => openRefund(b)}>⟲ Refund</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">No bills found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Bill Detail Modal ── */}
      <Modal open={detailOpen}
        title={`Bill #${detailBill?.id ?? ""} — ${detailBill?.patientName ?? ""}`}
        onClose={() => setDetailOpen(false)}
        footer={
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total: Rs. {Number(detailBill?.totalAmount || 0).toFixed(2)}</span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>
              {detailBill?.paid && (
                <Button variant="secondary" onClick={() => printBill(detailBill)}>🖨 Print</Button>
              )}
              {detailBill?.paid && !detailBill?.refunded && (role === "ADMIN" || role === "CASHIER") && (
                <Button variant="danger" onClick={() => openRefund(detailBill)}>⟲ Refund</Button>
              )}
              {detailBill && !detailBill.paid && (role === "ADMIN" || role === "CASHIER") && (
                <Button variant="success" onClick={() => openPay(detailBill.id)}>Pay Now</Button>
              )}
            </div>
          </div>
        }
      >
        {detailBill && (
          <div className="space-y-4">
            {detailBill.refunded && (
              <div className="bg-purple-50 border border-purple-200 text-purple-800 px-3 py-2 rounded text-sm">
                ⟲ Refunded via <strong>{detailBill.refundMethod}</strong> on{" "}
                {detailBill.refundedAt ? new Date(detailBill.refundedAt).toLocaleString() : "—"}
                {detailBill.refundReason && <span> — {detailBill.refundReason}</span>}
              </div>
            )}
            {detailBill.paid && !detailBill.refunded && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded text-sm">
                ✓ Paid via <strong>{detailBill.paymentMethod}</strong> on{" "}
                {detailBill.paidAt ? new Date(detailBill.paidAt).toLocaleString() : "—"}
              </div>
            )}

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-right">Price (Rs.)</th>
                  {!detailBill.paid && <th className="p-2"></th>}
                </tr>
              </thead>
              <tbody>
                {(detailBill.items || []).map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">{item.itemName}</td>
                    <td className="p-2 text-gray-500">{item.itemType}</td>
                    <td className="p-2 text-right">{Number(item.price).toFixed(2)}</td>
                    {!detailBill.paid && (
                      <td className="p-2">
                        {item.itemType !== "DOCTOR_FEE" && item.itemType !== "HOSPITAL_FEE" && (
                          <button onClick={() => removeTest(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {!detailBill.paid && (role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST") && (
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Add Medical Test</p>
                <div className="flex gap-2">
                  <Select value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)} className="flex-1">
                    <option value="">Select a test...</option>
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} — Rs. {t.price} ({t.type})</option>
                    ))}
                  </Select>
                  <Button onClick={addTest} disabled={!selectedTestId}>Add</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Pay Modal ── */}
      <Modal open={payOpen} title={`Pay Bill #${payBillId ?? ""}`} onClose={() => setPayOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={pay}>Confirm Payment</Button>
          </div>
        }
      >
        <div>
          <label className="text-xs text-gray-600 font-medium">Payment Method</label>
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="CASH">CASH</option>
            <option value="CARD">CARD</option>
            <option value="ONLINE">ONLINE</option>
          </Select>
        </div>
      </Modal>

      {/* ── Refund Modal ── */}
      <Modal open={refundOpen}
        title={`Process Refund — Bill #${refundBill?.id ?? ""}`}
        onClose={() => setRefundOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={doRefund}>Confirm Refund</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            ⚠ This will mark Bill <strong>#{refundBill?.id}</strong> as refunded and record the refund transaction.
            The original payment record is kept for reporting.
          </div>

          {refundBill && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-1 text-gray-700">
                <span className="text-gray-500">Patient:</span>     <span className="font-medium">{refundBill.patientName}</span>
                <span className="text-gray-500">Paid Amount:</span> <span className="font-medium text-red-600">Rs. {Number(refundBill.totalAmount).toFixed(2)}</span>
                <span className="text-gray-500">Paid via:</span>    <span className="font-medium">{refundBill.paymentMethod}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-600 font-medium">Refund Method</label>
            <Select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="ONLINE">ONLINE</option>
            </Select>
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">Reason for Refund <span className="text-red-500">*</span></label>
            <Input placeholder="e.g. Appointment cancelled, duplicate payment..."
              value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  );
}

export default Billing;
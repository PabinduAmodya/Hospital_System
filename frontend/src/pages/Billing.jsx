import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

// ─── Print helper ─────────────────────────────────────────────────────────────
function printBill(bill) {
  const items = bill.items || [];
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.itemName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${item.itemType}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">Rs. ${Number(item.price).toFixed(2)}</td>
    </tr>`).join("");

  const paidInfo = bill.paid
    ? `<p style="margin:4px 0;color:#059669;font-weight:600;">✓ PAID</p>
       <p style="margin:4px 0;">Method: <strong>${bill.paymentMethod || "—"}</strong></p>
       <p style="margin:4px 0;">Paid: ${bill.paidAt ? new Date(bill.paidAt).toLocaleString() : "—"}</p>`
    : `<p style="margin:4px 0;color:#d97706;font-weight:600;">UNPAID</p>`;

  const appt = bill.appointment;
  const doctor   = appt?.schedule?.doctor?.name || "—";
  const apptDate = appt?.appointmentDate || "—";
  const isTestOnly = bill.billType === "TEST_ONLY";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Bill #${bill.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#111827}
    .page{max-width:720px;margin:40px auto;padding:0 32px 40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #1d4ed8;margin-bottom:28px}
    .hosp{font-size:22px;font-weight:700;color:#1d4ed8}.hosp-sub{font-size:12px;color:#6b7280;margin-top:2px}
    .bill-title{text-align:right}.bill-title h2{font-size:20px;font-weight:700;color:#1d4ed8}.bill-title p{font-size:12px;color:#6b7280;margin-top:4px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
    .info-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px}
    .info-box h3{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
    .info-box p{font-size:13px;color:#374151;margin:3px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:#1d4ed8;color:#fff}thead th{padding:10px 12px;text-align:left;font-size:12px;font-weight:600}
    thead th:last-child{text-align:right}tbody tr:nth-child(even){background:#f9fafb}
    .total-row{display:flex;justify-content:flex-end;margin-top:4px}
    .total-box{background:#1d4ed8;color:#fff;border-radius:8px;padding:12px 24px;font-size:16px;font-weight:700}
    .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{margin:0;padding:20px}}
  </style></head><body><div class="page">
  <div class="header">
    <div><div class="hosp">🏥 City Hospital</div><div class="hosp-sub">Your health, our priority</div></div>
    <div class="bill-title"><h2>RECEIPT</h2><p>Bill #${bill.id}</p><p>${isTestOnly ? "Medical Tests" : "Appointment"}</p><p>Issued: ${new Date(bill.createdAt || Date.now()).toLocaleDateString()}</p></div>
  </div>
  <div class="info-grid">
    <div class="info-box"><h3>Patient</h3><p><strong>${bill.patientName}</strong></p></div>
    <div class="info-box"><h3>${isTestOnly ? "Bill Type" : "Appointment"}</h3>
      ${isTestOnly ? "<p>Medical Tests Only</p>" : `<p>Doctor: <strong>${doctor}</strong></p><p>Date: <strong>${apptDate}</strong></p>`}
    </div>
    <div class="info-box"><h3>Payment Status</h3>${paidInfo}</div>
    <div class="info-box"><h3>Bill Summary</h3><p>Items: <strong>${items.length}</strong></p><p>Total: <strong>Rs. ${Number(bill.totalAmount).toFixed(2)}</strong></p></div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Type</th><th style="text-align:right">Amount (Rs.)</th></tr></thead>
    <tbody>${itemRows || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#6b7280">No items</td></tr>'}</tbody>
  </table>
  <div class="total-row"><div class="total-box">Total: Rs. ${Number(bill.totalAmount).toFixed(2)}</div></div>
  <div class="footer"><p>Thank you for choosing City Hospital.</p><p style="margin-top:4px">Printed on ${new Date().toLocaleString()}</p></div>
  </div><script>window.onload=function(){window.print()}</script></body></html>`;

  const win = window.open("", "_blank", "width=800,height=700");
  win.document.write(html);
  win.document.close();
}

// ─── Billing ──────────────────────────────────────────────────────────────────
function Billing() {
  const role = localStorage.getItem("role");

  const [bills, setBills]           = useState([]);
  const [filter, setFilter]         = useState(() => localStorage.getItem("billing_filter") || "all");
  const [filterType, setFilterType] = useState(""); // "" | "APPOINTMENT" | "TEST_ONLY"
  const [q, setQ]                   = useState("");
  const [loading, setLoading]       = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // bill detail modal
  const [detailBill, setDetailBill]         = useState(null);
  const [detailOpen, setDetailOpen]         = useState(false);
  const [tests, setTests]                   = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");

  // pay modal
  const [payOpen, setPayOpen]             = useState(false);
  const [payBillId, setPayBillId]         = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // ── Create Test Bill modal (3-step) ───────────────────────────────────
  const [testBillOpen, setTestBillOpen]     = useState(false);
  const [tbStep, setTbStep]                 = useState(1); // 1=patient, 2=tests, 3=confirm
  const [tbPatients, setTbPatients]         = useState([]);
  const [tbAllTests, setTbAllTests]         = useState([]);
  const [tbPatientSearch, setTbPatientSearch] = useState("");
  const [tbSelPatient, setTbSelPatient]     = useState(null);
  const [tbSelTests, setTbSelTests]         = useState([]); // [{id,name,type,price}]
  const [tbCreating, setTbCreating]         = useState(false);

  // ─────────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/bills");
      setBills(res.data);
    } catch (e) {
      alert("Failed to load bills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const changeFilter = (val) => {
    setFilter(val);
    localStorage.setItem("billing_filter", val);
  };

  const filtered = useMemo(() => {
    let list = bills;
    if (filter === "unpaid") list = bills.filter((b) => !b.paid);
    if (filter === "paid")   list = bills.filter((b) => b.paid);
    if (filterType)          list = list.filter((b) => (b.billType || "APPOINTMENT") === filterType);
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((b) =>
      [String(b.id), b.patientName, String(b.totalAmount),
       b.paid ? "paid" : "unpaid", b.billType || ""].some(
        (v) => (v || "").toLowerCase().includes(s)
      )
    );
  }, [bills, filter, filterType, q]);

  // ── Bill detail ────────────────────────────────────────────────────────
  const openDetail = async (bill) => {
    try {
      const res = await API.get(`/bills/${bill.id}`);
      setDetailBill(res.data);
      setDetailOpen(true);
      setSelectedTestId("");
      if (!bill.paid) {
        const tRes = await API.get("/tests");
        setTests(tRes.data.filter((t) => t.active));
      }
    } catch (e) {
      alert("Failed to load bill details.");
    }
  };

  const refreshDetail = async () => {
    const res = await API.get(`/bills/${detailBill.id}`);
    setDetailBill(res.data);
    load();
  };

  const addTest = async () => {
    if (!selectedTestId) return;
    try {
      await API.post(`/bills/${detailBill.id}/add-test/${selectedTestId}`);
      setSelectedTestId("");
      refreshDetail();
    } catch (e) {
      alert(e?.response?.data || "Failed to add test.");
    }
  };

  const removeItem = async (itemId) => {
    if (!confirm("Remove this item from the bill?")) return;
    try {
      await API.delete(`/bills/${detailBill.id}/items/${itemId}`);
      refreshDetail();
    } catch (e) {
      alert(e?.response?.data || "Failed to remove item.");
    }
  };

  // ── Payment ────────────────────────────────────────────────────────────
  const openPay = (id) => { setPayBillId(id); setPaymentMethod("CASH"); setPayOpen(true); };

  const pay = async () => {
    try {
      await API.post(`/bills/${payBillId}/pay`, { paymentMethod });
      setPayOpen(false);
      setDetailOpen(false);
      changeFilter("all");
      setSuccessMsg(`✓ Bill #${payBillId} paid successfully via ${paymentMethod}.`);
      load();
    } catch (e) {
      alert(e?.response?.data || "Payment failed.");
    }
  };

  const printFromRow = async (bill) => {
    try {
      const res = await API.get(`/bills/${bill.id}`);
      printBill(res.data);
    } catch (e) {
      alert("Failed to load bill for printing.");
    }
  };

  // ── Create Test Bill ────────────────────────────────────────────────────
  const openTestBill = async () => {
    setTbStep(1); setTbSelPatient(null); setTbSelTests([]);
    setTbPatientSearch(""); setTbCreating(false);
    setTestBillOpen(true);
    try {
      const [pRes, tRes] = await Promise.all([API.get("/patients"), API.get("/tests")]);
      setTbPatients(pRes.data);
      setTbAllTests(tRes.data.filter((t) => t.active));
    } catch (e) {
      alert("Failed to load patients/tests.");
    }
  };

  const tbToggleTest = (t) => {
    setTbSelTests((prev) =>
      prev.find((x) => x.id === t.id) ? prev.filter((x) => x.id !== t.id) : [...prev, t]
    );
  };

  const tbTotal = useMemo(
    () => tbSelTests.reduce((s, t) => s + Number(t.price), 0),
    [tbSelTests]
  );

  const tbCreateBill = async () => {
    if (!tbSelPatient || tbSelTests.length === 0) return;
    setTbCreating(true);
    try {
      await API.post(`/bills/patient/${tbSelPatient.id}/tests`, {
        testIds: tbSelTests.map((t) => t.id),
      });
      setTestBillOpen(false);
      setSuccessMsg(`✓ Test bill created for ${tbSelPatient.name}.`);
      load();
    } catch (e) {
      alert(e?.response?.data || "Failed to create test bill.");
    } finally {
      setTbCreating(false);
    }
  };

  const tbFilteredPatients = useMemo(() => {
    const s = tbPatientSearch.trim().toLowerCase();
    if (!s) return tbPatients;
    return tbPatients.filter((p) =>
      [p.name, String(p.id), p.phone || ""].some((v) => v.toLowerCase().includes(s))
    );
  }, [tbPatients, tbPatientSearch]);

  // group tests by type for step 2
  const tbGrouped = useMemo(() => {
    const groups = {};
    tbAllTests.forEach((t) => {
      if (!groups[t.type]) groups[t.type] = [];
      groups[t.type].push(t);
    });
    return groups;
  }, [tbAllTests]);

  // ─────────────────────────────────────────────────────────────────────

  const typeBadge = (billType) => {
    if (billType === "TEST_ONLY")
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">TESTS</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">APPT</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {successMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg">
            <span className="text-sm font-medium">{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 text-lg font-bold ml-4">×</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Billing</h2>
            <p className="text-gray-600 mt-1">Appointment bills, test-only bills, and payment collection.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
            <Select value={filter} onChange={(e) => changeFilter(e.target.value)}>
              <option value="all">All Bills</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </Select>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All types</option>
              <option value="APPOINTMENT">Appointment</option>
              <option value="TEST_ONLY">Tests only</option>
            </Select>
            <div className="w-64">
              <Input placeholder="Search bills..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {(role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST") && (
              <Button onClick={openTestBill}>🧪 New Test Bill</Button>
            )}
          </div>
        </div>

        <Card title="Bills" subtitle={loading ? "Loading..." : `${filtered.length} of ${bills.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Bill ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Total (Rs.)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Paid At</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className={`border-t hover:bg-gray-50 ${b.paid ? "bg-gray-50/50" : ""}`}>
                    <td className="p-3 text-gray-500">#{b.id}</td>
                    <td className="p-3">{typeBadge(b.billType)}</td>
                    <td className="p-3 font-medium">{b.patientName}</td>
                    <td className="p-3 font-semibold">Rs. {b.totalAmount}</td>
                    <td className="p-3">
                      {b.paid
                        ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">PAID</span>
                        : <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">UNPAID</span>}
                    </td>
                    <td className="p-3 text-gray-500">{b.paymentMethod || "—"}</td>
                    <td className="p-3 text-gray-500">{b.paidAt ? new Date(b.paidAt).toLocaleString() : "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" onClick={() => openDetail(b)}>Details</Button>
                        {b.paid && <Button variant="secondary" onClick={() => printFromRow(b)}>🖨 Print</Button>}
                        {!b.paid && (role === "ADMIN" || role === "CASHIER") && (
                          <Button variant="success" onClick={() => openPay(b.id)}>Pay</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan="8" className="p-6 text-center text-gray-500">No bills found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Bill Detail Modal ─────────────────────────────────────────────── */}
        <Modal
          open={detailOpen}
          title={`Bill #${detailBill?.id ?? ""} — ${detailBill?.patientName ?? ""}`}
          onClose={() => setDetailOpen(false)}
          footer={
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total: Rs. {detailBill?.totalAmount}</span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>
                {detailBill?.paid && <Button variant="secondary" onClick={() => printBill(detailBill)}>🖨 Print</Button>}
                {detailBill && !detailBill.paid && (role === "ADMIN" || role === "CASHIER") && (
                  <Button variant="success" onClick={() => openPay(detailBill.id)}>Pay Now</Button>
                )}
              </div>
            </div>
          }
        >
          {detailBill && (
            <div className="space-y-4">
              {detailBill.paid && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded text-sm">
                  ✓ Paid via <strong>{detailBill.paymentMethod}</strong> on{" "}
                  {detailBill.paidAt ? new Date(detailBill.paidAt).toLocaleString() : "—"}
                </div>
              )}
              {detailBill.billType === "TEST_ONLY" && (
                <div className="bg-purple-50 border border-purple-100 text-purple-700 px-3 py-2 rounded text-sm">
                  🧪 Medical Tests Bill — not linked to an appointment
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
                      <td className="p-2 text-right">Rs. {item.price}</td>
                      {!detailBill.paid && (
                        <td className="p-2">
                          {item.itemType !== "DOCTOR_FEE" && item.itemType !== "HOSPITAL_FEE" && (
                            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {!detailBill.paid && (role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST") && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Add Medical Test to this Bill</p>
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

        {/* ── Pay Bill Modal ───────────────────────────────────────────────── */}
        <Modal
          open={payOpen}
          title={`Pay Bill #${payBillId ?? ""}`}
          onClose={() => setPayOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
              <Button onClick={pay}>Confirm Payment</Button>
            </div>
          }
        >
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Payment Method</label>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="ONLINE">ONLINE</option>
            </Select>
          </div>
        </Modal>

        {/* ── Create Test Bill Modal ───────────────────────────────────────── */}
        <Modal
          open={testBillOpen}
          title="Create Medical Test Bill"
          onClose={() => setTestBillOpen(false)}
          footer={
            <div className="flex items-center justify-between">
              <div>
                {tbStep > 1 && (
                  <Button variant="secondary" onClick={() => setTbStep(tbStep - 1)}>← Back</Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setTestBillOpen(false)}>Cancel</Button>
                {tbStep === 2 && (
                  <Button onClick={() => setTbStep(3)} disabled={tbSelTests.length === 0}>
                    Review →
                  </Button>
                )}
                {tbStep === 3 && (
                  <Button onClick={tbCreateBill} disabled={tbCreating}>
                    {tbCreating ? "Creating..." : "✓ Create Bill"}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {["Select Patient", "Pick Tests", "Confirm"].map((label, i) => {
              const step = i + 1;
              const active = tbStep === step;
              const done   = tbStep > step;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {done ? "✓" : step}
                  </div>
                  <span className={`text-sm ${active ? "font-semibold text-blue-600" : "text-gray-500"}`}>{label}</span>
                  {i < 2 && <div className="h-px bg-gray-200 w-5" />}
                </div>
              );
            })}
          </div>

          {/* Step 1 — patient */}
          {tbStep === 1 && (
            <div className="space-y-3">
              <input
                type="text" autoFocus
                placeholder="Search by name, ID or phone..."
                value={tbPatientSearch}
                onChange={(e) => setTbPatientSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {tbFilteredPatients.map((p) => (
                  <button key={p.id} onClick={() => { setTbSelPatient(p); setTbStep(2); }}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      ID #{p.id}{p.phone ? ` · ${p.phone}` : ""}
                    </div>
                  </button>
                ))}
                {tbFilteredPatients.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">No patients match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — tests grouped by type */}
          {tbStep === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-700">
                Patient: <strong>{tbSelPatient?.name}</strong>
              </div>
              <p className="text-sm text-gray-500">Select one or more tests to include in this bill:</p>

              <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
                {Object.entries(tbGrouped).map(([type, typeTests]) => (
                  <div key={type}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{type}</p>
                    <div className="space-y-1">
                      {typeTests.map((t) => {
                        const selected = !!tbSelTests.find((x) => x.id === t.id);
                        return (
                          <button key={t.id} onClick={() => tbToggleTest(t)}
                            className={`w-full text-left flex items-center justify-between px-4 py-2.5 rounded-lg border transition-colors ${
                              selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                                {selected && <span className="text-white text-xs">✓</span>}
                              </div>
                              <span className="text-sm font-medium">{t.name}</span>
                            </div>
                            <span className="text-sm font-semibold">Rs. {t.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {tbAllTests.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">No active tests available. Add tests in the Medical Tests tab first.</p>
                )}
              </div>

              {tbSelTests.length > 0 && (
                <div className="bg-gray-50 border rounded-lg px-4 py-2 flex justify-between text-sm">
                  <span className="text-gray-600">{tbSelTests.length} test{tbSelTests.length !== 1 ? "s" : ""} selected</span>
                  <span className="font-bold text-gray-800">Total: Rs. {tbTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — confirm */}
          {tbStep === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm space-y-1">
                <p className="text-blue-700">Patient: <strong>{tbSelPatient?.name}</strong> (ID #{tbSelPatient?.id})</p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Test</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tbSelTests.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="p-3">{t.name}</td>
                        <td className="p-3 text-gray-500">{t.type}</td>
                        <td className="p-3 text-right">Rs. {t.price}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-gray-50">
                      <td className="p-3 font-bold" colSpan="2">Total</td>
                      <td className="p-3 text-right font-bold text-blue-700">Rs. {tbTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="text-xs text-gray-400">
                This bill will be created as UNPAID. You can collect payment from the Billing list.
              </p>
            </div>
          )}
        </Modal>

      </div>
    </DashboardLayout>
  );
}

export default Billing;
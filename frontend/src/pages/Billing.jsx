import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

function Billing() {
  const role = localStorage.getItem("role");

  const [bills, setBills]           = useState([]);
  // "all", "unpaid", "paid"  — persisted across page refreshes
  const [filter, setFilter]         = useState(() => localStorage.getItem("billing_filter") || "all");
  const [q, setQ]                   = useState("");
  const [loading, setLoading]       = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Bill detail / test management
  const [detailBill, setDetailBill]         = useState(null);
  const [detailOpen, setDetailOpen]         = useState(false);
  const [tests, setTests]                   = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");

  // Pay modal
  const [payOpen, setPayOpen]             = useState(false);
  const [payBillId, setPayBillId]         = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Always fetch ALL bills from backend — filtering is done client-side
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

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const changeFilter = (val) => {
    setFilter(val);
    localStorage.setItem("billing_filter", val);
  };

  // Client-side filter: paid / unpaid / all + search
  const filtered = useMemo(() => {
    let list = bills;
    if (filter === "unpaid") list = bills.filter((b) => !b.paid);
    if (filter === "paid")   list = bills.filter((b) => b.paid);

    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((b) =>
      [String(b.id), b.patientName, String(b.totalAmount), b.paid ? "paid" : "unpaid"].some(
        (v) => (v || "").toString().toLowerCase().includes(s)
      )
    );
  }, [bills, filter, q]);

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
    } catch (e) {
      alert("Failed to load bill details.");
    }
  };

  const refreshDetail = async () => {
    try {
      const res = await API.get(`/bills/${detailBill.id}`);
      setDetailBill(res.data);
      load();
    } catch (e) {
      alert("Failed to refresh bill.");
    }
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

  const removeTest = async (itemId) => {
    if (!confirm("Remove this test from the bill?")) return;
    try {
      await API.delete(`/bills/${detailBill.id}/items/${itemId}`);
      refreshDetail();
    } catch (e) {
      alert(e?.response?.data || "Failed to remove test.");
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
      // Switch to "All Bills" so the paid bill is immediately visible
      changeFilter("all");
      setSuccessMsg(`✓ Bill #${payBillId} paid successfully via ${paymentMethod}.`);
      load(); // Reload fresh data
    } catch (e) {
      alert(e?.response?.data || "Payment failed.");
    }
  };

  const emptyMsg = {
    all:    "No bills found.",
    unpaid: "No unpaid bills found.",
    paid:   "No paid bills found.",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Success Banner */}
        {successMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg">
            <span className="text-sm font-medium">{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-800 text-lg font-bold ml-4">×</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Billing</h2>
            <p className="text-gray-600 mt-1">View bills, add tests, and collect payments.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Select value={filter} onChange={(e) => changeFilter(e.target.value)}>
              <option value="all">All Bills</option>
              <option value="unpaid">Unpaid Bills</option>
              <option value="paid">Paid Bills</option>
            </Select>
            <div className="w-72">
              <Input placeholder="Search bills..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <Card title="Bills" subtitle={loading ? "Loading..." : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Bill ID</th>
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
                  <tr key={b.id} className={`border-t ${b.paid ? "bg-gray-50" : ""}`}>
                    <td className="p-3">{b.id}</td>
                    <td className="p-3 font-medium">{b.patientName}</td>
                    <td className="p-3">Rs. {b.totalAmount}</td>
                    <td className="p-3">
                      {b.paid
                        ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">PAID</span>
                        : <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">UNPAID</span>}
                    </td>
                    <td className="p-3 text-gray-500">{b.paymentMethod || "—"}</td>
                    <td className="p-3 text-gray-500">
                      {b.paidAt ? new Date(b.paidAt).toLocaleString() : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" onClick={() => openDetail(b)}>
                          View Details
                        </Button>
                        {!b.paid && (role === "ADMIN" || role === "CASHIER") && (
                          <Button variant="success" onClick={() => openPay(b.id)}>
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">
                      {emptyMsg[filter]}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bill Detail Modal */}
        <Modal
          open={detailOpen}
          title={`Bill #${detailBill?.id ?? ""} — ${detailBill?.patientName ?? ""}`}
          onClose={() => setDetailOpen(false)}
          footer={
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">
                Total: Rs. {detailBill?.totalAmount}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>
                {detailBill && !detailBill.paid && (role === "ADMIN" || role === "CASHIER") && (
                  <Button variant="success" onClick={() => openPay(detailBill.id)}>
                    Pay Now
                  </Button>
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
                      <td className="p-2 text-right">{item.price}</td>
                      {!detailBill.paid && (
                        <td className="p-2">
                          {item.itemType !== "DOCTOR_FEE" && item.itemType !== "HOSPITAL_FEE" && (
                            <button
                              onClick={() => removeTest(item.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
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
                    <Select
                      value={selectedTestId}
                      onChange={(e) => setSelectedTestId(e.target.value)}
                      className="flex-1"
                    >
                      <option value="">Select a test...</option>
                      {tests.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — Rs. {t.price} ({t.type})
                        </option>
                      ))}
                    </Select>
                    <Button onClick={addTest} disabled={!selectedTestId}>Add</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Pay Bill Modal */}
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
            <label className="text-xs text-gray-600">Payment Method</label>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="ONLINE">ONLINE</option>
            </Select>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
}

export default Billing;
import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

function Billing() {
  const [bills, setBills] = useState([]);
  const [unpaidOnly, setUnpaidOnly] = useState(true);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [payBillId, setPayBillId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(unpaidOnly ? "/bills/unpaid" : "/bills");
      setBills(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load bills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [unpaidOnly]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return bills;
    return bills.filter((b) =>
      [String(b.id), b.patientName, String(b.totalAmount), b.paid ? "paid" : "unpaid"].some((v) =>
        (v || "").toString().toLowerCase().includes(s)
      )
    );
  }, [bills, q]);

  const openPay = (id) => {
    setPayBillId(id);
    setPaymentMethod("CASH");
    setPayOpen(true);
  };

  const pay = async () => {
    try {
      await API.post(`/bills/${payBillId}/pay`, { paymentMethod });
      setPayOpen(false);
      load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data || "Payment failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Billing</h2>
            <p className="text-gray-600 mt-1">View bills and mark as paid.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Select value={unpaidOnly ? "unpaid" : "all"} onChange={(e) => setUnpaidOnly(e.target.value === "unpaid")}>
              <option value="unpaid">Unpaid Bills</option>
              <option value="all">All Bills</option>
            </Select>
            <div className="w-72">
              <Input placeholder="Search bills..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <Card title="Bills" subtitle={loading ? "Loading..." : `${filtered.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Bill ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="p-3">{b.id}</td>
                    <td className="p-3 font-medium">{b.patientName}</td>
                    <td className="p-3">{b.totalAmount}</td>
                    <td className="p-3">
                      {b.paid ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">PAID</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">UNPAID</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {!b.paid && <Button variant="success" onClick={() => openPay(b.id)}>Pay</Button>}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-500">
                      No bills found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">Payment Method</label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="CASH">CASH</option>
                <option value="CARD">CARD</option>
                <option value="ONLINE">ONLINE</option>
              </Select>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Uses: <span className="font-mono">POST /api/bills/{payBillId}/pay</span>
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default Billing;

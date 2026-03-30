import { useState, useEffect } from "react";
import API from "../../api/axios";
import PatientLayout from "../../layouts/PatientLayout";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";
import { useToast, Toast } from "../../components/ui/Toast";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(amount) {
  if (amount == null) return "Rs. 0";
  return `Rs. ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const statIcons = {
  total: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  paid: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  outstanding: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function printReceipt(bill) {
  const itemRows = (bill.items || [])
    .map(
      (item, i) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">${i + 1}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:600;">${item.itemName || item.name || ""}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${item.type || "-"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${item.quantity || 1}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;">Rs. ${Number(item.price || item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt - ${bill.billNumber || ""}</title>
<style>
  @page { size: A5 portrait; margin: 12mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Geneva,sans-serif; color:#1f2937; font-size:12px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @media print { .no-print { display:none!important; } }
</style>
</head>
<body>
<div style="text-align:center;border-bottom:2px solid #1e40af;padding-bottom:10px;margin-bottom:14px;">
  <h1 style="font-size:18px;font-weight:800;color:#1e40af;">Payment Receipt</h1>
  <p style="font-size:10px;color:#6b7280;margin-top:4px;">Bill #${bill.billNumber || ""} | ${formatDate(bill.billDate || bill.date || bill.createdAt)}</p>
</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
  <thead>
    <tr style="background:#f0f4ff;">
      <th style="padding:6px 10px;text-align:center;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;width:30px;">#</th>
      <th style="padding:6px 10px;text-align:left;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Item</th>
      <th style="padding:6px 10px;text-align:center;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Type</th>
      <th style="padding:6px 10px;text-align:center;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Qty</th>
      <th style="padding:6px 10px;text-align:right;font-size:11px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e40af;">Price</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>
<div style="text-align:right;margin-bottom:14px;">
  ${bill.subtotal != null ? `<p style="font-size:12px;color:#374151;">Subtotal: Rs. ${Number(bill.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>` : ""}
  ${bill.discountAmount ? `<p style="font-size:12px;color:#059669;">Discount: -Rs. ${Number(bill.discountAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>` : ""}
  ${bill.taxAmount ? `<p style="font-size:12px;color:#374151;">Tax: Rs. ${Number(bill.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>` : ""}
  <p style="font-size:14px;font-weight:700;color:#1e3a5f;margin-top:6px;padding-top:6px;border-top:2px solid #1e40af;">Total: Rs. ${Number(bill.totalAmount || bill.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
  ${bill.paidAmount != null ? `<p style="font-size:12px;color:#059669;margin-top:4px;">Paid: Rs. ${Number(bill.paidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>` : ""}
  ${bill.dueAmount != null && bill.dueAmount > 0 ? `<p style="font-size:12px;color:#dc2626;margin-top:2px;">Due: Rs. ${Number(bill.dueAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>` : ""}
</div>
<div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:10px;text-align:center;">
  <p style="font-size:10px;color:#9ca3af;font-style:italic;">This is a computer-generated receipt</p>
</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=600,height=800");
  if (!win) {
    alert("Please allow popups to print the receipt.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

function MyBills() {
  const { toasts, toast, remove } = useToast();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  // Detail modal
  const [detailModal, setDetailModal] = useState(false);
  const [detailBill, setDetailBill] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await API.get("/patient-portal/bills");
      setBills(res.data || []);
    } catch (err) {
      console.error("Failed to load bills:", err);
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (bill) => {
    setDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await API.get(`/patient-portal/bills/${bill.id}`);
      setDetailBill(res.data);
    } catch (err) {
      toast.error("Failed to load bill details");
      setDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Calculate totals
  const totalBilled = bills.reduce((sum, b) => sum + (Number(b.totalAmount || b.total) || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
  const totalOutstanding = totalBilled - totalPaid;

  // Filter and paginate
  const filtered = bills.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.billNumber || "").toLowerCase().includes(q) ||
      (b.type || "").toLowerCase().includes(q) ||
      (b.paymentStatus || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <PatientLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bills</h1>
        <p className="text-sm text-gray-500 mt-1">View your billing history and payment details</p>
      </div>

      {/* Stats Row */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={statIcons.total}
            label="Total Billed"
            value={formatCurrency(totalBilled)}
            color="blue"
          />
          <StatCard
            icon={statIcons.paid}
            label="Total Paid"
            value={formatCurrency(totalPaid)}
            color="emerald"
          />
          <StatCard
            icon={statIcons.outstanding}
            label="Outstanding"
            value={formatCurrency(totalOutstanding)}
            color={totalOutstanding > 0 ? "amber" : "emerald"}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by bill number, type..."
          className="w-full sm:w-72"
        />
      </div>

      {/* Bills List */}
      {loading ? (
        <LoadingSpinner message="Loading bills..." />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No bills found"
            message={search ? "No bills match your search." : "Your billing history will appear here."}
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-semibold text-gray-900">
                        {bill.billNumber || `Bill #${bill.id}`}
                      </span>
                      {bill.type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          bill.type === "APPOINTMENT"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {bill.type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(bill.billDate || bill.date || bill.createdAt)}
                    </p>
                  </div>

                  {/* Amount & Status */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(bill.totalAmount || bill.total)}
                      </p>
                    </div>
                    <StatusBadge status={bill.paymentStatus || "UNPAID"} />
                    <Button
                      variant="secondary"
                      className="text-xs px-3 py-1.5"
                      onClick={() => openDetail(bill)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* Bill Detail Modal */}
      <Modal
        open={detailModal}
        onClose={() => { setDetailModal(false); setDetailBill(null); }}
        title="Bill Details"
        size="lg"
        footer={
          detailBill && (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDetailModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => printReceipt(detailBill)}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </span>
              </Button>
            </div>
          )
        }
      >
        {loadingDetail ? (
          <LoadingSpinner message="Loading bill details..." size="sm" />
        ) : detailBill ? (
          <div className="space-y-6">
            {/* Bill Header */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <div>
                <p className="text-sm font-mono font-bold text-gray-900">{detailBill.billNumber || `Bill #${detailBill.id}`}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(detailBill.billDate || detailBill.date || detailBill.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {detailBill.type && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    detailBill.type === "APPOINTMENT"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {detailBill.type}
                  </span>
                )}
                <StatusBadge status={detailBill.paymentStatus || "UNPAID"} />
              </div>
            </div>

            {/* Items Table */}
            {(detailBill.items || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Items</h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Item</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailBill.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{item.itemName || item.name || "Item"}</td>
                          <td className="px-4 py-2.5 text-center text-gray-500">{item.type || "-"}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{item.quantity || 1}</td>
                          <td className="px-4 py-2.5 text-right text-gray-900 font-medium">
                            {formatCurrency(item.price || item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Calculation */}
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="space-y-2">
                {detailBill.subtotal != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(detailBill.subtotal)}</span>
                  </div>
                )}
                {detailBill.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Discount
                      {detailBill.discountPercentage ? ` (${detailBill.discountPercentage}%)` : ""}
                    </span>
                    <span className="text-emerald-600 font-medium">-{formatCurrency(detailBill.discountAmount)}</span>
                  </div>
                )}
                {detailBill.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Tax
                      {detailBill.taxPercentage ? ` (${detailBill.taxPercentage}%)` : ""}
                    </span>
                    <span className="text-gray-900 font-medium">{formatCurrency(detailBill.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(detailBill.totalAmount || detailBill.total)}</span>
                </div>
                {detailBill.paidAmount != null && (
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-gray-500">Paid</span>
                    <span className="text-emerald-600 font-medium">{formatCurrency(detailBill.paidAmount)}</span>
                  </div>
                )}
                {detailBill.dueAmount != null && detailBill.dueAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due</span>
                    <span className="text-red-600 font-bold">{formatCurrency(detailBill.dueAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            {detailBill.paymentMethod && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium mb-0.5">Payment Method</p>
                <p className="text-sm font-semibold text-emerald-800">{detailBill.paymentMethod}</p>
                {detailBill.paymentDate && (
                  <p className="text-xs text-emerald-600 mt-0.5">Paid on {formatDate(detailBill.paymentDate)}</p>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </PatientLayout>
  );
}

export default MyBills;

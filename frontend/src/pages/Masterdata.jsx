import { useEffect, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useToast, Toast } from "../components/ui/Toast";

const CHIP_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

function getChipColor(index) {
  return CHIP_COLORS[index % CHIP_COLORS.length];
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-1">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
  );
}

function MasterData() {
  const { toasts, toast, remove } = useToast();

  // ── Page loading ─────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);

  // ── Hospital Information ─────────────────────────────────────────────
  const [hospitalInfo, setHospitalInfo] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [hospitalInfoLoading, setHospitalInfoLoading] = useState(false);

  // ── Hospital Charge ──────────────────────────────────────────────────
  const [charge, setCharge] = useState("");
  const [chargeEdit, setChargeEdit] = useState("");
  const [chargeLoading, setChargeLoading] = useState(false);

  // ── Tax Rate ─────────────────────────────────────────────────────────
  const [taxRate, setTaxRate] = useState("");
  const [taxRateEdit, setTaxRateEdit] = useState("");
  const [taxRateLoading, setTaxRateLoading] = useState(false);

  // ── Specializations ──────────────────────────────────────────────────
  const [specs, setSpecs] = useState([]);
  const [newSpec, setNewSpec] = useState("");
  const [specLoading, setSpecLoading] = useState(false);

  // ── Discount Reasons ─────────────────────────────────────────────────
  const [discountReasons, setDiscountReasons] = useState([]);
  const [newReason, setNewReason] = useState("");
  const [reasonLoading, setReasonLoading] = useState(false);

  // ── Payment Methods ──────────────────────────────────────────────────
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newMethod, setNewMethod] = useState("");
  const [methodLoading, setMethodLoading] = useState(false);

  // ── System Info ──────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());

  // ── Load all data on mount ───────────────────────────────────────────
  const load = async () => {
    setPageLoading(true);
    try {
      const results = await Promise.allSettled([
        API.get("/master/hospital-charge"),
        API.get("/master/specializations"),
        API.get("/master/tax-rate"),
        API.get("/master/hospital-info"),
        API.get("/master/discount-reasons"),
        API.get("/master/payment-methods"),
      ]);

      const [chargeRes, specsRes, taxRes, infoRes, reasonsRes, methodsRes] =
        results;

      if (chargeRes.status === "fulfilled") {
        setCharge(chargeRes.value.data.amount);
        setChargeEdit(chargeRes.value.data.amount);
      }
      if (specsRes.status === "fulfilled") {
        setSpecs(specsRes.value.data);
      }
      if (taxRes.status === "fulfilled") {
        setTaxRate(taxRes.value.data.rate);
        setTaxRateEdit(taxRes.value.data.rate);
      }
      if (infoRes.status === "fulfilled") {
        setHospitalInfo({
          name: infoRes.value.data.name || "",
          address: infoRes.value.data.address || "",
          phone: infoRes.value.data.phone || "",
          email: infoRes.value.data.email || "",
        });
      }
      if (reasonsRes.status === "fulfilled") {
        setDiscountReasons(reasonsRes.value.data);
      }
      if (methodsRes.status === "fulfilled") {
        setPaymentMethods(methodsRes.value.data);
      }

      const anyFailed = results.some((r) => r.status === "rejected");
      if (anyFailed) {
        toast.warning(
          "Some settings could not be loaded. Those sections may show defaults."
        );
      }
    } catch {
      toast.error("Failed to load master data. Please refresh the page.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedSpecs = [...specs].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  const sortedReasons = [...discountReasons].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  const sortedMethods = [...paymentMethods].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  // ── Hospital Information handlers ────────────────────────────────────
  const saveHospitalInfo = async () => {
    setHospitalInfoLoading(true);
    try {
      const res = await API.put("/master/hospital-info", hospitalInfo);
      setHospitalInfo({
        name: res.data.name || "",
        address: res.data.address || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
      });
      toast.success("Hospital information updated successfully.");
    } catch (e) {
      toast.error(
        e?.response?.data?.error || "Failed to update hospital information."
      );
    } finally {
      setHospitalInfoLoading(false);
    }
  };

  // ── Hospital Charge handlers ─────────────────────────────────────────
  const saveCharge = async () => {
    if (!chargeEdit || isNaN(chargeEdit) || Number(chargeEdit) <= 0) {
      toast.warning("Enter a valid amount greater than 0.");
      return;
    }
    setChargeLoading(true);
    try {
      const res = await API.put("/master/hospital-charge", {
        amount: String(chargeEdit),
      });
      setCharge(res.data.amount);
      toast.success("Hospital charge updated successfully.");
    } catch (e) {
      toast.error(
        e?.response?.data?.error || "Failed to update hospital charge."
      );
    } finally {
      setChargeLoading(false);
    }
  };

  // ── Tax Rate handlers ────────────────────────────────────────────────
  const saveTaxRate = async () => {
    const val = Number(taxRateEdit);
    if (taxRateEdit === "" || isNaN(val) || val < 0 || val > 100) {
      toast.warning("Enter a valid tax rate between 0 and 100.");
      return;
    }
    setTaxRateLoading(true);
    try {
      const res = await API.put("/master/tax-rate", {
        rate: String(taxRateEdit),
      });
      setTaxRate(res.data.rate);
      toast.success("Tax rate updated successfully.");
    } catch (e) {
      toast.error(
        e?.response?.data?.error || "Failed to update tax rate."
      );
    } finally {
      setTaxRateLoading(false);
    }
  };

  // ── Specialization handlers ──────────────────────────────────────────
  const addSpec = async () => {
    const trimmed = newSpec.trim();
    if (!trimmed) return;
    if (specs.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      toast.warning(`"${trimmed}" already exists in specializations.`);
      return;
    }
    await saveSpecs([...specs, trimmed], `"${trimmed}" added successfully.`);
    setNewSpec("");
  };

  const removeSpec = async (spec) => {
    if (!confirm(`Remove "${spec}" from specializations?`)) return;
    await saveSpecs(
      specs.filter((s) => s !== spec),
      `"${spec}" removed.`
    );
  };

  const saveSpecs = async (list, msg) => {
    setSpecLoading(true);
    try {
      const res = await API.put("/master/specializations", list);
      setSpecs(res.data);
      toast.success(msg);
    } catch {
      toast.error("Failed to update specializations.");
    } finally {
      setSpecLoading(false);
    }
  };

  // ── Discount Reasons handlers ────────────────────────────────────────
  const addReason = async () => {
    const trimmed = newReason.trim();
    if (!trimmed) return;
    if (
      discountReasons
        .map((r) => r.toLowerCase())
        .includes(trimmed.toLowerCase())
    ) {
      toast.warning(`"${trimmed}" already exists in discount reasons.`);
      return;
    }
    await saveReasons(
      [...discountReasons, trimmed],
      `"${trimmed}" added successfully.`
    );
    setNewReason("");
  };

  const removeReason = async (reason) => {
    if (!confirm(`Remove "${reason}" from discount reasons?`)) return;
    await saveReasons(
      discountReasons.filter((r) => r !== reason),
      `"${reason}" removed.`
    );
  };

  const saveReasons = async (list, msg) => {
    setReasonLoading(true);
    try {
      const res = await API.put("/master/discount-reasons", list);
      setDiscountReasons(res.data);
      toast.success(msg);
    } catch {
      toast.error("Failed to update discount reasons.");
    } finally {
      setReasonLoading(false);
    }
  };

  // ── Payment Methods handlers ─────────────────────────────────────────
  const addMethod = async () => {
    const trimmed = newMethod.trim();
    if (!trimmed) return;
    if (
      paymentMethods
        .map((m) => m.toLowerCase())
        .includes(trimmed.toLowerCase())
    ) {
      toast.warning(`"${trimmed}" already exists in payment methods.`);
      return;
    }
    await saveMethods(
      [...paymentMethods, trimmed],
      `"${trimmed}" added successfully.`
    );
    setNewMethod("");
  };

  const removeMethod = async (method) => {
    if (!confirm(`Remove "${method}" from payment methods?`)) return;
    await saveMethods(
      paymentMethods.filter((m) => m !== method),
      `"${method}" removed.`
    );
  };

  const saveMethods = async (list, msg) => {
    setMethodLoading(true);
    try {
      const res = await API.put("/master/payment-methods", list);
      setPaymentMethods(res.data);
      toast.success(msg);
    } catch {
      toast.error("Failed to update payment methods.");
    } finally {
      setMethodLoading(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner message="Loading master data..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Master Data & Settings
          </h2>
          <p className="text-gray-500 mt-1">
            Configure hospital-wide settings used across the system.
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            Section 1: Hospital Information (full width)
        ════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader
            title="Hospital Information"
            description="General details about the hospital displayed on reports and invoices."
          />
          <Card
            title="Hospital Profile"
            subtitle="Update your hospital's public information"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Hospital Name */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Hospital Name
                </label>
                <Input
                  value={hospitalInfo.name}
                  onChange={(e) =>
                    setHospitalInfo((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Enter hospital name..."
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={hospitalInfo.email}
                  onChange={(e) =>
                    setHospitalInfo((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="hospital@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={hospitalInfo.phone}
                  onChange={(e) =>
                    setHospitalInfo((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+94 XX XXX XXXX"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Address
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
                  rows={3}
                  value={hospitalInfo.address}
                  onChange={(e) =>
                    setHospitalInfo((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Enter full address..."
                />
              </div>
            </div>

            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <Button
                onClick={saveHospitalInfo}
                disabled={hospitalInfoLoading}
              >
                {hospitalInfoLoading ? "Saving..." : "Save Hospital Info"}
              </Button>
            </div>
          </Card>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            Section 2: Billing Configuration (2-column grid)
        ════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader
            title="Billing Configuration"
            description="Financial settings and doctor specializations used throughout the billing system."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Financial Settings Card ── */}
            <Card
              title="Financial Settings"
              subtitle="Charges and taxes applied to bills"
            >
              {/* Hospital Charge */}
              <div className="mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mb-4">
                  <p className="text-xs font-medium text-blue-500 uppercase tracking-wide">
                    Current Hospital Charge
                  </p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">
                    Rs. {charge}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    Update Amount (Rs.)
                  </label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={chargeEdit}
                      onChange={(e) => setChargeEdit(e.target.value)}
                      placeholder="Enter new charge..."
                    />
                    <Button
                      onClick={saveCharge}
                      disabled={chargeLoading}
                      className="flex-shrink-0"
                    >
                      {chargeLoading ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 text-sm mt-0.5">i</span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This charge is added to every appointment fee on top of the
                    doctor's channeling fee. Changing it will affect all future
                    appointments.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 my-5" />

              {/* Tax Rate */}
              <div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 mb-4">
                  <p className="text-xs font-medium text-emerald-500 uppercase tracking-wide">
                    Current Tax Rate
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">
                    {taxRate}%
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    Update Tax Rate (%)
                  </label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRateEdit}
                      onChange={(e) => setTaxRateEdit(e.target.value)}
                      placeholder="Enter tax rate..."
                    />
                    <Button
                      onClick={saveTaxRate}
                      disabled={taxRateLoading}
                      className="flex-shrink-0"
                    >
                      {taxRateLoading ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 text-sm mt-0.5">i</span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Applied to all new bills. Existing bills retain their
                    original tax rate.
                  </p>
                </div>
              </div>
            </Card>

            {/* ── Specializations Card ── */}
            <Card
              title="Doctor Specializations"
              subtitle="Dropdown options when adding a new doctor"
              right={
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {specs.length} total
                </span>
              }
            >
              {/* Add new */}
              <div className="flex gap-2 mb-5">
                <Input
                  placeholder="New specialization name..."
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSpec()}
                />
                <Button
                  onClick={addSpec}
                  disabled={specLoading || !newSpec.trim()}
                  className="flex-shrink-0 px-3"
                >
                  {specLoading ? "..." : "+"}
                </Button>
              </div>

              {/* Chips list */}
              <div className="flex flex-wrap gap-2">
                {sortedSpecs.map((s, i) => (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getChipColor(i)}`}
                  >
                    {s}
                    <button
                      onClick={() => removeSpec(s)}
                      disabled={specLoading}
                      className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity text-sm leading-none"
                      title={`Remove ${s}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {specs.length === 0 && (
                  <p className="text-gray-400 text-sm py-6 text-center w-full">
                    No specializations added yet. Add one above.
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
                Press Enter to add quickly. Click x on a chip to remove it.
              </p>
            </Card>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            Section 3: Billing Options (2-column grid)
        ════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader
            title="Billing Options"
            description="Configure discount reasons and payment methods available during billing."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Discount Reasons Card ── */}
            <Card
              title="Discount Reasons"
              subtitle="Available discount reasons in billing"
              right={
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {discountReasons.length} total
                </span>
              }
            >
              {/* Add new */}
              <div className="flex gap-2 mb-5">
                <Input
                  placeholder="New discount reason..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addReason()}
                />
                <Button
                  onClick={addReason}
                  disabled={reasonLoading || !newReason.trim()}
                  className="flex-shrink-0 px-3"
                >
                  {reasonLoading ? "..." : "+"}
                </Button>
              </div>

              {/* Chips list */}
              <div className="flex flex-wrap gap-2">
                {sortedReasons.map((r, i) => (
                  <span
                    key={r}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getChipColor(i)}`}
                  >
                    {r}
                    <button
                      onClick={() => removeReason(r)}
                      disabled={reasonLoading}
                      className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity text-sm leading-none"
                      title={`Remove ${r}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {discountReasons.length === 0 && (
                  <p className="text-gray-400 text-sm py-6 text-center w-full">
                    No discount reasons added yet. Add one above.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 mt-4 p-3 bg-gray-50 rounded-lg border-t border-gray-100">
                <span className="text-gray-400 text-sm mt-0.5">i</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  These reasons appear as dropdown options when applying a
                  discount to a bill.
                </p>
              </div>
            </Card>

            {/* ── Payment Methods Card ── */}
            <Card
              title="Payment Methods"
              subtitle="Available payment methods for bill payments"
              right={
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {paymentMethods.length} total
                </span>
              }
            >
              {/* Add new */}
              <div className="flex gap-2 mb-5">
                <Input
                  placeholder="New payment method..."
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMethod()}
                />
                <Button
                  onClick={addMethod}
                  disabled={methodLoading || !newMethod.trim()}
                  className="flex-shrink-0 px-3"
                >
                  {methodLoading ? "..." : "+"}
                </Button>
              </div>

              {/* Chips list */}
              <div className="flex flex-wrap gap-2">
                {sortedMethods.map((m, i) => (
                  <span
                    key={m}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getChipColor(i)}`}
                  >
                    {m}
                    <button
                      onClick={() => removeMethod(m)}
                      disabled={methodLoading}
                      className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity text-sm leading-none"
                      title={`Remove ${m}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {paymentMethods.length === 0 && (
                  <p className="text-gray-400 text-sm py-6 text-center w-full">
                    No payment methods added yet. Add one above.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 mt-4 p-3 bg-gray-50 rounded-lg border-t border-gray-100">
                <span className="text-gray-400 text-sm mt-0.5">i</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  These methods appear as options when recording a payment
                  against a bill.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            Section 4: System Information
        ════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <SectionHeader
            title="System Information"
            description="General system status and version details."
          />
          <Card
            title="System Status"
            subtitle="General system status overview"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Date/Time */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Current Date & Time
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-0.5 font-mono">
                  {currentTime.toLocaleTimeString("en-US")}
                </p>
              </div>

              {/* App Version */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  App Version
                </p>
                <p className="text-sm font-semibold text-gray-800">v1.0.0</p>
                <p className="text-xs text-gray-500 mt-0.5">Stable release</p>
              </div>

              {/* Database Status */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Database Status
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-semibold text-emerald-700">
                    Connected
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  All services operational
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MasterData;

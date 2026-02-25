import { useEffect, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

function MasterData() {
  // ── Hospital Charge ──────────────────────────────────────────────────
  const [charge, setCharge]         = useState("");
  const [chargeEdit, setChargeEdit] = useState("");
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeMsg, setChargeMsg]   = useState("");

  // ── Specializations ──────────────────────────────────────────────────
  const [specs, setSpecs]           = useState([]);
  const [newSpec, setNewSpec]       = useState("");
  const [specLoading, setSpecLoading] = useState(false);
  const [specMsg, setSpecMsg]       = useState("");

  const load = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        API.get("/master/hospital-charge"),
        API.get("/master/specializations"),
      ]);
      setCharge(cRes.data.amount);
      setChargeEdit(cRes.data.amount);
      setSpecs(sRes.data);
    } catch (e) {
      alert("Failed to load master data.");
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-hide messages
  const flashMsg = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(""), 3000);
  };

  // ── Hospital Charge handlers ─────────────────────────────────────────
  const saveCharge = async () => {
    if (!chargeEdit || isNaN(chargeEdit) || Number(chargeEdit) <= 0) {
      alert("Enter a valid amount greater than 0.");
      return;
    }
    setChargeLoading(true);
    try {
      const res = await API.put("/master/hospital-charge", { amount: String(chargeEdit) });
      setCharge(res.data.amount);
      flashMsg(setChargeMsg, "✓ Hospital charge updated.");
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to update charge.");
    } finally {
      setChargeLoading(false);
    }
  };

  // ── Specialization handlers ──────────────────────────────────────────
  const addSpec = async () => {
    const trimmed = newSpec.trim();
    if (!trimmed) return;
    if (specs.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      alert(`"${trimmed}" already exists.`);
      return;
    }
    await saveSpecs([...specs, trimmed], `✓ "${trimmed}" added.`);
    setNewSpec("");
  };

  const removeSpec = async (spec) => {
    if (!confirm(`Remove "${spec}" from specializations?`)) return;
    await saveSpecs(specs.filter(s => s !== spec), `✓ "${spec}" removed.`);
  };

  const saveSpecs = async (list, msg) => {
    setSpecLoading(true);
    try {
      const res = await API.put("/master/specializations", list);
      setSpecs(res.data);
      flashMsg(setSpecMsg, msg);
    } catch (e) {
      alert("Failed to update specializations.");
    } finally {
      setSpecLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Master Data & Settings</h2>
          <p className="text-gray-600 mt-1">Configure hospital-wide settings used across the system.</p>
        </div>

        {/* ── Hospital Charge ── */}
        <Card title="🏥 Hospital Charge" subtitle="Added to every appointment bill on top of the doctor's channeling fee">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Current charge (Rs.)</label>
              <div className="flex gap-3 items-center">
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={chargeEdit}
                  onChange={(e) => setChargeEdit(e.target.value)}
                  className="w-48"
                />
                <Button onClick={saveCharge} disabled={chargeLoading}>
                  {chargeLoading ? "Saving..." : "Save"}
                </Button>
              </div>
              {chargeMsg && (
                <p className="text-emerald-600 text-sm mt-2 font-medium">{chargeMsg}</p>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
              <p className="font-semibold">Currently set to</p>
              <p className="text-2xl font-bold mt-1">Rs. {charge}</p>
            </div>
          </div>
        </Card>

        {/* ── Specializations ── */}
        <Card
          title="🩺 Doctor Specializations"
          subtitle="These appear as dropdown options when adding a new doctor"
        >
          {specMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2 rounded-lg">
              {specMsg}
            </div>
          )}

          {/* Add new */}
          <div className="flex gap-3 mb-6">
            <Input
              placeholder="New specialization name..."
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSpec()}
              className="flex-1"
            />
            <Button onClick={addSpec} disabled={specLoading || !newSpec.trim()}>
              + Add
            </Button>
          </div>

          {/* List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {specs.map((s) => (
              <div
                key={s}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-700">{s}</span>
                <button
                  onClick={() => removeSpec(s)}
                  className="text-red-400 hover:text-red-600 text-lg leading-none ml-3"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
            {specs.length === 0 && (
              <p className="text-gray-400 text-sm col-span-3 py-4">No specializations added yet.</p>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            {specs.length} specialization{specs.length !== 1 ? "s" : ""} · Click × to remove · Press Enter to add quickly
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default MasterData;
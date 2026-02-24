import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";
import Card from "../components/ui/Card";

function Stat({ label, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-sm text-gray-500">{label}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ patients: "—", doctors: "—", todayAppointments: "—", unpaidBills: "—" });

  const load = async () => {
    try {
      const [patientsRes, doctorsRes, todayRes, unpaidBillsRes] = await Promise.allSettled([
        API.get("/patients"),
        API.get("/doctors"),
        API.get("/appointments/today"),
        API.get("/bills/unpaid"),
      ]);

      setStats({
        patients: patientsRes.status === "fulfilled" ? patientsRes.value.data.length : "—",
        doctors: doctorsRes.status === "fulfilled" ? doctorsRes.value.data.length : "—",
        todayAppointments: todayRes.status === "fulfilled" ? todayRes.value.data.length : "—",
        unpaidBills: unpaidBillsRes.status === "fulfilled" ? unpaidBillsRes.value.data.length : "—",
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Hospital Dashboard 🏥</h2>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Stat label="Total Patients" value={stats.patients} />
          <Stat label="Total Doctors" value={stats.doctors} />
          <Stat label="Appointments Today" value={stats.todayAppointments} />
          <Stat label="Unpaid Bills" value={stats.unpaidBills} />
        </div>

        <Card title="Quick tips">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Receptionist: create patients, schedules, appointments.</li>
            <li>Cashier: manage bills and payments.</li>
            <li>Admin: full access + user management.</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;

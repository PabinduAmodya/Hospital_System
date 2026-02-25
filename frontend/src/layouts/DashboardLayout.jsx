import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 flex-1">
        <Navbar />

        <div className="p-6 bg-gray-100 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;

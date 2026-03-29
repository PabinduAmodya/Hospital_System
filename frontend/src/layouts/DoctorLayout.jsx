import DoctorSidebar from "../components/DoctorSidebar";
import Navbar from "../components/Navbar";

function DoctorLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorSidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default DoctorLayout;

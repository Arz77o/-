import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans" dir="rtl">
      {/* Universal Store Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Universal Store Footer */}
      <Footer />
    </div>
  );
}

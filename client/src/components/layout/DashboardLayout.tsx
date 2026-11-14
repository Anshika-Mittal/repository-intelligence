import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-area">
        <Header />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
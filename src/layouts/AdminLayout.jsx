import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/Admin.css";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
        <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      <main className={`admin-content ${collapsed ? "collapsed" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}

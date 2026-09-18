import { useState } from "react";
import { Outlet } from "react-router-dom";
import EditorSidebar from "../components/EditorSidebar";
import "../styles/Admin.css";

export default function EditorLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
        <EditorSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      <main className={`admin-content ${collapsed ? "collapsed" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}

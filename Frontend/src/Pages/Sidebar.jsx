import { NavLink } from "react-router-dom";
import api from "../api";
import { clearAuth, getRole, ROLE_PAGES } from "../auth";

const ALL_NAV = [
  { label: "Dashboard", icon: "📊", path: "/dashboard" },
  { label: "Deliveries", icon: "📦", path: "/deliveries" },
  { label: "History", icon: "🕐", path: "/history" },
  { label: "Admin", icon: "🛡", path: "/admin" },
];

export default function Sidebar() {
  const role = getRole();
  const allowed = ROLE_PAGES[role] || [];
  const navItems = ALL_NAV.filter((item) => allowed.includes(item.path));

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore network errors on logout
    }
    clearAuth();
    window.location.href = "/login";
  }

  return (
    <div className="w-40 min-h-screen bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-1 shadow-sm shrink-0">
      {role && (
        <div className="px-3 py-2 mb-1 text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
          {role}
        </div>
      )}

      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition font-medium
            ${
              isActive
                ? "bg-[#1e3a5f]/10 text-[#1e3a5f]"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`
          }
        >
          <span>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      <div className="mt-auto">
        <div
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 cursor-pointer transition font-medium"
        >
          <span>🚪</span> Logout
        </div>
      </div>
    </div>
  );
}

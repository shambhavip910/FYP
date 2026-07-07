import { useEffect, useState } from "react";
import logo from "../images/logo.png";
import Sidebar from "./Sidebar";
import api from "../api";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  async function fetchUsers() {
    const res = await api.get("/api/admin/users");
    setUsers(res.data.users);
  }

  async function fetchStats() {
    const res = await api.get("/api/admin/stats");
    setStats(res.data);
  }

  async function handleRoleUpdate(id, newRole) {
    await api.put(`/api/admin/user/${id}`, { role: newRole });
    fetchUsers();
  }

  async function handleDelete(id) {
    await api.delete(`/api/admin/user/${id}`);
    fetchUsers();
  }

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <div className="p-4">
        <Sidebar />
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl mb-4 shadow-sm">
          <div className="flex items-center gap-2">
            <img src={logo} alt="logo" className="w-7 h-7 object-contain" />
            <span className="text-[#1e3a5f] font-bold text-sm">
              Admin Panel
            </span>
          </div>

          <span className="text-xs px-2 py-1 rounded-md bg-[#1a9e75]/10 text-[#1a9e75] font-medium">
            System: Online
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Users", value: stats.totalUsers ?? "—" },
            { label: "Active Drivers", value: stats.driversCount ?? "—" },
            { label: "Managers", value: stats.managersCount ?? "—" },
            { label: "Admins", value: stats.adminsCount ?? "—" },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
            >
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="text-xl font-semibold text-[#1e3a5f]">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm overflow-x-auto">
          <h2 className="text-sm font-semibold text-[#1e3a5f] mb-4">
            👥 User Management
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b last:border-0 hover:bg-gray-50 transition"
                >
                  <td className="py-3 font-medium text-gray-800">
                    {user.fullname}
                  </td>

                  <td className="py-3 text-gray-500">{user.email}</td>

                  <td className="py-3">
                    <span className="bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-medium px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleUpdate(user._id, e.target.value)
                        }
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                      >
                        <option value="manager">Manager</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

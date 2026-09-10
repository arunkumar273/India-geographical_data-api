import { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get("/admin/users");

      setUsers(response.data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user) => {
    try {
      await api.patch(
        `/admin/users/${user.id}/status`,
        {
          isActive: !user.is_active,
        }
      );

      await loadUsers();
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to update user."
      );
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>User Management</h1>

            <p>
              Manage B2B accounts and platform users.
            </p>
          </div>
        </header>

        {error && (
          <div className="error-box page-error">
            {error}
          </div>
        )}

        <section className="dashboard-card table-card">
          {loading ? (
            <div className="empty-state">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              No users found.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <span className="badge badge-neutral">
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            user.is_active
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {user.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          user.created_at
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        <button
                          className={
                            user.is_active
                              ? "danger-btn"
                              : "success-btn"
                          }
                          onClick={() =>
                            toggleStatus(user)
                          }
                        >
                          {user.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Users;
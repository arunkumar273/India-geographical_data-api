import { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

function AdminApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const response = await api.get(
        "/admin/api-keys"
      );

      setKeys(response.data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to load API keys."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (key) => {
    try {
      const endpoint = key.is_active
        ? `/admin/api-keys/${key.id}/deactivate`
        : `/admin/api-keys/${key.id}/activate`;

      await api.patch(endpoint);

      await loadKeys();
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to update API key."
      );
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>API Key Management</h1>

            <p>
              Monitor and control customer API credentials.
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
              Loading API keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="empty-state">
              No API keys found.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Key Name</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id}>
                      <td>
                        <strong>{key.name}</strong>
                      </td>

                      <td>
                        {key.user?.email ||
                          key.user_email ||
                          "—"}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            key.is_active
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {key.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          key.created_at
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        {key.expires_at
                          ? new Date(
                              key.expires_at
                            ).toLocaleDateString()
                          : "Never"}
                      </td>

                      <td>
                        <button
                          className={
                            key.is_active
                              ? "danger-btn"
                              : "success-btn"
                          }
                          onClick={() =>
                            updateStatus(key)
                          }
                        >
                          {key.is_active
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

export default AdminApiKeys;
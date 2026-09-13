import { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

function AdminApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadKeys();
  }, []);

  // ============================================================
  // LOAD API KEYS
  // ============================================================

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/api-keys");

      setKeys(response.data.data || []);
    } catch (error) {
      console.error("Failed to load API keys:", error);

      setError(
        error.response?.data?.error?.message ||
          "Failed to load API keys."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CHECK EXPIRY
  // ============================================================

  const isExpired = (expiresAt) => {
    if (!expiresAt) {
      return false;
    }

    return new Date(expiresAt) < new Date();
  };

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const updateStatus = async (key) => {
    const action = key.is_active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} API key "${key.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(key.id);
      setError("");

      const endpoint = key.is_active
        ? `/admin/api-keys/${key.id}/deactivate`
        : `/admin/api-keys/${key.id}/activate`;

      await api.patch(endpoint);

      await loadKeys();
    } catch (error) {
      console.error(
        "Failed to update API key:",
        error
      );

      setError(
        error.response?.data?.error?.message ||
          "Failed to update API key."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // STATUS
  // ============================================================

  const getStatus = (key) => {
    if (key.expires_at && isExpired(key.expires_at)) {
      return {
        label: "Expired",
        className: "badge-warning",
      };
    }

    if (key.is_active) {
      return {
        label: "Active",
        className: "badge-success",
      };
    }

    return {
      label: "Inactive",
      className: "badge-danger",
    };
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="dashboard-header">
          <div>
            <h1>API Key Management</h1>

            <p>
              Monitor and control customer API credentials.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={loadKeys}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="error-box page-error">
            {error}
          </div>
        )}

        {/* ======================================================
            API KEY TABLE
        ====================================================== */}

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
                    <th>Business</th>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {keys.map((key) => {
                    const status = getStatus(key);

                    const businessName =
                      key.user?.businessName ||
                      key.business_name ||
                      "—";

                    const email =
                      key.user?.email ||
                      key.user_email ||
                      "—";

                    const plan =
                      key.user?.plan?.name ||
                      key.plan?.name ||
                      key.user?.plan?.code ||
                      key.plan?.code ||
                      "Free";

                    const expired =
                      key.expires_at &&
                      isExpired(key.expires_at);

                    const isLoading =
                      actionLoading === key.id;

                    return (
                      <tr key={key.id}>

                        {/* KEY NAME */}
                        <td>
                          <strong>
                            {key.name || "Unnamed Key"}
                          </strong>
                        </td>

                        {/* BUSINESS */}
                        <td>
                          {businessName}
                        </td>

                        {/* USER */}
                        <td>
                          {email}
                        </td>

                        {/* PLAN */}
                        <td>
                          <span className="badge badge-neutral">
                            {plan}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={`badge ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* CREATED */}
                        <td>
                          {key.created_at
                            ? new Date(
                                key.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* EXPIRES */}
                        <td>
                          {key.expires_at ? (
                            <span
                              style={{
                                color: expired
                                  ? "#dc2626"
                                  : "inherit",
                              }}
                            >
                              {new Date(
                                key.expires_at
                              ).toLocaleDateString()}
                            </span>
                          ) : (
                            "Never"
                          )}
                        </td>

                        {/* ACTION */}
                        <td>
                          {expired ? (
                            <span className="badge badge-warning">
                              Expired
                            </span>
                          ) : (
                            <button
                              className={
                                key.is_active
                                  ? "danger-btn"
                                  : "success-btn"
                              }
                              onClick={() =>
                                updateStatus(key)
                              }
                              disabled={isLoading}
                            >
                              {isLoading
                                ? "Processing..."
                                : key.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
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
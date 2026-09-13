import { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

function Users() {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError("");
      setLoading(true);

      const [usersResponse, plansResponse] = await Promise.all([
        api.get("/admin/users"),
        api.get("/plans"),
      ]);

      setUsers(usersResponse.data.data || []);
      setPlans(plansResponse.data.data || []);
    } catch (error) {
      console.error("Admin users loading failed:", error);

      /*
       * If the plans endpoint is not available yet,
       * users can still be loaded.
       */
      try {
        const usersResponse = await api.get("/admin/users");
        setUsers(usersResponse.data.data || []);
      } catch (userError) {
        setError(
          userError.response?.data?.error?.message ||
            "Failed to load users."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // APPROVE USER
  // ============================================================

  const approveUser = async (user) => {
    try {
      setActionLoading(`approve-${user.id}`);
      setError("");

      await api.patch(`/admin/users/${user.id}/approve`);

      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to approve user."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // REJECT USER
  // ============================================================

  const rejectUser = async (user) => {
    const reason = window.prompt(
      `Enter rejection reason for ${user.email}:`
    );

    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setActionLoading(`reject-${user.id}`);
      setError("");

      await api.patch(
        `/admin/users/${user.id}/reject`,
        {
          reason: reason.trim(),
        }
      );

      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to reject user."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // ACTIVATE / DEACTIVATE USER
  // ============================================================

  const toggleStatus = async (user) => {
    try {
      setActionLoading(`status-${user.id}`);
      setError("");

      await api.patch(
        `/admin/users/${user.id}/status`,
        {
          isActive: !user.isActive,
        }
      );

      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to update user."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // CHANGE PLAN
  // ============================================================

  const changePlan = async (user, planId) => {
    const numericPlanId = Number(planId);

    if (!numericPlanId || numericPlanId === Number(user.planId)) {
      return;
    }

    const selectedPlan = plans.find(
      (plan) => Number(plan.id) === numericPlanId
    );

    const confirmed = window.confirm(
      `Change ${user.email}'s plan to ${
        selectedPlan?.name || "the selected plan"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`plan-${user.id}`);
      setError("");

      await api.patch(
        `/admin/users/${user.id}/plan`,
        {
          planId: numericPlanId,
        }
      );

      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to update user plan."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // APPROVAL BADGE
  // ============================================================

  const getApprovalBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="badge badge-success">
            Approved
          </span>
        );

      case "REJECTED":
        return (
          <span className="badge badge-danger">
            Rejected
          </span>
        );

      case "PENDING_APPROVAL":
        return (
          <span className="badge badge-warning">
            Pending
          </span>
        );

      default:
        return (
          <span className="badge badge-neutral">
            Unknown
          </span>
        );
    }
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>User Management</h1>

            <p>
              Manage B2B accounts, approvals, status and plans.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
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
                    <th>Business</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Approval</th>
                    <th>Status</th>
                    <th>Plan</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const isPending =
                      user.approvalStatus ===
                      "PENDING_APPROVAL";

                    const isRejected =
                      user.approvalStatus === "REJECTED";

                    const isAdmin =
                      user.role === "ADMIN";

                    const isActionLoading =
                      actionLoading === `approve-${user.id}` ||
                      actionLoading === `reject-${user.id}` ||
                      actionLoading === `status-${user.id}`;

                    const isPlanLoading =
                      actionLoading === `plan-${user.id}`;

                    return (
                      <tr key={user.id}>
                        <td>
                          <strong>
                            {user.name || "—"}
                          </strong>
                        </td>

                        <td>
                          {user.businessName || "—"}
                        </td>

                        <td>
                          {user.email}
                        </td>

                        <td>
                          <span className="badge badge-neutral">
                            {user.role}
                          </span>
                        </td>

                        <td>
                          {getApprovalBadge(
                            user.approvalStatus
                          )}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              user.isActive
                                ? "badge-success"
                                : "badge-danger"
                            }`}
                          >
                            {user.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {isAdmin ? (
                            user.plan?.name || "—"
                          ) : (
                            <select
                              value={
                                user.planId ?? ""
                              }
                              onChange={(event) =>
                                changePlan(
                                  user,
                                  event.target.value
                                )
                              }
                              disabled={
                                isPlanLoading ||
                                isPending
                              }
                              style={{
                                minWidth: "130px",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                              }}
                            >
                              {plans.length === 0 ? (
                                <option value="">
                                  {user.plan?.name ||
                                    "Current Plan"}
                                </option>
                              ) : (
                                plans.map((plan) => (
                                  <option
                                    key={plan.id}
                                    value={plan.id}
                                  >
                                    {plan.name}
                                  </option>
                                ))
                              )}
                            </select>
                          )}
                        </td>

                        <td>
                          {user.createdAt
                            ? new Date(
                                user.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td>
                          {isPending ? (
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                className="success-btn"
                                onClick={() =>
                                  approveUser(user)
                                }
                                disabled={
                                  isActionLoading
                                }
                              >
                                {actionLoading ===
                                `approve-${user.id}`
                                  ? "Processing..."
                                  : "Approve"}
                              </button>

                              <button
                                className="danger-btn"
                                onClick={() =>
                                  rejectUser(user)
                                }
                                disabled={
                                  isActionLoading
                                }
                              >
                                {actionLoading ===
                                `reject-${user.id}`
                                  ? "Processing..."
                                  : "Reject"}
                              </button>
                            </div>
                          ) : isAdmin ? (
                            <span className="badge badge-neutral">
                              Admin
                            </span>
                          ) : (
                            <div>
                              <button
                                className={
                                  user.isActive
                                    ? "danger-btn"
                                    : "success-btn"
                                }
                                onClick={() =>
                                  toggleStatus(user)
                                }
                                disabled={
                                  isActionLoading ||
                                  isRejected
                                }
                              >
                                {actionLoading ===
                                `status-${user.id}`
                                  ? "Processing..."
                                  : user.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              {isRejected &&
                                user.rejectionReason && (
                                  <div
                                    style={{
                                      marginTop: "6px",
                                      fontSize: "12px",
                                      color: "#6b7280",
                                      maxWidth: "220px",
                                    }}
                                  >
                                    Reason:{" "}
                                    {
                                      user.rejectionReason
                                    }
                                  </div>
                                )}
                            </div>
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

export default Users;
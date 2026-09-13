import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [endpointData, setEndpointData] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [overviewResponse, endpointsResponse, usersResponse] =
        await Promise.all([
          api.get("/admin/analytics/overview"),
          api.get("/admin/analytics/endpoints"),
          api.get("/admin/users"),
        ]);

      setOverview(
        overviewResponse.data.data ||
          overviewResponse.data
      );

      setEndpointData(
        endpointsResponse.data.data || []
      );

      setUsers(
        usersResponse.data.data || []
      );
    } catch (error) {
      console.error("Admin dashboard error:", error);

      setError(
        error.response?.data?.error?.message ||
          "Failed to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // USER STATISTICS
  // ============================================================

  const b2bUsers = users.filter(
    (user) => user.role === "B2B"
  );

  const pendingUsers = b2bUsers.filter(
    (user) =>
      user.approvalStatus === "PENDING_APPROVAL"
  );

  const approvedUsers = b2bUsers.filter(
    (user) =>
      user.approvalStatus === "APPROVED"
  );

  const activeUsers = b2bUsers.filter(
    (user) => user.isActive
  );

  // ============================================================
  // API STATISTICS
  // ============================================================

  const totalRequests =
    overview?.totalRequests ?? 0;

  const successfulRequests =
    overview?.successfulRequests ?? 0;

  const failedRequests =
    overview?.failedRequests ?? 0;

  const successRate =
    overview?.successRate ?? 0;

  const averageResponseTime =
    overview?.averageResponseTimeMs ??
    overview?.averageResponseTime ??
    0;

  const activeApiKeys =
    overview?.activeApiKeys ?? 0;

  // ============================================================
  // ENDPOINT CHART DATA
  // ============================================================

  const chartData = endpointData.map((item) => ({
    endpoint:
      item.endpoint?.length > 30
        ? `${item.endpoint.substring(0, 30)}...`
        : item.endpoint,

    requests:
      Number(item.totalRequests) || 0,

    successful:
      Number(item.successfulRequests) || 0,

    failed:
      Number(item.failedRequests) || 0,
  }));

  // ============================================================
  // FORMAT NUMBER
  // ============================================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
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
            <h1>Admin Dashboard</h1>

            <p>
              Monitor users, API usage and platform
              performance.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={loadDashboard}
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

        {loading ? (
          <div className="dashboard-card empty-state">
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* ==================================================
                USER MANAGEMENT
            ================================================== */}

            <section>
              <h2
                style={{
                  marginBottom: "16px",
                }}
              >
                User Management
              </h2>

              <div className="stats-grid">

                <StatCard
                  title="Total B2B Users"
                  value={formatNumber(
                    b2bUsers.length
                  )}
                />

                <StatCard
                  title="Pending Approvals"
                  value={formatNumber(
                    pendingUsers.length
                  )}
                />

                <StatCard
                  title="Approved Users"
                  value={formatNumber(
                    approvedUsers.length
                  )}
                />

                <StatCard
                  title="Active Users"
                  value={formatNumber(
                    activeUsers.length
                  )}
                />

              </div>
            </section>

            {/* ==================================================
                API OVERVIEW
            ================================================== */}

            <section
              style={{
                marginTop: "32px",
              }}
            >
              <h2
                style={{
                  marginBottom: "16px",
                }}
              >
                API Overview
              </h2>

              <div className="stats-grid">

                <StatCard
                  title="Total Requests"
                  value={formatNumber(
                    totalRequests
                  )}
                />

                <StatCard
                  title="Successful Requests"
                  value={formatNumber(
                    successfulRequests
                  )}
                />

                <StatCard
                  title="Failed Requests"
                  value={formatNumber(
                    failedRequests
                  )}
                />

                <StatCard
                  title="Success Rate"
                  value={`${Number(
                    successRate
                  ).toFixed(2)}%`}
                />

              </div>
            </section>

            {/* ==================================================
                PERFORMANCE
            ================================================== */}

            <section
              style={{
                marginTop: "32px",
              }}
            >
              <h2
                style={{
                  marginBottom: "16px",
                }}
              >
                Platform Performance
              </h2>

              <div className="stats-grid">

                <StatCard
                  title="Active API Keys"
                  value={formatNumber(
                    activeApiKeys
                  )}
                />

                <StatCard
                  title="Average Response Time"
                  value={`${Number(
                    averageResponseTime
                  ).toFixed(2)} ms`}
                />

                <StatCard
                  title="Fastest Response"
                  value={`${Number(
                    overview?.fastestResponseTimeMs ??
                      0
                  ).toFixed(2)} ms`}
                />

                <StatCard
                  title="Slowest Response"
                  value={`${Number(
                    overview?.slowestResponseTimeMs ??
                      0
                  ).toFixed(2)} ms`}
                />

              </div>
            </section>

            {/* ==================================================
                ENDPOINT PERFORMANCE
            ================================================== */}

            <section
              className="dashboard-card"
              style={{
                marginTop: "32px",
              }}
            >
              <div
                style={{
                  marginBottom: "20px",
                }}
              >
                <h2>API Endpoint Performance</h2>

                <p
                  style={{
                    marginTop: "6px",
                    color: "#6b7280",
                  }}
                >
                  Request volume across API endpoints.
                </p>
              </div>

              {chartData.length === 0 ? (
                <div className="empty-state">
                  No API usage data available yet.
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "380px",
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 70,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="endpoint"
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />

                      <YAxis />

                      <Tooltip />

                      <Bar
                        dataKey="requests"
                        name="Requests"
                      />

                      <Bar
                        dataKey="successful"
                        name="Successful"
                      />

                      <Bar
                        dataKey="failed"
                        name="Failed"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* ==================================================
                DATA FOUNDATION
            ================================================== */}

            <section
              className="dashboard-card"
              style={{
                marginTop: "32px",
              }}
            >
              <h2>India Geographical Data</h2>

              <p
                style={{
                  marginTop: "6px",
                  color: "#6b7280",
                }}
              >
                Current geographical data available
                through the platform.
              </p>

              <div
                className="stats-grid"
                style={{
                  marginTop: "20px",
                }}
              >
                <StatCard
                  title="States / UTs"
                  value="30"
                />

                <StatCard
                  title="Districts"
                  value="586"
                />

                <StatCard
                  title="Sub-Districts"
                  value="5,764"
                />

                <StatCard
                  title="Villages"
                  value="619,245"
                />
              </div>
            </section>

            {/* ==================================================
                QUICK ACTIONS
            ================================================== */}

            <section
              className="dashboard-card"
              style={{
                marginTop: "32px",
              }}
            >
              <h2>Admin Quick Actions</h2>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "20px",
                }}
              >
                <button
                  className="secondary-btn"
                  onClick={() =>
                    (window.location.href =
                      "/admin/users")
                  }
                >
                  Manage Users
                </button>

                <button
                  className="secondary-btn"
                  onClick={() =>
                    (window.location.href =
                      "/admin/api-keys")
                  }
                >
                  Manage API Keys
                </button>

                <button
                  className="secondary-btn"
                  onClick={() =>
                    (window.location.href =
                      "/admin/state-access")
                  }
                >
                  Manage State Access
                </button>

                <button
                  className="secondary-btn"
                  onClick={() =>
                    (window.location.href =
                      "/admin/analytics")
                  }
                >
                  View Analytics
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [recent, setRecent] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [overviewResponse, recentResponse, endpointsResponse] =
        await Promise.all([
          api.get("/admin/analytics/overview"),
          api.get("/admin/analytics/recent"),
          api.get("/admin/analytics/endpoints"),
        ]);

      setOverview(overviewResponse.data?.data || null);
      setRecent(recentResponse.data?.data || []);
      setEndpoints(endpointsResponse.data?.data || []);
    } catch (err) {
      console.error("Failed to load admin analytics:", err);
      setError(
        err.response?.data?.error?.message ||
          "Failed to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  const formatMilliseconds = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    return `${Number(value).toFixed(2)} ms`;
  };

  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return "status-success";
    if (status >= 400 && status < 500) return "status-warning";
    if (status >= 500) return "status-danger";

    return "status-neutral";
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Sidebar />

        <main className="dashboard-main">
          <div className="page-header">
            <div>
              <h1>Admin Analytics</h1>
              <p>Monitor API usage and platform performance.</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div style={{ padding: "40px", textAlign: "center" }}>
              Loading analytics...
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <Sidebar />

        <main className="dashboard-main">
          <div className="page-header">
            <div>
              <h1>Admin Analytics</h1>
              <p>Monitor API usage and platform performance.</p>
            </div>

            <button className="primary-btn" onClick={loadAnalytics}>
              Retry
            </button>
          </div>

          <div className="dashboard-card">
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const totalRequests = overview?.totalRequests || 0;
  const successfulRequests = overview?.successfulRequests || 0;
  const failedRequests = overview?.failedRequests || 0;
  const successRate = overview?.successRate || 0;

  const endpointChartData = endpoints.map((item) => ({
    endpoint: item.endpoint,
    requests: Number(item.requests || item.requestCount || 0),
    averageResponseTime: Number(
      item.averageResponseTime || item.avgResponseTime || 0
    ),
  }));

  const recentChartData = recent
    .slice()
    .reverse()
    .map((item, index) => ({
      request: index + 1,
      responseTime: Number(item.response_time || 0),
    }));

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="dashboard-main">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <h1>Admin Analytics</h1>
            <p>
              Monitor API usage, requests, users and platform performance.
            </p>
          </div>

          <button className="primary-btn" onClick={loadAnalytics}>
            Refresh Data
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <section className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-card-icon">⌁</div>

            <div>
              <p>Total Requests</p>
              <h2>{formatNumber(totalRequests)}</h2>
              <small>All API requests</small>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-card-icon">✓</div>

            <div>
              <p>Successful Requests</p>
              <h2>{formatNumber(successfulRequests)}</h2>
              <small>2xx responses</small>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-card-icon">!</div>

            <div>
              <p>Failed Requests</p>
              <h2>{formatNumber(failedRequests)}</h2>
              <small>4xx / 5xx responses</small>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-card-icon">%</div>

            <div>
              <p>Success Rate</p>
              <h2>{Number(successRate).toFixed(2)}%</h2>
              <small>Overall API health</small>
            </div>
          </div>
        </section>

        {/* SECONDARY STATS */}
        <section className="stats-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Active Users</h2>
              <p>Users currently using the platform.</p>
            </div>

            <h2 style={{ fontSize: "30px", marginTop: "10px" }}>
              {formatNumber(overview?.activeUsers)}
            </h2>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2>Active API Keys</h2>
              <p>Currently active API credentials.</p>
            </div>

            <h2 style={{ fontSize: "30px", marginTop: "10px" }}>
              {formatNumber(overview?.activeKeys)}
            </h2>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2>Average Response</h2>
              <p>Average API response time.</p>
            </div>

            <h2 style={{ fontSize: "30px", marginTop: "10px" }}>
              {formatMilliseconds(overview?.averageResponseTime)}
            </h2>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2>Maximum Response</h2>
              <p>Highest recorded response time.</p>
            </div>

            <h2 style={{ fontSize: "30px", marginTop: "10px" }}>
              {formatMilliseconds(overview?.maxResponseTime)}
            </h2>
          </div>
        </section>

        {/* REQUEST SUMMARY */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>Request Overview</h2>
            <p>Successful versus failed API requests.</p>
          </div>

          <div
            style={{
              width: "100%",
              height: "320px",
              marginTop: "20px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "API Requests",
                    Successful: successfulRequests,
                    Failed: failedRequests,
                  },
                ]}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="Successful"
                  fill="#16a34a"
                  barSize={40}
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  dataKey="Failed"
                  fill="#dc2626"
                  barSize={40}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ENDPOINT ANALYTICS */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>Endpoint Usage</h2>
            <p>API request volume by endpoint.</p>
          </div>

          <div
            style={{
              width: "100%",
              height: "320px",
              marginTop: "20px",
            }}
          >
            {endpointChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={endpointChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 50,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="endpoint"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="requests"
                    name="Requests"
                    fill="#2563eb"
                    barSize={24}
                    maxBarSize={24}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                }}
              >
                No endpoint data available.
              </div>
            )}
          </div>
        </section>

        {/* RESPONSE TIME */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>Recent Response Times</h2>
            <p>Response time for recent API requests.</p>
          </div>

          <div
            style={{
              width: "100%",
              height: "300px",
              marginTop: "20px",
            }}
          >
            {recentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={recentChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="request"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: "ms",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(2)} ms`,
                      "Response Time",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                }}
              >
                No recent response-time data available.
              </div>
            )}
          </div>
        </section>

        {/* RECENT REQUESTS TABLE */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2>Recent API Requests</h2>
            <p>Latest requests made through the platform.</p>
          </div>

          <div className="table-wrapper">
            {recent.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>IP Address</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recent.map((request, index) => (
                    <tr key={request.id || index}>
                      <td>
                        <code>{request.endpoint || "—"}</code>
                      </td>

                      <td>
                        <strong>{request.method || "—"}</strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            request.status_code
                          )}`}
                        >
                          {request.status_code || "—"}
                        </span>
                      </td>

                      <td>
                        {formatMilliseconds(request.response_time)}
                      </td>

                      <td>{request.ip_address || "—"}</td>

                      <td>{formatDateTime(request.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No API requests found.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminAnalytics;
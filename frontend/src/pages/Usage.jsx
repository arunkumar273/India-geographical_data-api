import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function Usage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/usage");

      if (response.data?.success) {
        setUsage(response.data.data);
      } else {
        setUsage(null);
        setError("Failed to load API usage.");
      }
    } catch (err) {
      console.error("Failed to load API usage:", err);

      setUsage(null);
      setError(
        err.response?.data?.error?.message ||
          "Failed to load API usage."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     DATA
  ===================================================== */

  const summary = usage?.summary || {
    todayRequests: 0,
    monthRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successPercentage: 0,
    averageResponseTime: 0,
  };

  const dailyUsage = usage?.dailyUsage || [];
  const recentRequests = usage?.recentRequests || [];

  /* =====================================================
     CHART DATA
  ===================================================== */

  const chartData = dailyUsage.map((item) => ({
    date: item.date,
    successful: Number(item.successful || 0),
    failed: Number(item.failed || 0),
  }));

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =====================================================
     STATUS BADGE
  ===================================================== */

  const getStatusClass = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "badge badge-success";
    }

    if (statusCode >= 400 && statusCode < 500) {
      return "badge badge-warning";
    }

    if (statusCode >= 500) {
      return "badge badge-danger";
    }

    return "badge badge-info";
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="app-body">
        <Sidebar />

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Usage & Analytics</h1>
              <p>
                Monitor API usage, response times and request status.
              </p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="loading">
              Loading API usage...
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="app-body">
        <Sidebar />

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1>Usage & Analytics</h1>
              <p>
                Monitor API usage, response times and request status.
              </p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="empty-state">
              <h3>Unable to load usage data</h3>

              <p>{error}</p>

              <button
                className="primary-btn"
                onClick={loadUsage}
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <div className="app-body">
      <Sidebar />

      <main className="main-content">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <header className="page-header">
          <div>
            <h1>Usage & Analytics</h1>

            <p>
              Monitor API usage, response times and request status.
            </p>
          </div>

          <div className="header-status">
            <span className="status-dot"></span>
            API Operational
          </div>
        </header>


        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="usage-summary">

          {/* Today Requests */}

          <div className="stat-card">
            <div className="stat-card-icon">
              ↗
            </div>

            <div>
              <p>Today's Requests</p>

              <h2>
                {summary.todayRequests}
              </h2>

              <small>
                Current day
              </small>
            </div>
          </div>


          {/* Successful */}

          <div className="stat-card">
            <div className="stat-card-icon">
              ✓
            </div>

            <div>
              <p>Successful</p>

              <h2>
                {summary.successfulRequests}
              </h2>

              <small>
                Last 24 hours
              </small>
            </div>
          </div>


          {/* Failed */}

          <div className="stat-card">
            <div className="stat-card-icon">
              ×
            </div>

            <div>
              <p>Failed</p>

              <h2>
                {summary.failedRequests}
              </h2>

              <small>
                Last 24 hours
              </small>
            </div>
          </div>


          {/* Average Response */}

          <div className="stat-card">
            <div className="stat-card-icon">
              ◷
            </div>

            <div>
              <p>Avg Response</p>

              <h2>
                {summary.averageResponseTime} ms
              </h2>

              <small>
                Last 24 hours
              </small>
            </div>
          </div>

        </section>


        {/* =================================================
            SECONDARY SUMMARY
        ================================================= */}

        <section className="dashboard-grid">

          <div className="dashboard-card">
            <div className="card-header">
              <h2>API Performance</h2>

              <p>
                Current API request performance.
              </p>
            </div>

            <div className="hierarchy">

              <div className="hierarchy-item">
                <span className="hierarchy-icon">
                  ✓
                </span>

                <div>
                  <strong>
                    {summary.successPercentage}%
                  </strong>

                  <small>
                    Success rate
                  </small>
                </div>
              </div>

              <div className="hierarchy-line"></div>

              <div className="hierarchy-item">
                <span className="hierarchy-icon">
                  ◷
                </span>

                <div>
                  <strong>
                    {summary.averageResponseTime} ms
                  </strong>

                  <small>
                    Average response time
                  </small>
                </div>
              </div>

              <div className="hierarchy-line"></div>

              <div className="hierarchy-item">
                <span className="hierarchy-icon">
                  ↗
                </span>

                <div>
                  <strong>
                    {summary.monthRequests}
                  </strong>

                  <small>
                    Requests this month
                  </small>
                </div>
              </div>

            </div>
          </div>


          <div className="dashboard-card">
            <div className="card-header">
              <h2>Usage Overview</h2>

              <p>
                Your API activity for the current period.
              </p>
            </div>

            <div className="quick-step">
              <span>1</span>

              <div>
                <strong>
                  Today
                </strong>

                <small>
                  {summary.todayRequests} API requests
                </small>
              </div>
            </div>

            <div className="quick-step">
              <span>2</span>

              <div>
                <strong>
                  This Month
                </strong>

                <small>
                  {summary.monthRequests} API requests
                </small>
              </div>
            </div>

            <div className="quick-step">
              <span>3</span>

              <div>
                <strong>
                  Success Rate
                </strong>

                <small>
                  {summary.successPercentage}% successful
                </small>
              </div>
            </div>
          </div>

        </section>


        {/* =================================================
            BAR CHART
        ================================================= */}

        <section className="chart-card">

          <div className="card-header">
            <h2>
              API Requests — Last 30 Days
            </h2>

            <p>
              Daily successful and failed API requests.
            </p>
          </div>


          <div className="chart-container">

            {chartData.length === 0 ? (

              <div className="empty-state">
                No API usage data available yet.
              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                  barCategoryGap="45%"
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                    labelFormatter={(value) => {
                      const date = new Date(value);

                      if (Number.isNaN(date.getTime())) {
                        return value;
                      }

                      return date.toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      );
                    }}
                  />

                  <Legend />

                  <Bar
                    dataKey="successful"
                    name="Successful"
                    stackId="requests"
                    fill="#16a34a"
                    barSize={24}
                    maxBarSize={24}
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="failed"
                    name="Failed"
                    stackId="requests"
                    fill="#dc2626"
                    barSize={24}
                    maxBarSize={24}
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            )}

          </div>

        </section>


        {/* =================================================
            RECENT REQUESTS
        ================================================= */}

        <section className="table-card">

          <div className="card-header" style={{ padding: "24px 24px 0" }}>
            <h2>
              Recent API Requests
            </h2>

            <p>
              Your latest API activity.
            </p>
          </div>


          <div className="table-wrapper">

            {recentRequests.length === 0 ? (

              <div className="empty-state">
                No API requests recorded yet.
              </div>

            ) : (

              <table>

                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Time</th>
                  </tr>
                </thead>


                <tbody>

                  {recentRequests.map((request, index) => (

                    <tr key={request.id || index}>

                      <td>
                        <code>
                          {request.endpoint}
                        </code>
                      </td>

                      <td>
                        {request.method}
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            request.status_code
                          )}
                        >
                          {request.status_code}
                        </span>
                      </td>

                      <td>
                        {request.response_time !== null &&
                        request.response_time !== undefined
                          ? `${Number(
                              request.response_time
                            ).toFixed(2)} ms`
                          : "—"}
                      </td>

                      <td>
                        {formatDateTime(
                          request.created_at
                        )}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </main>
    </div>
  );
}

export default Usage;
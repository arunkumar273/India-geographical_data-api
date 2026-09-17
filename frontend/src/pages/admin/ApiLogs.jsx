import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

function ApiLogs() {
  const [logs, setLogs] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    endpoints: [],
    users: [],
  });

  const [status, setStatus] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("");
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFilters = async () => {
    try {
      setFiltersLoading(true);

      const response = await api.get("/admin/logs/filters");

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message ||
            "Failed to load filters"
        );
      }

      setFilters({
        endpoints: response.data.data.endpoints || [],
        users: response.data.data.users || [],
      });
    } catch (err) {
      console.error("API Log filters error:", err);

      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to load filters"
      );
    } finally {
      setFiltersLoading(false);
    }
  };

  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.append("page", page);
      params.append("limit", 50);

      if (status) {
        params.append("status", status);
      }

      if (endpoint) {
        params.append("endpoint", endpoint);
      }

      if (method) {
        params.append("method", method);
      }

      if (userId) {
        params.append("userId", userId);
      }

      const response = await api.get(
        `/admin/logs?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message ||
            "Failed to load API logs"
        );
      }

      setLogs(response.data.data.logs || []);

      setPagination(
        response.data.data.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      console.error("API Logs error:", err);

      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to load API logs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
    loadLogs(1);
  }, []);

  const handleSearch = () => {
    loadLogs(1);
  };

  const handleClear = () => {
    setStatus("");
    setEndpoint("");
    setMethod("");
    setUserId("");

    loadLogs(1);
  };

  const handleRefresh = async () => {
    await loadFilters();
    await loadLogs(pagination.page);
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString();
  };

  const getStatusClass = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "status-success";
    }

    if (statusCode >= 400 && statusCode < 500) {
      return "status-warning";
    }

    if (statusCode >= 500) {
      return "status-error";
    }

    return "";
  };

  const successfulCount = logs.filter(
    (log) =>
      log.statusCode >= 200 &&
      log.statusCode < 300
  ).length;

  const failedCount = logs.filter(
    (log) => log.statusCode >= 400
  ).length;

  const averageResponseTime = logs.length
    ? logs.reduce(
        (sum, log) =>
          sum + Number(log.responseTimeMs || 0),
        0
      ) / logs.length
    : 0;

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>API Logs</h1>
            <p>
              Monitor API requests, clients and performance
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="error-box page-error">
            {error}
          </div>
        )}

        {/* Summary */}
        <section className="stats-grid">
          <div className="dashboard-card">
            <h3>Total Requests</h3>
            <div className="stat-value">
              {pagination.total.toLocaleString()}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Successful</h3>
            <div className="stat-value">
              {successfulCount}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Failed</h3>
            <div className="stat-value">
              {failedCount}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Avg Response Time</h3>
            <div className="stat-value">
              {averageResponseTime.toFixed(2)} ms
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="dashboard-card">
          <h2>Filters</h2>

          <div className="filters-row">
            {/* Endpoint */}
            <select
              value={endpoint}
              onChange={(e) =>
                setEndpoint(e.target.value)
              }
              disabled={filtersLoading}
            >
              <option value="">
                {filtersLoading
                  ? "Loading endpoints..."
                  : "All Endpoints"}
              </option>

              {filters.endpoints.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            {/* Client/User */}
            <select
              value={userId}
              onChange={(e) =>
                setUserId(e.target.value)
              }
              disabled={filtersLoading}
            >
              <option value="">
                {filtersLoading
                  ? "Loading clients..."
                  : "All Clients"}
              </option>

              {filters.users.map(
                (user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.businessName
                      ? `${user.businessName} — ${user.email}`
                      : user.email}
                  </option>
                )
              )}
            </select>

            {/* Method */}
            <select
              value={method}
              onChange={(e) =>
                setMethod(e.target.value)
              }
            >
              <option value="">
                All Methods
              </option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">
                DELETE
              </option>
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option value="">
                All Statuses
              </option>
              <option value="200">200</option>
              <option value="201">201</option>
              <option value="400">400</option>
              <option value="401">401</option>
              <option value="403">403</option>
              <option value="404">404</option>
              <option value="429">429</option>
              <option value="500">500</option>
            </select>

            <button
              className="primary-btn"
              onClick={handleSearch}
            >
              Search
            </button>

            <button
              className="secondary-btn"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </section>

        {/* Logs */}
        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Request Logs</h2>
              <p>
                Showing {logs.length} of{" "}
                {pagination.total.toLocaleString()} requests
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              Loading API logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              No API logs found.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Client</th>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>IP Address</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        {formatDate(log.timestamp)}
                      </td>

                      <td>
                        <div>
                          <strong>
                            {log.client?.businessName ||
                              "B2B Client"}
                          </strong>
                          <br />

                          <small>
                            {log.client?.email || "-"}
                          </small>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {log.method}
                        </strong>
                      </td>

                      <td>
                        <code>
                          {log.endpoint}
                        </code>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            log.statusCode
                          )}`}
                        >
                          {log.statusCode}
                        </span>
                      </td>

                      <td>
                        {log.responseTimeMs != null
                          ? `${Number(
                              log.responseTimeMs
                            ).toFixed(2)} ms`
                          : "-"}
                      </td>

                      <td>
                        {log.ipAddress || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading &&
            pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="secondary-btn"
                  disabled={
                    pagination.page <= 1
                  }
                  onClick={() =>
                    loadLogs(
                      pagination.page - 1
                    )
                  }
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of{" "}
                  {pagination.totalPages}
                </span>

                <button
                  className="secondary-btn"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    loadLogs(
                      pagination.page + 1
                    )
                  }
                >
                  Next
                </button>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default ApiLogs;
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [overviewResponse, endpointResponse] =
        await Promise.all([
          api.get("/admin/analytics/overview"),
          api.get("/admin/analytics/endpoints"),
        ]);

      setOverview(
        overviewResponse.data.data
      );

      setEndpoints(
        endpointResponse.data.data || []
      );
    } catch (error) {
      console.error(
        "Analytics loading failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>

            <p>
              Platform overview and API analytics.
            </p>
          </div>

          <div className="header-status">
            <span className="status-dot"></span>
            System Operational
          </div>
        </header>

        <section className="stats-grid">
          <StatCard
            icon="⌁"
            title="Total Requests"
            value={
              loading
                ? "..."
                : overview?.totalRequests ?? 0
            }
            type="blue"
          />

          <StatCard
            icon="✓"
            title="Successful Requests"
            value={
              loading
                ? "..."
                : overview?.successfulRequests ?? 0
            }
            type="green"
          />

          <StatCard
            icon="!"
            title="Failed Requests"
            value={
              loading
                ? "..."
                : overview?.failedRequests ?? 0
            }
            type="orange"
          />

          <StatCard
            icon="⚡"
            title="Average Response"
            value={
              loading
                ? "..."
                : overview?.averageResponseTime
                  ? `${Number(
                      overview.averageResponseTime
                    ).toFixed(2)} ms`
                  : "—"
            }
            type="purple"
          />
        </section>

        <section className="dashboard-card chart-card">
          <div className="card-header">
            <h2>Endpoint Performance</h2>

            <p>
              API requests grouped by endpoint.
            </p>
          </div>

          {endpoints.length === 0 ? (
            <div className="empty-state">
              No API analytics available yet.
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart data={endpoints}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="endpoint"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="requests"
                    name="Requests"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Platform Architecture</h2>

            <div className="architecture-list">
              <div>
                <span>Database</span>
                <strong>Neon PostgreSQL</strong>
              </div>

              <div>
                <span>ORM</span>
                <strong>Prisma</strong>
              </div>

              <div>
                <span>Cache</span>
                <strong>Upstash Redis</strong>
              </div>

              <div>
                <span>API</span>
                <strong>Node.js + Express</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Data Scale</h2>

            <div className="architecture-list">
              <div>
                <span>States</span>
                <strong>30</strong>
              </div>

              <div>
                <span>Districts</span>
                <strong>586</strong>
              </div>

              <div>
                <span>Sub-Districts</span>
                <strong>5,764</strong>
              </div>

              <div>
                <span>Villages</span>
                <strong>619,245</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
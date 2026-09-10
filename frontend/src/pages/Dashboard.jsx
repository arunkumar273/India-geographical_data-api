import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to read stored user:", error);
      }
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Dashboard endpoint uses JWT authentication
      const response = await api.get("/dashboard/states");

      setStates(response.data.data || []);
    } catch (error) {
      console.error("Failed to load dashboard states:", error);
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>

            <p>
              Welcome back,{" "}
              {user?.name?.split(" ")[0] || "Developer"}.
              Here's your API overview.
            </p>
          </div>

          <div className="header-status">
            <span className="status-dot"></span>
            API Operational
          </div>
        </header>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card blue">
            <div className="stat-card-icon">▦</div>

            <div>
              <p>Accessible States</p>

              <h2>
                {loading ? "..." : states.length}
              </h2>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-card-icon">⌁</div>

            <div>
              <p>API Requests</p>
              <h2>0</h2>
              <small>Current period</small>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-card-icon">✓</div>

            <div>
              <p>Success Rate</p>
              <h2>100%</h2>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-card-icon">⚡</div>

            <div>
              <p>Avg Response</p>
              <h2>—</h2>
              <small>Milliseconds</small>
            </div>
          </div>

        </section>

        {/* Main dashboard */}
        <section className="dashboard-grid">

          {/* Geography */}
          <div className="dashboard-card">

            <div className="card-header">
              <h2>India Geographical Data</h2>

              <p>
                Your accessible geographical hierarchy.
              </p>
            </div>

            <div className="hierarchy">

              <div className="hierarchy-item">
                <span className="hierarchy-icon">
                  🌐
                </span>

                <div>
                  <strong>India</strong>
                  <small>Country</small>
                </div>
              </div>

              <div className="hierarchy-line"></div>

              <div className="hierarchy-item">
                <span className="hierarchy-icon">
                  ▣
                </span>

                <div>
                  <strong>
                    {loading
                      ? "Loading..."
                      : `${states.length} States`}
                  </strong>

                  <small>
                    Available to your account
                  </small>
                </div>
              </div>

              <div className="hierarchy-line"></div>

              <div className="hierarchy-item">
                <span className="hierarchy-icon">
                  ⌂
                </span>

                <div>
                  <strong>Village Data</strong>

                  <small>
                    Search and autocomplete
                  </small>
                </div>
              </div>

            </div>

            <button
              className="secondary-btn"
              onClick={() => navigate("/state-access")}
            >
              Manage State Access →
            </button>

          </div>

          {/* Quick Start */}
          <div className="dashboard-card quick-card">

            <h2>Quick Start</h2>

            <p>
              Integrate India's village-level
              geographical data into your application.
            </p>

            <div className="quick-step">
              <span>1</span>

              <div>
                <strong>Create an API Key</strong>

                <small>
                  Generate secure API credentials.
                </small>
              </div>
            </div>

            <div className="quick-step">
              <span>2</span>

              <div>
                <strong>Select States</strong>

                <small>
                  Choose the geographical data you need.
                </small>
              </div>
            </div>

            <div className="quick-step">
              <span>3</span>

              <div>
                <strong>Make an API Request</strong>

                <small>
                  Use your credentials with the REST API.
                </small>
              </div>
            </div>

            <button
              className="primary-btn"
              onClick={() => navigate("/api-keys")}
            >
              Get Started →
            </button>

          </div>

        </section>

        {/* API information */}
        <section className="dashboard-card api-info">

          <div>
            <h2>API Base URL</h2>

            <p>
              Use this URL when developing locally.
            </p>
          </div>

          <code>
            http://localhost:3000/v1
          </code>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;
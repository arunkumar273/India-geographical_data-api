import { useEffect, useState } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

function AdminStateAccess() {
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [userStates, setUserStates] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserStates(selectedUser);
    } else {
      setUserStates([]);
    }
  }, [selectedUser]);

  const loadInitialData = async () => {
    try {
      const [usersResponse, statesResponse] =
        await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/states"),
        ]);

      setUsers(usersResponse.data.data || []);
      setStates(statesResponse.data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to load admin data."
      );
    }
  };

  const loadUserStates = async (userId) => {
    try {
      const response = await api.get(
        `/admin/users/${userId}/states`
      );

      setUserStates(response.data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to load user state access."
      );
    }
  };

  const assignState = async () => {
    if (!selectedUser || !selectedState) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post(
        `/admin/users/${selectedUser}/states`,
        {
          stateId: Number(selectedState),
        }
      );

      setSelectedState("");

      await loadUserStates(selectedUser);
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to assign state."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeState = async (stateId) => {
    try {
      await api.delete(
        `/admin/users/${selectedUser}/states/${stateId}`
      );

      await loadUserStates(selectedUser);
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to remove state."
      );
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>State Access Management</h1>

            <p>
              Assign geographical access to B2B users.
            </p>
          </div>
        </header>

        {error && (
          <div className="error-box page-error">
            {error}
          </div>
        )}

        <section className="dashboard-card">
          <h2>Assign State Access</h2>

          <p className="section-description">
            Select a B2B user and give them access to a
            specific state.
          </p>

          <div className="access-form">
            <select
              value={selectedUser}
              onChange={(e) =>
                setSelectedUser(e.target.value)
              }
            >
              <option value="">
                Select User
              </option>

              {users
                .filter(
                  (user) => user.role !== "ADMIN"
                )
                .map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.name} — {user.email}
                  </option>
                ))}
            </select>

            <select
              value={selectedState}
              onChange={(e) =>
                setSelectedState(e.target.value)
              }
            >
              <option value="">
                Select State
              </option>

              {states.map((state) => (
                <option
                  key={state.id}
                  value={state.id}
                >
                  {state.state_name} (
                  {state.state_code})
                </option>
              ))}
            </select>

            <button
              className="primary-btn"
              onClick={assignState}
              disabled={loading}
            >
              {loading
                ? "Assigning..."
                : "Assign State"}
            </button>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <h2>Current User Access</h2>

            <p>
              States currently assigned to the selected
              user.
            </p>
          </div>

          {!selectedUser ? (
            <div className="empty-state">
              Select a user to view their state access.
            </div>
          ) : userStates.length === 0 ? (
            <div className="empty-state">
              No states assigned to this user.
            </div>
          ) : (
            <div className="state-grid">
              {userStates.map((state) => (
                <div
                  className="state-card"
                  key={state.id}
                >
                  <div className="state-code">
                    {state.state_code}
                  </div>

                  <div>
                    <strong>
                      {state.state_name}
                    </strong>

                    <small>
                      State ID: {state.id}
                    </small>
                  </div>

                  <button
                    className="danger-btn"
                    onClick={() =>
                      removeState(state.id)
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminStateAccess;
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function StateAccess() {
  const [assignedStates, setAssignedStates] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD STATE ACCESS DATA
  // ==========================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // JWT-protected dashboard endpoints
      const [accessResponse, statesResponse] =
        await Promise.all([
          api.get("/state-access"),
          api.get("/dashboard/states"),
        ]);

      console.log(
        "STATE ACCESS RESPONSE:",
        accessResponse.data
      );

      console.log(
        "ALL STATES RESPONSE:",
        statesResponse.data
      );

      setAssignedStates(
        accessResponse.data?.data || []
      );

      setAllStates(
        statesResponse.data?.data || []
      );
    } catch (err) {
      console.error(
        "LOAD STATE ACCESS ERROR:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          "Failed to load state access."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GET STATE ID
  // ==========================================
  const getStateId = (item) => {
    return item.state_id || item.state?.id;
  };

  // ==========================================
  // GET STATE NAME
  // ==========================================
  const getStateName = (item) => {
    return (
      item.state_name ||
      item.state?.state_name ||
      item.name ||
      "-"
    );
  };

  // ==========================================
  // ASSIGN STATE
  // ==========================================
  const assignState = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Check selection
    if (
      selectedState === "" ||
      selectedState === null ||
      selectedState === undefined
    ) {
      setError("Please select a state.");
      return;
    }

    const stateId = Number(selectedState);

    console.log(
      "SELECTED STATE VALUE:",
      selectedState
    );

    console.log(
      "CONVERTED STATE ID:",
      stateId
    );

    // Validate state ID
    if (
      !Number.isInteger(stateId) ||
      stateId <= 0
    ) {
      setError("Please select a valid state.");
      return;
    }

    try {
      setAssigning(true);

      console.log(
        "SENDING STATE ID TO BACKEND:",
        stateId
      );

      const response = await api.post(
        "/state-access",
        {
          stateId: stateId,
        }
      );

      console.log(
        "ASSIGN STATE RESPONSE:",
        response.data
      );

      setSuccess(
        "State access assigned successfully."
      );

      // Reset dropdown
      setSelectedState("");

      // Reload assigned/available states
      await loadData();
    } catch (err) {
      console.error(
        "ASSIGN STATE ERROR:",
        err
      );

      console.error(
        "BACKEND ERROR RESPONSE:",
        err.response?.data
      );

      setError(
        err.response?.data?.error?.message ||
          "Failed to assign state access."
      );
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================
  // REMOVE STATE
  // ==========================================
  const removeState = async (stateId) => {
    try {
      setRemoving(stateId);
      setError("");
      setSuccess("");

      await api.delete(
        `/state-access/${stateId}`
      );

      setSuccess(
        "State access removed successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "REMOVE STATE ERROR:",
        err
      );

      console.error(
        "BACKEND ERROR RESPONSE:",
        err.response?.data
      );

      setError(
        err.response?.data?.error?.message ||
          "Failed to remove state access."
      );
    } finally {
      setRemoving(null);
    }
  };

  // ==========================================
  // FIND ASSIGNED STATE IDS
  // ==========================================
  const assignedStateIds = new Set(
    assignedStates
      .map((item) => Number(getStateId(item)))
      .filter((id) => Number.isInteger(id))
  );

  // ==========================================
  // AVAILABLE STATES
  // ==========================================
  const availableStates = allStates.filter(
    (state) =>
      !assignedStateIds.has(Number(state.id))
  );

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="dashboard-page">

      <Sidebar />

      <main className="dashboard-main">

        <Navbar />

        {/* ==================================
            HEADER
        ================================== */}
        <header className="dashboard-header">
          <div>
            <h1>State Access</h1>

            <p>
              Manage the Indian states your account
              is authorized to access.
            </p>
          </div>
        </header>

        {/* ==================================
            ERROR MESSAGE
        ================================== */}
        {error && (
          <div className="error-box page-error">
            {error}
          </div>
        )}

        {/* ==================================
            SUCCESS MESSAGE
        ================================== */}
        {success && (
          <div className="success-box">
            {success}
          </div>
        )}

        {/* ==================================
            ADD STATE ACCESS
        ================================== */}
        <section className="dashboard-card">

          <h2>
            Add State Access
          </h2>

          <p className="section-description">
            Select a state to give your account
            access to its geographical data.
          </p>

          <form
            className="inline-form"
            onSubmit={assignState}
          >

            <select
              value={selectedState}
              onChange={(event) => {
                const value = event.target.value;

                console.log(
                  "DROPDOWN VALUE:",
                  value
                );

                setSelectedState(value);
              }}
              disabled={
                assigning ||
                loading ||
                availableStates.length === 0
              }
            >

              <option value="">
                Select a state
              </option>

              {availableStates.map((state) => (
                <option
                  key={state.id}
                  value={state.id}
                >
                  {state.state_name}
                </option>
              ))}

            </select>

            <button
              type="submit"
              className="primary-btn"
              disabled={
                assigning ||
                loading ||
                !selectedState
              }
            >
              {assigning
                ? "Adding..."
                : "Add State"}
            </button>

          </form>

          {/* No states available */}
          {availableStates.length === 0 &&
            !loading && (
              <p className="section-description">
                All available states are already
                assigned to your account.
              </p>
            )}

        </section>

        {/* ==================================
            ASSIGNED STATES
        ================================== */}
        <section className="dashboard-card table-card">

          <div className="card-header">

            <div>
              <h2>
                Your Assigned States
              </h2>

              <p>
                These states can be accessed
                through your API account.
              </p>
            </div>

          </div>

          {/* Loading */}
          {loading ? (
            <div className="empty-state">
              Loading state access...
            </div>

          ) : assignedStates.length === 0 ? (

            /* No assigned states */
            <div className="empty-state">

              <h3>
                No states assigned
              </h3>

              <p>
                Add a state above to start
                accessing geographical data.
              </p>

            </div>

          ) : (

            /* Assigned states table */
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>State</th>
                    <th>State ID</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {assignedStates.map((item) => {

                    const stateId =
                      getStateId(item);

                    return (
                      <tr key={stateId}>

                        <td>
                          <strong>
                            {getStateName(item)}
                          </strong>
                        </td>

                        <td>
                          {stateId}
                        </td>

                        <td>

                          <button
                            type="button"
                            className="danger-btn"
                            disabled={
                              removing ===
                              stateId
                            }
                            onClick={() =>
                              removeState(
                                stateId
                              )
                            }
                          >

                            {removing ===
                            stateId
                              ? "Removing..."
                              : "Remove"}

                          </button>

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

export default StateAccess;
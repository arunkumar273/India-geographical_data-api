import { useEffect, useMemo, useState } from "react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

function AdminStateAccess() {
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [userAccess, setUserAccess] = useState([]);

  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [error, setError] = useState("");

  /* ============================================================
     APPROVED B2B USERS
  ============================================================ */

  const approvedUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.role === "B2B" &&
        String(
          user.approvalStatus || user.approval_status
        ).toUpperCase() === "APPROVED"
    );
  }, [users]);

  /* ============================================================
     SELECTED USER
  ============================================================ */

  const selectedUser = useMemo(() => {
    return approvedUsers.find(
      (user) =>
        String(user.id) === String(selectedUserId)
    );
  }, [approvedUsers, selectedUserId]);

  /* ============================================================
     ASSIGNED STATE IDS
  ============================================================ */

  const assignedStateIds = useMemo(() => {
    return new Set(
      userAccess.map((item) =>
        String(item.stateId ?? item.state_id)
      )
    );
  }, [userAccess]);

  /* ============================================================
     AVAILABLE STATES
  ============================================================ */

  const availableStates = useMemo(() => {
    return states.filter(
      (state) =>
        !assignedStateIds.has(String(state.id))
    );
  }, [states, assignedStateIds]);

  /* ============================================================
     LOAD USERS + STATES
  ============================================================ */

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        usersResponse,
        statesResponse,
      ] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/states"),
      ]);

      const loadedUsers =
        usersResponse.data?.data || [];

      const loadedStates =
        statesResponse.data?.data || [];

      setUsers(loadedUsers);
      setStates(loadedStates);

      const approved = loadedUsers.filter(
        (user) =>
          user.role === "B2B" &&
          String(
            user.approvalStatus ||
              user.approval_status
          ).toUpperCase() === "APPROVED"
      );

      if (approved.length > 0) {
        setSelectedUserId(
          String(approved[0].id)
        );
      }
    } catch (err) {
      console.error(
        "Failed to load state access:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          "Failed to load state access management."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     LOAD SELECTED USER ACCESS
  ============================================================ */

  const loadUserAccess = async (userId) => {
    if (!userId) {
      setUserAccess([]);
      return;
    }

    try {
      setAccessLoading(true);
      setError("");

      const response = await api.get(
        `/admin/users/${userId}/states`
      );

      setUserAccess(
        response.data?.data?.states || []
      );
    } catch (err) {
      console.error(
        "Failed to load user state access:",
        err
      );

      setUserAccess([]);

      setError(
        err.response?.data?.error?.message ||
          "Failed to fetch user state access."
      );
    } finally {
      setAccessLoading(false);
    }
  };

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    loadInitialData();
  }, []);

  /* ============================================================
     USER CHANGE
  ============================================================ */

  useEffect(() => {
    setSelectedStateId("");

    if (selectedUserId) {
      loadUserAccess(selectedUserId);
    } else {
      setUserAccess([]);
    }
  }, [selectedUserId]);

  /* ============================================================
     ASSIGN STATE
  ============================================================ */

  const handleAssign = async () => {
    if (
      !selectedUserId ||
      !selectedStateId
    ) {
      return;
    }

    try {
      setAssigning(true);
      setError("");

      await api.post(
        `/admin/users/${selectedUserId}/states`,
        {
          stateId: Number(selectedStateId),
        }
      );

      setSelectedStateId("");

      await loadUserAccess(
        selectedUserId
      );
    } catch (err) {
      console.error(
        "Failed to assign state:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          "Failed to assign state access."
      );
    } finally {
      setAssigning(false);
    }
  };

  /* ============================================================
     REMOVE STATE ACCESS
     IMPORTANT:
     Use assignmentId, NOT stateId.
  ============================================================ */

  const handleRemove = async (
    assignmentId,
    stateName
  ) => {
    if (
      !selectedUserId ||
      !assignmentId
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${
        stateName || "this state"
      } access from this user?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingId(assignmentId);
      setError("");

      await api.delete(
        `/admin/users/${selectedUserId}/states/${assignmentId}`
      );

      await loadUserAccess(
        selectedUserId
      );
    } catch (err) {
      console.error(
        "Failed to remove state:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          "Failed to remove state access."
      );
    } finally {
      setRemovingId(null);
    }
  };

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="dashboard-header">
          <div>
            <h1>State Access Management</h1>

            <p>
              Assign geographical access to
              approved B2B users.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={loadInitialData}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
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
            Loading state access management...
          </div>
        ) : (
          <>
            {/* ==================================================
                ASSIGN STATE ACCESS
            ================================================== */}

            <section className="dashboard-card">

              <h2>
                Assign State Access
              </h2>

              <p
                style={{
                  marginTop: "6px",
                  color: "#6b7280",
                }}
              >
                Select an approved B2B user
                and give them access to a
                specific state.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr auto",
                  gap: "16px",
                  marginTop: "20px",
                  alignItems: "center",
                }}
              >

                {/* USER */}

                <select
                  value={selectedUserId}
                  onChange={(e) =>
                    setSelectedUserId(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    padding: "10px 12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "8px",
                    background: "#ffffff",
                    fontSize: "14px",
                  }}
                >
                  <option value="">
                    Select approved user
                  </option>

                  {approvedUsers.map(
                    (user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.name ||
                          "User"}{" "}
                        — {user.email}{" "}
                        (Approved)
                      </option>
                    )
                  )}
                </select>

                {/* STATE */}

                <select
                  value={selectedStateId}
                  onChange={(e) =>
                    setSelectedStateId(
                      e.target.value
                    )
                  }
                  disabled={
                    !selectedUserId ||
                    availableStates.length ===
                      0
                  }
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    padding: "10px 12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "8px",
                    background:
                      !selectedUserId ||
                      availableStates.length ===
                        0
                        ? "#f3f4f6"
                        : "#ffffff",
                    fontSize: "14px",
                  }}
                >
                  <option value="">
                    {availableStates.length ===
                    0
                      ? "All states assigned"
                      : "Select State"}
                  </option>

                  {availableStates.map(
                    (state) => (
                      <option
                        key={state.id}
                        value={state.id}
                      >
                        {state.state_name}
                      </option>
                    )
                  )}
                </select>

                {/* ASSIGN */}

                <button
                  className="primary-btn"
                  onClick={handleAssign}
                  disabled={
                    !selectedUserId ||
                    !selectedStateId ||
                    assigning
                  }
                >
                  {assigning
                    ? "Assigning..."
                    : "Assign State"}
                </button>
              </div>

              {/* SELECTED USER */}

              {selectedUser && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border:
                      "1px solid #e5e7eb",
                  }}
                >
                  <h3>
                    Selected User
                  </h3>

                  <p
                    style={{
                      marginTop: "8px",
                      color: "#6b7280",
                    }}
                  >
                    {selectedUser.name ||
                      "User"}{" "}
                    ·{" "}
                    {selectedUser.email}
                  </p>

                  <p
                    style={{
                      marginTop: "4px",
                      color: "#6b7280",
                    }}
                  >
                    Plan:{" "}
                    {selectedUser.plan
                      ?.name ||
                      selectedUser.plan
                        ?.code ||
                      "Free"}
                  </p>
                </div>
              )}
            </section>

            {/* ==================================================
                CURRENT USER ACCESS
            ================================================== */}

            <section
              className="dashboard-card"
              style={{
                marginTop: "32px",
              }}
            >
              <h2>
                Current User Access
              </h2>

              <p
                style={{
                  marginTop: "6px",
                  color: "#6b7280",
                }}
              >
                States currently assigned
                to the selected user.
              </p>

              {accessLoading ? (
                <div className="empty-state">
                  Loading assigned states...
                </div>
              ) : userAccess.length ===
                0 ? (
                <div className="empty-state">
                  No states assigned to
                  this user.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "16px",
                    marginTop: "20px",
                  }}
                >
                  {userAccess.map(
                    (access) => {
                      const stateId =
                        access.stateId ??
                        access.state_id;

                      const assignmentId =
                        access.assignmentId ??
                        access.assignment_id;

                      const stateName =
                        access.stateName ||
                        access.state?.state_name ||
                        `State ${stateId}`;

                      const stateCode =
                        access.stateCode ||
                        access.state?.state_code ||
                        "";

                      return (
                        <div
                          key={
                            assignmentId ||
                            `${selectedUserId}-${stateId}`
                          }
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            gap: "16px",
                            minHeight: "80px",
                            padding: "16px",
                            border:
                              "1px solid #e5e7eb",
                            borderRadius: "8px",
                            background:
                              "#ffffff",
                          }}
                        >

                          {/* STATE INFORMATION */}

                          <div>
                            <p
                              style={{
                                fontWeight: 600,
                                margin: 0,
                              }}
                            >
                              {stateName}
                            </p>

                            <p
                              style={{
                                marginTop:
                                  "6px",
                                fontSize:
                                  "12px",
                                color:
                                  "#6b7280",
                              }}
                            >
                              State Code:{" "}
                              {stateCode ||
                                "—"}{" "}
                              · ID:{" "}
                              {stateId}
                            </p>
                          </div>

                          {/* REMOVE */}

                          <button
                            className="secondary-btn"
                            onClick={() =>
                              handleRemove(
                                assignmentId,
                                stateName
                              )
                            }
                            disabled={
                              removingId ===
                              assignmentId
                            }
                            style={{
                              color:
                                "#dc2626",
                              borderColor:
                                "#fecaca",
                              background:
                                "#fef2f2",
                              flexShrink: 0,
                            }}
                          >
                            {removingId ===
                            assignmentId
                              ? "Removing..."
                              : "Remove"}
                          </button>

                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminStateAccess;
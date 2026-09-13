import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

export default function VillageMaster() {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);

  const [villages, setVillages] = useState([]);

  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [subDistrictId, setSubDistrictId] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubDistricts, setLoadingSubDistricts] =
    useState(false);

  const [error, setError] = useState("");

  /* =========================
     LOAD STATES
     ========================= */

  const loadStates = async () => {
    try {
      setLoadingStates(true);
      setError("");

      const response = await api.get(
        "/admin/villages/states"
      );

      setStates(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load states:", err);

      setError(
        err.response?.data?.error?.message ||
          "Failed to load states"
      );
    } finally {
      setLoadingStates(false);
    }
  };

  /* =========================
     LOAD DISTRICTS
     ========================= */

  const loadDistricts = async (selectedStateId) => {
    if (!selectedStateId) {
      setDistricts([]);
      return;
    }

    try {
      setLoadingDistricts(true);

      const response = await api.get(
        `/admin/villages/districts?stateId=${selectedStateId}`
      );

      setDistricts(response.data?.data || []);
    } catch (err) {
      console.error(
        "Failed to load districts:",
        err
      );

      setDistricts([]);

      setError(
        err.response?.data?.error?.message ||
          "Failed to load districts"
      );
    } finally {
      setLoadingDistricts(false);
    }
  };

  /* =========================
     LOAD SUB-DISTRICTS
     ========================= */

  const loadSubDistricts = async (
    selectedDistrictId
  ) => {
    if (!selectedDistrictId) {
      setSubDistricts([]);
      return;
    }

    try {
      setLoadingSubDistricts(true);

      const response = await api.get(
        `/admin/villages/subdistricts?districtId=${selectedDistrictId}`
      );

      setSubDistricts(
        response.data?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load sub-districts:",
        err
      );

      setSubDistricts([]);

      setError(
        err.response?.data?.error?.message ||
          "Failed to load sub-districts"
      );
    } finally {
      setLoadingSubDistricts(false);
    }
  };

  /* =========================
     LOAD VILLAGES
     ========================= */

  const loadVillages = async (
    selectedStateId = stateId,
    selectedDistrictId = districtId,
    selectedSubDistrictId = subDistrictId,
    selectedSearch = search,
    selectedPage = page
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set(
        "page",
        String(selectedPage)
      );

      params.set(
        "limit",
        String(limit)
      );

      if (selectedStateId) {
        params.set(
          "stateId",
          String(selectedStateId)
        );
      }

      if (selectedDistrictId) {
        params.set(
          "districtId",
          String(selectedDistrictId)
        );
      }

      if (selectedSubDistrictId) {
        params.set(
          "subDistrictId",
          String(selectedSubDistrictId)
        );
      }

      if (selectedSearch.trim()) {
        params.set(
          "search",
          selectedSearch.trim()
        );
      }

      const response = await api.get(
        `/admin/villages?${params.toString()}`
      );

      setVillages(
        response.data?.data || []
      );

      setPagination(
        response.data?.pagination || {
          page: selectedPage,
          limit,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      console.error(
        "Failed to load village master data:",
        err
      );

      setVillages([]);

      setError(
        err.response?.data?.error?.message ||
          "Failed to load village master data"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     INITIAL LOAD
     ========================= */

  useEffect(() => {
    loadStates();
    loadVillages(
      "",
      "",
      "",
      "",
      1
    );
  }, []);

  /* =========================
     STATE CHANGE
     ========================= */

  const handleStateChange = async (event) => {
    const selectedStateId =
      event.target.value;

    setStateId(selectedStateId);

    // Reset dependent filters
    setDistrictId("");
    setSubDistrictId("");

    setDistricts([]);
    setSubDistricts([]);

    // Always start from page 1
    setPage(1);

    if (selectedStateId) {
      await loadDistricts(
        selectedStateId
      );
    }

    // IMPORTANT:
    // Use selected value directly instead of
    // waiting for React state update.
    await loadVillages(
      selectedStateId,
      "",
      "",
      search,
      1
    );
  };

  /* =========================
     DISTRICT CHANGE
     ========================= */

  const handleDistrictChange = async (
    event
  ) => {
    const selectedDistrictId =
      event.target.value;

    setDistrictId(
      selectedDistrictId
    );

    setSubDistrictId("");

    setSubDistricts([]);

    setPage(1);

    if (selectedDistrictId) {
      await loadSubDistricts(
        selectedDistrictId
      );
    }

    await loadVillages(
      stateId,
      selectedDistrictId,
      "",
      search,
      1
    );
  };

  /* =========================
     SUB-DISTRICT CHANGE
     ========================= */

  const handleSubDistrictChange = async (
    event
  ) => {
    const selectedSubDistrictId =
      event.target.value;

    setSubDistrictId(
      selectedSubDistrictId
    );

    setPage(1);

    await loadVillages(
      stateId,
      districtId,
      selectedSubDistrictId,
      search,
      1
    );
  };

  /* =========================
     SEARCH
     ========================= */

  const handleSearch = async () => {
    setPage(1);

    await loadVillages(
      stateId,
      districtId,
      subDistrictId,
      search,
      1
    );
  };

  /* =========================
     CLEAR FILTERS
     ========================= */

  const handleClear = async () => {
    setStateId("");
    setDistrictId("");
    setSubDistrictId("");

    setDistricts([]);
    setSubDistricts([]);

    setSearch("");

    setPage(1);

    await loadVillages(
      "",
      "",
      "",
      "",
      1
    );
  };

  /* =========================
     REFRESH
     ========================= */

  const handleRefresh = async () => {
    await loadVillages(
      stateId,
      districtId,
      subDistrictId,
      search,
      page
    );
  };

  /* =========================
     PAGINATION
     ========================= */

  const handlePrevious = async () => {
    if (page <= 1) return;

    const newPage = page - 1;

    setPage(newPage);

    await loadVillages(
      stateId,
      districtId,
      subDistrictId,
      search,
      newPage
    );
  };

  const handleNext = async () => {
    if (
      pagination.totalPages === 0 ||
      page >= pagination.totalPages
    ) {
      return;
    }

    const newPage = page + 1;

    setPage(newPage);

    await loadVillages(
      stateId,
      districtId,
      subDistrictId,
      search,
      newPage
    );
  };

  return (
    <div className="dashboard-page">
      <Sidebar admin />

      <main className="dashboard-main">
        {/* =========================
            HEADER
           ========================= */}

        <header className="dashboard-header">
          <div>
            <h1>Village Master</h1>

            <p>
              Browse and filter India's complete
              village geographical database.
            </p>
          </div>

          <button
            className="secondary-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </header>

        {/* =========================
            ERROR
           ========================= */}

        {error && (
          <div className="error-box page-error">
            {error}
          </div>
        )}

        {/* =========================
            FILTER CARD
           ========================= */}

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Filters</h2>

              <p>
                Select a geographical level or
                search for a village.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {/* STATE */}

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                State
              </label>

              <select
                value={stateId}
                onChange={
                  handleStateChange
                }
                disabled={loadingStates}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">
                  {loadingStates
                    ? "Loading states..."
                    : "All States"}
                </option>

                {states.map((state) => (
                  <option
                    key={String(state.id)}
                    value={String(state.id)}
                  >
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>

            {/* DISTRICT */}

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                District
              </label>

              <select
                value={districtId}
                onChange={
                  handleDistrictChange
                }
                disabled={
                  !stateId ||
                  loadingDistricts
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">
                  {!stateId
                    ? "Select State First"
                    : loadingDistricts
                    ? "Loading districts..."
                    : "All Districts"}
                </option>

                {districts.map(
                  (district) => (
                    <option
                      key={String(
                        district.id
                      )}
                      value={String(
                        district.id
                      )}
                    >
                      {
                        district.district_name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SUB-DISTRICT */}

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                Sub-District
              </label>

              <select
                value={subDistrictId}
                onChange={
                  handleSubDistrictChange
                }
                disabled={
                  !districtId ||
                  loadingSubDistricts
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">
                  {!districtId
                    ? "Select District First"
                    : loadingSubDistricts
                    ? "Loading sub-districts..."
                    : "All Sub-Districts"}
                </option>

                {subDistricts.map(
                  (subDistrict) => (
                    <option
                      key={String(
                        subDistrict.id
                      )}
                      value={String(
                        subDistrict.id
                      )}
                    >
                      {
                        subDistrict.sub_district_name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SEARCH */}

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                Village Search
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSearch();
                    }
                  }}
                  placeholder="Search village..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border:
                      "1px solid #ccc",
                  }}
                />

                <button
                  className="secondary-btn"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* FILTER ACTIONS */}

          <div
            style={{
              marginTop: "18px",
              display: "flex",
              justifyContent:
                "flex-end",
            }}
          >
            <button
              className="secondary-btn"
              onClick={handleClear}
              disabled={loading}
            >
              Clear Filters
            </button>
          </div>
        </section>

        {/* =========================
            RESULTS
           ========================= */}

        <section
          className="dashboard-card"
          style={{
            marginTop: "20px",
          }}
        >
          <div className="dashboard-card-header">
            <div>
              <h2>Village Records</h2>

              <p>
                {pagination.total.toLocaleString()}{" "}
                villages found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              Loading village data...
            </div>
          ) : villages.length === 0 ? (
            <div className="empty-state">
              No villages found for the
              selected filters.
            </div>
          ) : (
            <>
              <div
                style={{
                  overflowX: "auto",
                  marginTop: "20px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid #ddd",
                        }}
                      >
                        Village Code
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid #ddd",
                        }}
                      >
                        Village
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid #ddd",
                        }}
                      >
                        Sub-District
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid #ddd",
                        }}
                      >
                        District
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid #ddd",
                        }}
                      >
                        State
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid #ddd",
                        }}
                      >
                        Full Address
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {villages.map(
                      (village) => (
                        <tr
                          key={String(
                            village.id
                          )}
                        >
                          <td
                            style={{
                              padding:
                                "12px",
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >
                            {
                              village.villageCode
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                              borderBottom:
                                "1px solid #eee",
                              fontWeight: 600,
                            }}
                          >
                            {
                              village.villageName
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >
                            {
                              village.subDistrictName
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >
                            {
                              village.districtName
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >
                            {
                              village.stateName
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                              borderBottom:
                                "1px solid #eee",
                            }}
                          >
                            {
                              village.fullAddress
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginTop: "20px",
                }}
              >
                <span>
                  Page {pagination.page} of{" "}
                  {pagination.totalPages}
                </span>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <button
                    className="secondary-btn"
                    onClick={
                      handlePrevious
                    }
                    disabled={
                      page <= 1 ||
                      loading
                    }
                  >
                    Previous
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={handleNext}
                    disabled={
                      page >=
                        pagination.totalPages ||
                      loading
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newCredentials, setNewCredentials] = useState(null);

  useEffect(() => {
    loadKeys();
  }, []);

  // -----------------------------------
  // Load API Keys
  // -----------------------------------
  const loadKeys = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api-keys");

      console.log("API KEYS:", response.data);

      setKeys(response.data?.data || []);
    } catch (err) {
      console.error("LOAD API KEYS ERROR:", err);

      setError(
        err.response?.data?.error?.message ||
          "Failed to load API keys."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // Create API Key
  // -----------------------------------
  const createKey = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a name for the API key.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      setNewCredentials(null);

      console.log("Creating API key:", trimmedName);

      const response = await api.post("/api-keys", {
        name: trimmedName,
      });

      console.log(
        "CREATE API KEY RESPONSE:",
        response.data
      );

      const credentials = response.data?.data;

      if (
        !credentials ||
        !credentials.apiKey ||
        !credentials.apiSecret
      ) {
        setError(
          "API key creation succeeded, but credentials were not returned."
        );
        return;
      }

      setNewCredentials({
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
      });

      setName("");

      setSuccess(
        "API key created successfully."
      );

      await loadKeys();
    } catch (err) {
      console.error(
        "CREATE API KEY ERROR:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to create API key."
      );
    } finally {
      setCreating(false);
    }
  };

  // -----------------------------------
  // Save credentials for testing
  // -----------------------------------
  const saveCredentials = () => {
    if (!newCredentials) {
      return;
    }

    localStorage.setItem(
      "apiKey",
      newCredentials.apiKey
    );

    localStorage.setItem(
      "apiSecret",
      newCredentials.apiSecret
    );

    setSuccess(
      "API credentials saved for testing."
    );
  };

  // -----------------------------------
  // Deactivate API Key
  // -----------------------------------
  const deactivateKey = async (id) => {
    try {
      setError("");
      setSuccess("");

      await api.patch(
        `/api-keys/${id}/deactivate`
      );

      setSuccess(
        "API key deactivated successfully."
      );

      await loadKeys();
    } catch (err) {
      console.error(
        "DEACTIVATE API KEY ERROR:",
        err
      );

      setError(
        err.response?.data?.error?.message ||
          "Failed to deactivate API key."
      );
    }
  };

  return (
    <div className="dashboard-page">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="dashboard-main">

        {/* Top navigation */}
        <Navbar />

        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1>API Keys</h1>

            <p>
              Create and manage credentials for
              your API integrations.
            </p>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="error-box page-error">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="success-box">
            {success}
          </div>
        )}

        {/* Newly created credentials */}
        {newCredentials && (
          <section className="dashboard-card credentials-box">

            <h2>
              API Credentials Created
            </h2>

            <p className="section-description">
              Save these credentials securely.
              The API secret will only be shown
              here.
            </p>

            <div className="credential-row">
              <strong>
                API Key
              </strong>

              <code>
                {newCredentials.apiKey}
              </code>
            </div>

            <div className="credential-row">
              <strong>
                API Secret
              </strong>

              <code>
                {newCredentials.apiSecret}
              </code>
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={saveCredentials}
            >
              Save Credentials for Testing
            </button>

          </section>
        )}

        {/* Create API Key */}
        <section className="dashboard-card">

          <h2>
            Create API Key
          </h2>

          <p className="section-description">
            Give your API credential a
            descriptive name.
          </p>

          <form
            className="inline-form"
            onSubmit={createKey}
          >

            <input
              type="text"
              placeholder="Example: Production App"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={creating}
            />

            <button
              type="submit"
              className="primary-btn"
              disabled={
                creating ||
                !name.trim()
              }
            >
              {creating
                ? "Creating..."
                : "Create API Key"}
            </button>

          </form>

        </section>

        {/* Existing API Keys */}
        <section className="dashboard-card table-card">

          <div className="card-header">

            <div>
              <h2>
                Your API Keys
              </h2>

              <p>
                Manage credentials associated
                with your account.
              </p>
            </div>

          </div>

          {loading ? (
            <div className="empty-state">
              Loading API keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="empty-state">
              No API keys found.
            </div>
          ) : (
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {keys.map((key) => (
                    <tr key={key.id}>

                      <td>
                        <strong>
                          {key.name}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            key.is_active
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {key.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {key.created_at
                          ? new Date(
                              key.created_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        {key.expires_at
                          ? new Date(
                              key.expires_at
                            ).toLocaleDateString()
                          : "Never"}
                      </td>

                      <td>
                        {key.is_active && (
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() =>
                              deactivateKey(
                                key.id
                              )
                            }
                          >
                            Deactivate
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default ApiKeys;
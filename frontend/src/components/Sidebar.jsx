import { NavLink, useNavigate } from "react-router-dom";

function Sidebar({ admin = false }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("apiKey");
    localStorage.removeItem("apiSecret");

    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">VG</div>

        <div>
          <strong>VillageGeo</strong>
          <span>{admin ? "Admin Portal" : "Developer Portal"}</span>
        </div>
      </div>

      {!admin ? (
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/api-keys"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>⚿</span>
            API Keys
          </NavLink>

          <NavLink
            to="/state-access"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>◈</span>
            State Access
          </NavLink>

          <NavLink
            to="/usage"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>◷</span>
            Usage & Analytics
          </NavLink>
        </nav>
      ) : (
        <nav className="sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>♙</span>
            Users
          </NavLink>

          <NavLink
            to="/admin/api-keys"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>⚿</span>
            API Keys
          </NavLink>

          <NavLink
            to="/admin/state-access"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span>◈</span>
            State Access
          </NavLink>
        </nav>
      )}

      <div className="sidebar-bottom">
        <div className="user-mini">
          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email || ""}</span>
          </div>
        </div>

        <button className="logout-btn" onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
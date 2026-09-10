function Navbar({ title, subtitle }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-user">
        <div className="topbar-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div>
          <strong>{user?.name || "User"}</strong>
          <span>{user?.role || "B2B"}</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
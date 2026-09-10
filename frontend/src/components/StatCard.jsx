function StatCard({ icon, title, value, description, type = "blue" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${type}`}>
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>

        {description && (
          <small>{description}</small>
        )}
      </div>
    </div>
  );
}

export default StatCard;
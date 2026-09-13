export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          )}

          {trend !== undefined && trend !== null && (
            <p className="mt-3 text-sm">
              <span className="font-semibold text-emerald-600">
                {trend}
              </span>

              {trendLabel && (
                <span className="ml-1 text-slate-500">
                  {trendLabel}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Icon intentionally removed.
            This removes the empty square from dashboard cards. */}
      </div>
    </div>
  );
}
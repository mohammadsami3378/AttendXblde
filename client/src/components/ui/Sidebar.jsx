import { Link, useLocation } from "react-router-dom";

function NavItem({ to, label, icon, active }) {
  return (
    <Link
      to={to}
      className={[
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-white/10 text-white"
          : "text-slate-200 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition",
          active ? "text-white" : "group-hover:text-white",
        ].join(" ")}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function Sidebar({ role }) {
  const loc = useLocation();
  const path = loc.pathname;

  const items =
    role === "admin"
      ? [
          { to: "/admin-dashboard", label: "Dashboard", icon: "▦" },
          { to: "/admin-dashboard#attendance", label: "Attendance", icon: "◎" },
          { to: "/admin-dashboard#subjects", label: "Subjects", icon: "◈" },
        ]
      : [
          { to: "/student-dashboard", label: "Dashboard", icon: "▦" },
          { to: "/student-dashboard#history", label: "History", icon: "◎" },
        ];

  return (
    <aside className="glass sticky top-4 hidden h-[calc(100vh-2rem)] w-72 flex-none rounded-3xl p-4 md:block">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary/80 to-brand-secondary/70 text-white shadow-glass">
          SA
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Smart Attendance</div>
          <div className="text-xs text-slate-300">{role === "admin" ? "Admin" : "Student"}</div>
        </div>
      </div>

      <nav className="mt-4 space-y-1">
        {items.map((it) => (
          <NavItem
            key={it.to}
            to={it.to}
            label={it.label}
            icon={it.icon}
            active={path === it.to}
          />
        ))}
      </nav>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs font-medium text-slate-200">Tip</div>
        <div className="mt-1 text-xs text-slate-300">Use the QR panel to mark attendance quickly.</div>
      </div>
    </aside>
  );
}


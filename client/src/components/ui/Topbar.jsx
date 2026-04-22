import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="glass sticky top-4 z-20 rounded-3xl px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-white">{title}</div>
          {subtitle ? <div className="truncate text-xs text-slate-300">{subtitle}</div> : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-xs font-medium text-slate-200">{user?.name}</div>
            <div className="text-[11px] text-slate-400">{user?.role}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}


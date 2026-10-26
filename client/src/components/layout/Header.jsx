import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Menu, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import { getMediaUrl } from "../../services/api.js";

export default function Header({ onOpenMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, logout } = useAuthStore();

  const [profileOpen, setProfileOpen] = useState(false);

  const adminName = adminUser?.name || adminUser?.fullName || "Rajesh Varma";
  const initials =
    adminName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RV";
  const avatarUrl = getMediaUrl(adminUser?.profileImage || adminUser?.avatar);

  // Calculate clean breadcrumb title
  const getBreadcrumbTitle = (path) => {
    if (path === "/dashboard") return "Dashboard Overview";
    if (path.startsWith("/users")) return "User Management";
    if (path.startsWith("/gold")) return "Gold Overview & Inventory";
    if (path.startsWith("/silver")) return "Silver Overview & Inventory";
    if (path === "/transactions") return "Transaction Ledger";
    if (path === "/settings" || path === "/profile") return "Settings & Policies";
    return "Admin Console";
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Mobile hamburger & breadcrumb trail */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>TIAZ Admin</span>
            <span>/</span>
            <span className="text-slate-600 font-medium capitalize">
              {location.pathname.replace("/", "").split("/")[0] || "Dashboard"}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-xs sm:max-w-md">
            {getBreadcrumbTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Right: Admin Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#FDF4CD] p-[1.5px] shadow-xs shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={adminName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-[#E6C352] text-xs">
                  {initials}
                </div>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {adminName}
              </p>
              <p className="text-[10px] text-amber-800 font-semibold leading-none">
                {adminUser?.role || "Super Admin"}
              </p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">
                  {adminUser?.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {adminUser?.email}
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-700" />
                  <span>Settings</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

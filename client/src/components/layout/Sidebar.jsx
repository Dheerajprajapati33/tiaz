import React from "react";
import {
  NavLink as RouterLink,
  useLocation as useRouterLocation,
  useNavigate as useRouterNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Coins,
  Disc,
  ArrowLeftRight,
  Landmark,
  Settings,
  LogOut,
  ShoppingBag,
  Package,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import { getMediaUrl } from "../../services/api.js";

export default function Sidebar({ onCloseMobile }) {
  const routerLocation = useRouterLocation();
  const routerNavigate = useRouterNavigate();
  const { logout, adminUser } = useAuthStore();

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

  const handleLogout = () => {
    logout();
    routerNavigate("/login");
  };

  const navItemClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer select-none ${
      isActive
        ? "bg-amber-50 text-amber-900 border-l-2 border-[#D4AF37] pl-2.5 font-semibold shadow-xs"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full select-none shadow-xs">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
        <RouterLink
          to="/dashboard"
          className="flex items-center gap-3"
          onClick={onCloseMobile}
        >
          {/* Official TIA'Z Luxury Emblem Logo */}
          <img
            src="/logo.png"
            alt="TIA'Z Logo"
            className="w-10 h-10 object-contain rounded-full shadow-xs border border-amber-300/40 bg-amber-50/30 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-base tracking-wide font-serif">
                TIA'Z
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Gold
              </span>
            </div>
            <p className="text-[10px] text-slate-500 tracking-tight uppercase font-medium">
              Admin Console
            </p>
          </div>
        </RouterLink>
      </div>

      {/* Nav List - Only 5 Core Screens */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* 1. Dashboard */}
        <RouterLink
          to="/dashboard"
          className={navItemClass(routerLocation.pathname === "/dashboard")}
          onClick={onCloseMobile}
        >
          <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
          <span>Dashboard</span>
        </RouterLink>

        {/* 2. Users */}
        <RouterLink
          to="/users"
          className={navItemClass(routerLocation.pathname.startsWith("/users"))}
          onClick={onCloseMobile}
        >
          <Users className="w-4 h-4 text-slate-500" />
          <span>Users</span>
        </RouterLink>

        {/* 3. Gold (Direct Overview Screen) */}
        <RouterLink
          to="/gold"
          className={navItemClass(routerLocation.pathname.startsWith("/gold"))}
          onClick={onCloseMobile}
        >
          <Coins className="w-4 h-4 text-[#B45309]" />
          <span>Gold</span>
        </RouterLink>

        {/* 4. Silver (Direct Overview Screen) */}
        <RouterLink
          to="/silver"
          className={navItemClass(
            routerLocation.pathname.startsWith("/silver"),
          )}
          onClick={onCloseMobile}
        >
          <Disc className="w-4 h-4 text-slate-500" />
          <span>Silver</span>
        </RouterLink>

        {/* 5. Products Catalog */}
        <RouterLink
          to="/products"
          className={navItemClass(
            routerLocation.pathname.startsWith("/products"),
          )}
          onClick={onCloseMobile}
        >
          <Package className="w-4 h-4 text-slate-500" />
          <span>Products</span>
        </RouterLink>

        {/* 6. Purchase Requests (Physical Orders) */}
        <RouterLink
          to="/orders"
          className={navItemClass(
            routerLocation.pathname.startsWith("/orders") ||
              routerLocation.pathname.startsWith("/purchase-requests"),
          )}
          onClick={onCloseMobile}
        >
          <ShoppingBag className="w-4 h-4 text-amber-600" />
          <div className="flex items-center justify-between flex-1">
            <span>Orders</span>
          </div>
        </RouterLink>

        {/* 6. Transactions */}
        <RouterLink
          to="/transactions"
          className={navItemClass(routerLocation.pathname === "/transactions")}
          onClick={onCloseMobile}
        >
          <ArrowLeftRight className="w-4 h-4 text-slate-500" />
          <span>Transactions</span>
        </RouterLink>

        {/* 7. Withdrawals */}
        <RouterLink
          to="/withdrawals"
          className={navItemClass(routerLocation.pathname === "/withdrawals")}
          onClick={onCloseMobile}
        >
          <Landmark className="w-4 h-4 text-slate-500" />
          <span>Withdrawals</span>
        </RouterLink>

        {/* 5. Settings */}
        <RouterLink
          to="/settings"
          className={navItemClass(
            routerLocation.pathname === "/settings" ||
              routerLocation.pathname === "/profile",
          )}
          onClick={onCloseMobile}
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Settings</span>
        </RouterLink>
      </div>

      {/* Admin Profile & Logout Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-900 text-xs shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={adminName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {adminUser?.name || "Rajesh Varma"}
              </p>
              <p className="text-[10px] text-amber-800 truncate font-semibold">
                {adminUser?.role || "Super Admin"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

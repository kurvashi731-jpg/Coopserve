import { Link, useNavigate } from "react-router-dom";
import { Home, ListChecks, Wallet, User, LogOut, HandHeart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linksByRole = {
    customer: [
      { to: "/home", label: "Browse", icon: Home },
      { to: "/my-bookings", label: "Bookings", icon: ListChecks },
    ],
    worker: [
      { to: "/worker/dashboard", label: "Dashboard", icon: Home },
      { to: "/worker/earnings", label: "Earnings", icon: Wallet },
    ],
    coopAdmin: [
      { to: "/admin/dashboard", label: "Dashboard", icon: Home },
      { to: "/admin/ledger", label: "Ledger", icon: Wallet },
    ],
  };

  const links = user ? linksByRole[user.role] || [] : [];

  return (
    <>
      {/* Top navbar - desktop */}
      <header className="hidden md:flex items-center justify-between bg-white shadow-sm px-8 py-3 sticky top-0 z-20">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg text-primary">
          <HandHeart size={22} /> CoopServe
        </Link>
        {user && (
          <nav className="flex items-center gap-6">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600 hover:text-primary flex items-center gap-1.5">
                <l.icon size={16} /> {l.label}
              </Link>
            ))}
            <Link to="/profile" className="text-sm font-medium text-slate-600 hover:text-primary flex items-center gap-1.5">
              <User size={16} /> {user.name?.split(" ")[0]}
            </Link>
            <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1.5">
              <LogOut size={16} /> Logout
            </button>
          </nav>
        )}
      </header>

      {/* Bottom tab bar - mobile */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-20">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="flex flex-col items-center text-slate-600 text-[11px] gap-0.5">
              <l.icon size={20} /> {l.label}
            </Link>
          ))}
          <Link to="/profile" className="flex flex-col items-center text-slate-600 text-[11px] gap-0.5">
            <User size={20} /> Profile
          </Link>
        </nav>
      )}
    </>
  );
}

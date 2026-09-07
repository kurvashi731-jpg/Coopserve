import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-semibold mb-5">My Profile</h1>
      <div className="card space-y-3">
        <div>
          <p className="text-xs text-slate-400">Name</p>
          <p className="font-medium text-slate-800">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Email</p>
          <p className="font-medium text-slate-800">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Role</p>
          <p className="font-medium text-slate-800 capitalize">{user?.role?.replace("coopAdmin", "Cooperative Admin")}</p>
        </div>
      </div>
    </div>
  );
}

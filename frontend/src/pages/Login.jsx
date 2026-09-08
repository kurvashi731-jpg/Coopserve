import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HandHeart, Eye, EyeOff } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === "customer") navigate("/home");
      else if (data.user.role === "worker") navigate("/worker/dashboard");
      else navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <HandHeart className="text-primary mb-2" size={32} />
          <h1 className="font-heading text-xl font-semibold">Login to CoopServe</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" required placeholder="Email" className="input w-full"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} required placeholder="Password" className="input w-full pr-10"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="flex justify-end">
            <Link className="text-xs text-primary hover:underline font-medium" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-slate-500 text-center mt-5">
          New here? <Link className="text-primary font-medium" to="/register">Create an account</Link>
        </p>
        <div className="mt-5 bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
          <p className="font-medium mb-1">Demo accounts (password: Demo@1234):</p>
          <p>customer1@coopserve.demo · worker1@coopserve.demo · admin1@coopserve.demo</p>
        </div>
      </div>
    </div>
  );
}
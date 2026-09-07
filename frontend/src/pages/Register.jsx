import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HandHeart } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [cooperativeId, setCooperativeId] = useState("");
  const [category, setCategory] = useState("");
  const [cooperatives, setCooperatives] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/cooperatives").then((res) => setCooperatives(res.data)).catch(() => {});
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, role };
      if (role === "worker") {
        payload.cooperativeId = cooperativeId;
        payload.category = [category];
        payload.priceRange = { min: 150, max: 600 };
      }
      const { data } = await api.post("/auth/register", payload);
      login(data.token, data.user);
      toast.success("Account created!");
      if (data.user.role === "customer") navigate("/home");
      else if (data.user.role === "worker") navigate("/worker/dashboard");
      else navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <HandHeart className="text-primary mb-2" size={32} />
          <h1 className="font-heading text-xl font-semibold">Create your CoopServe account</h1>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { key: "customer", label: "Customer" },
            { key: "worker", label: "Worker" },
            { key: "coopAdmin", label: "Coop Admin" },
          ].map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={`text-sm font-medium py-2 rounded-xl border transition ${
                role === r.key ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Full Name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="email" required placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" required placeholder="Password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Address" className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          {role === "worker" && (
            <>
              <select required className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select your service category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select required className="input" value={cooperativeId} onChange={(e) => setCooperativeId(e.target.value)}>
                <option value="">Select a cooperative to join</option>
                {cooperatives.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full !mt-5">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-5">
          Already have an account? <Link to="/login" className="text-primary font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}

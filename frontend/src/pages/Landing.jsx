import { Link } from "react-router-dom";
import { HandHeart, ShieldCheck, Users, Wallet, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <HandHeart size={48} />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">CoopServe</h1>
          <p className="text-lg text-white/90 mb-2">Cooperative Gig Services Platform for Household &amp; Community Services</p>
          <p className="text-white/75 mb-8">
            Verified local workers, organized as cooperatives — fair pricing, full transparency, no hidden commissions.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/register" className="bg-accent text-white font-medium px-6 py-3 rounded-xl hover:bg-accent-light transition flex items-center gap-2">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="bg-white/10 border border-white/40 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        <div className="card text-center">
          <Users className="mx-auto text-primary mb-3" size={32} />
          <h3 className="font-heading font-semibold mb-2">Worker Cooperatives</h3>
          <p className="text-sm text-slate-500">
            Local workers join community cooperatives that verify their skills and build collective trust.
          </p>
        </div>
        <div className="card text-center">
          <Wallet className="mx-auto text-primary mb-3" size={32} />
          <h3 className="font-heading font-semibold mb-2">Transparent Ledger</h3>
          <p className="text-sm text-slate-500">
            Every booking shows the exact split — worker payout, platform fee, and community welfare fund.
          </p>
        </div>
        <div className="card text-center">
          <ShieldCheck className="mx-auto text-primary mb-3" size={32} />
          <h3 className="font-heading font-semibold mb-2">Verified &amp; Rated</h3>
          <p className="text-sm text-slate-500">
            Every worker carries a trust score built from cooperative verification and real customer reviews.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-14 text-center">
        <h2 className="font-heading text-2xl font-semibold mb-3">Need household help?</h2>
        <p className="text-slate-500 mb-6">Plumbing, electrical, cleaning, cooking, tutoring &amp; gardening — all in one place.</p>
        <Link to="/register" className="btn-primary inline-flex items-center gap-2">
          Join CoopServe <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}

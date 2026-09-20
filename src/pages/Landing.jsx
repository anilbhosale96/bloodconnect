import { Link } from 'react-router-dom'
import { Droplet, ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">LIFE-LINK</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Register Facility
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            PRARAMBHA 2.0 PS-02: Emergency Blood Response System
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            When Emergencies Occur, <span className="text-blue-600">Seconds Matter.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            LIFE-LINK coordinates hospitals, blood banks, and donors with intelligent priority-ranked matching, live response tracking, and auditable fulfillment workflows.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Get Started with LIFE-LINK</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 shadow-xs flex items-center justify-center transition-colors"
            >
              Sign In to Your Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Intelligent Matching Engine</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Multi-factor scoring formula (40% availability + 30% distance + 20% urgency + 10% freshness) identifies the best resource in seconds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Real-Time Coordination</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Instant alerts and inventory locking workflow eliminate manual phone calls and delays during golden hour emergencies.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Complete Audit Trail</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Full traceability from request creation to fulfillment with tamper-evident audit logging for hospital and administrative compliance.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        LIFE-LINK &bull; Emergency Blood Response System &bull; PRARAMBHA 2.0 PS-02
      </footer>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2, Droplet, Loader2, Lock, Mail, Building2, Heart, Shield, Sparkles } from 'lucide-react'
import { signIn } from '../services/auth.js'
import { DEMO_USERS } from '../lib/seedData.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await signIn({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(authError.message || 'Invalid email or password.')
        setLoading(false)
        return
      }

      const userRole = data?.profile?.role || data?.user?.user_metadata?.role || 'donor'
      setSuccessMessage(`Login successful! Redirecting to ${userRole.replace('_', ' ')} portal...`)

      setTimeout(() => {
        redirectByRole(userRole)
      }, 800)
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const redirectByRole = (role) => {
    switch (role) {
      case 'hospital':
        navigate('/hospital')
        break
      case 'blood_bank':
        navigate('/blood-bank')
        break
      case 'donor':
        navigate('/donor')
        break
      case 'admin':
        navigate('/admin')
        break
      default:
        navigate('/')
    }
  }

  const handleQuickDemoLogin = async (demoUser) => {
    setEmail(demoUser.email)
    setPassword(demoUser.password)
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      const { data, error: authError } = await signIn({
        email: demoUser.email,
        password: demoUser.password,
      })

      if (authError) {
        setError(authError.message || 'Demo login failed')
        setLoading(false)
        return
      }

      const userRole = data?.profile?.role || demoUser.role
      setSuccessMessage(`Demo authenticated as ${demoUser.fullName} (${userRole.replace('_', ' ')}). Opening portal...`)

      setTimeout(() => {
        redirectByRole(userRole)
      }, 500)
    } catch (err) {
      setError(err?.message || 'Unexpected login error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Droplet className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            LIFE-LINK
          </span>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign In to Your Account
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Emergency Blood Response &amp; Coordination System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Error</span>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div
              role="status"
              className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Verified</span>
                <p className="mt-0.5 leading-relaxed">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Create new account */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Need an account for your organization?{' '}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* 1-Click Demo Login Panel (Presentation & Judges) */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>1-Click Presentation Demo Login</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Judges Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Select an official profile to instantly load its respective portal and live workflow:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_USERS.map((demo) => {
              const RoleIcon =
                demo.role === 'hospital'
                  ? Building2
                  : demo.role === 'blood_bank'
                  ? Droplet
                  : demo.role === 'donor'
                  ? Heart
                  : Shield

              return (
                <button
                  key={demo.role}
                  type="button"
                  disabled={loading}
                  aria-label={`Log in as ${demo.label}`}
                  onClick={() => handleQuickDemoLogin(demo)}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/50 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    demo.role === 'hospital'
                      ? 'bg-blue-100 text-blue-700'
                      : demo.role === 'blood_bank'
                      ? 'bg-rose-100 text-rose-700'
                      : demo.role === 'donor'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                      {demo.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {demo.label}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          LIFE-LINK Emergency Blood Response System &bull; PRARAMBHA 2.0
        </p>
      </div>
    </div>
  )
}


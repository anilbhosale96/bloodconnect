import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2, Droplet, Loader2, Lock, Mail, User } from 'lucide-react'
import RoleSelector from '../components/RoleSelector.jsx'
import { signUp } from '../services/auth.js'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('hospital')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (!role) {
      setError('Please select an account role to proceed.')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await signUp({
        email: email.trim(),
        password,
        role,
        fullName: fullName.trim(),
      })

      if (authError) {
        setError(authError.message || 'Failed to sign up. Please try again.')
        setLoading(false)
        return
      }

      // If user has an active session immediately (auto-confirm enabled or rate-limit fallback)
      if (data?.session) {
        if (data?.rateLimitBypassed) {
          setSuccessMessage(
            'Supabase email rate limit reached on free tier. Instant session activated for testing! Redirecting to your dashboard...'
          )
        } else {
          setSuccessMessage('Account created successfully! Redirecting to your dashboard...')
        }
        setTimeout(() => {
          redirectByRole(role)
        }, 1200)
      } else {
        // Confirmation email flow
        setSuccessMessage(
          'Registration successful! Please check your email inbox to confirm your account before logging in.'
        )
        setLoading(false)
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const redirectByRole = (userRole) => {
    switch (userRole) {
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Droplet className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            LIFE-LINK
          </span>
        </div>
        <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Create an Emergency Network Account
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Connect hospitals, blood banks, and donors for rapid life-saving response
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">Registration Error</span>
                  <p className="mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>

              {error.toLowerCase().includes('rate limit') && (
                <div className="mt-2 pt-2.5 border-t border-red-200/70 text-xs text-red-900 space-y-1.5">
                  <p className="font-semibold">How to fix in Supabase:</p>
                  <ol className="list-decimal list-inside space-y-1 text-red-800">
                    <li>Go to Supabase Dashboard &gt; <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; <strong>Email</strong></li>
                    <li>Turn off <strong>&quot;Confirm email&quot;</strong> and click <strong>Save</strong></li>
                  </ol>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
                    >
                      <span>Use 1-Click Demo Logins instead</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
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
                <span className="font-semibold block">Registration Successful</span>
                <p className="mt-0.5 leading-relaxed">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <RoleSelector
              selectedRole={role}
              onChange={setRole}
              disabled={loading}
            />

            {/* Organization / Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-700"
              >
                {role === 'hospital' || role === 'blood_bank'
                  ? 'Facility / Organization Name'
                  : 'Full Name'}
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  disabled={loading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    role === 'hospital'
                      ? 'e.g. City General Hospital'
                      : role === 'blood_bank'
                      ? 'e.g. Red Cross Central Blood Bank'
                      : 'e.g. Priya Sharma'
                  }
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>
            </div>

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
                  placeholder="name@organization.org"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Use a strong password with letters, numbers, and symbols.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create {role === 'hospital' ? 'Hospital' : role === 'blood_bank' ? 'Blood Bank' : role === 'donor' ? 'Donor' : 'Admin'} Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Already have an account */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          LIFE-LINK Emergency Blood Response System
        </p>
      </div>
    </div>
  )
}


import { useState } from 'react'
import { Building2, LogOut, Bell, Droplet, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../services/auth.js'

export default function Header({
  hospitalName = 'City Hospital',
  city = 'Metro',
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onCreateEmergencyClick,
}) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSignOut = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    await signOut()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Role Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Droplet className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                LIFE-LINK
              </span>
              <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                Hospital
              </span>
            </div>
            <p className="text-2xs text-slate-500 leading-none hidden sm:block">
              Emergency Blood Response System
            </p>
          </div>
        </div>

        {/* Center: Hospital identity badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <Building2 className="w-4 h-4 text-blue-600" />
          <div className="text-left leading-tight">
            <span className="text-xs font-semibold text-slate-800 block truncate max-w-[200px]">
              {hospitalName}
            </span>
            <span className="text-2xs text-slate-500 block">
              {city}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Emergency Trigger CTA */}
          <button
            type="button"
            onClick={onCreateEmergencyClick}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Request Blood</span>
            <span className="xs:hidden">Request</span>
          </button>

          {/* Notifications button */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="View notifications"
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-3xs font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Logout button */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loggingOut}
            title="Sign Out"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200/70 transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}


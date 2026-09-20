import { Building2, Droplets, HeartHandshake, ShieldCheck } from 'lucide-react'

const ROLES = [
  {
    id: 'hospital',
    title: 'Hospital',
    description: 'Create & manage emergency blood requests',
    icon: Building2,
  },
  {
    id: 'blood_bank',
    title: 'Blood Bank',
    description: 'Manage inventory & fulfill urgent requests',
    icon: Droplets,
  },
  {
    id: 'donor',
    title: 'Registered Donor',
    description: 'Respond to urgent nearby compatibility calls',
    icon: HeartHandshake,
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'System-wide monitoring, audits & verifications',
    icon: ShieldCheck,
  },
]

/**
 * RoleSelector Component
 * Accessible role selector supporting hospital, blood_bank, donor, and admin roles.
 * Responsive across mobile (375px), tablet (768px), and desktop (1440px).
 */
export default function RoleSelector({ selectedRole, onChange, disabled = false }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Select Your Organization / Account Role <span className="text-red-500">*</span>
      </label>
      <div
        role="radiogroup"
        aria-label="Account role selection"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {ROLES.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id

          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(role.id)}
              className={`relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300 bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <span
                className={`text-sm font-semibold block ${
                  isSelected ? 'text-blue-900' : 'text-slate-900'
                }`}
              >
                {role.title}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 leading-snug">
                {role.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}


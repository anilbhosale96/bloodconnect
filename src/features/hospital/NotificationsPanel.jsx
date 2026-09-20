import { Bell, Check, Clock, X, AlertTriangle } from 'lucide-react'

export default function NotificationsPanel({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Panel Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Emergency Notifications</h3>
                <p className="text-2xs text-slate-500">Live dispatch &amp; fulfillment alerts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
                <p className="font-semibold text-sm text-slate-700">No new notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  You will receive real-time alerts when blood banks accept your emergency requests.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    n.status === 'UNREAD'
                      ? 'bg-blue-50/50 border-blue-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 leading-snug">
                          {n.message}
                        </p>
                        <span className="text-3xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'Just now'}
                        </span>
                      </div>
                    </div>

                    {n.status === 'UNREAD' && onMarkAsRead && (
                      <button
                        onClick={() => onMarkAsRead(n.id)}
                        title="Mark as read"
                        className="text-slate-400 hover:text-blue-600 p-1"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
            <button
              onClick={onClose}
              className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


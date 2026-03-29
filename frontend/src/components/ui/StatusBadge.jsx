const statusConfig = {
  // Appointment statuses
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
  RESCHEDULED: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-200' },
  // Payment statuses
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  UNPAID: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
  REFUNDED: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
  PARTIAL: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', border: 'border-yellow-200' },
  // Generic
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  INACTIVE: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400', border: 'border-gray-200' },
  // Roles
  ADMIN: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  RECEPTIONIST: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500', border: 'border-cyan-200' },
  CASHIER: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', border: 'border-teal-200' },
};

export default function StatusBadge({ status, size = "sm", showDot = true }) {
  const config = statusConfig[status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', border: 'border-gray-200' };
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>}
      {status}
    </span>
  );
}

import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title = "Confirm Action", message = "Are you sure you want to proceed?", confirmLabel = "Confirm", confirmVariant = "danger", loading = false }) {
  const variants = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="py-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variants[confirmVariant] || variants.danger} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

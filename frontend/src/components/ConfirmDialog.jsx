// Reusable confirmation modal for destructive actions (delete, etc).
// Fixes bug: "Destructive actions have no confirmation and no undo."
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/30 p-5 shadow-xl">
        <h3 className="font-display text-lg text-cosmic-gold mb-2">{title}</h3>
        <p className="text-sm text-cosmic-star/70 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-2 rounded-lg text-cosmic-star/70 hover:text-cosmic-star transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm px-4 py-2 rounded-lg bg-red-500/90 text-white font-medium hover:bg-red-500 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

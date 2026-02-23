export default function Card({ title, subtitle, children, right }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      {(title || right) && (
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

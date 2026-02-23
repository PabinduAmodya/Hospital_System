export default function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

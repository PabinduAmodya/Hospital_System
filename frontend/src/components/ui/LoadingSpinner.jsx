import { useState, useEffect } from 'react';

export default function LoadingSpinner({ message = "Loading...", size = "lg" }) {
  const sizes = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
      <p className="text-sm text-gray-500 animate-pulse">{message}</p>
    </div>
  );
}

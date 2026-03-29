export default function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <div className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{startItem}</span> to <span className="font-medium text-gray-700">{endItem}</span> of <span className="font-medium text-gray-700">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Previous
        </button>
        {getPageNumbers().map((page, i) => (
          page === '...' ? (
            <span key={`dots-${i}`} className="px-2 py-1.5 text-sm text-gray-400">...</span>
          ) : (
            <button key={page} onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}>
              {page}
            </button>
          )
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next
        </button>
      </div>
    </div>
  );
}

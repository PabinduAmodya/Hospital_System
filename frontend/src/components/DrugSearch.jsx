import { useState, useEffect, useRef, useCallback } from "react";

export default function DrugSearch({
  onSelect,
  placeholder = "Search medication by brand or generic name...",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchDrugs = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setNoResults(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setNoResults(false);

    try {
      const encoded = encodeURIComponent(searchQuery.trim());
      const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encoded}+openfda.generic_name:${encoded}&limit=15`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) {
          setResults([]);
          setNoResults(true);
          setIsOpen(true);
          return;
        }
        throw new Error("API error");
      }

      const data = await res.json();
      const drugs = (data.results || [])
        .filter((r) => r.openfda?.brand_name?.[0] || r.openfda?.generic_name?.[0])
        .map((r) => ({
          brandName: r.openfda?.brand_name?.[0] || "",
          genericName: r.openfda?.generic_name?.[0] || "",
          dosageForm: r.openfda?.dosage_form?.[0] || "",
          route: r.openfda?.route?.[0] || "",
          manufacturer: r.openfda?.manufacturer_name?.[0] || "",
          fdaNdc: r.openfda?.product_ndc?.[0] || "",
        }));

      // Deduplicate by brandName + genericName
      const seen = new Set();
      const unique = drugs.filter((d) => {
        const key = `${d.brandName}|${d.genericName}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setResults(unique);
      setNoResults(unique.length === 0);
      setIsOpen(true);
    } catch {
      setError("Search unavailable, enter manually");
      setResults([]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchDrugs(value);
    }, 300);
  };

  const handleSelect = (drug) => {
    setQuery(drug.brandName || drug.genericName);
    setIsOpen(false);
    setResults([]);
    if (onSelect) onSelect(drug);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0 || noResults || error) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-gray-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              setError(null);
              setNoResults(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {error && (
            <div className="px-4 py-3 text-sm text-amber-700 bg-amber-50 rounded-xl flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {noResults && !error && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No results found
            </div>
          )}

          {results.map((drug, idx) => (
            <button
              key={`${drug.brandName}-${drug.genericName}-${idx}`}
              onClick={() => handleSelect(drug)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {drug.brandName || "—"}
                  </p>
                  {drug.genericName && (
                    <p className="text-xs text-gray-500 truncate">
                      {drug.genericName}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
                  {drug.dosageForm && (
                    <span className="inline-block text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
                      {drug.dosageForm}
                    </span>
                  )}
                  {drug.route && (
                    <span className="inline-block text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md font-medium">
                      {drug.route}
                    </span>
                  )}
                </div>
              </div>
              {drug.manufacturer && (
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {drug.manufacturer}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

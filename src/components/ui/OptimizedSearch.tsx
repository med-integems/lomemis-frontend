"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedSearch } from "@/hooks/useSimplePerformance";

interface SearchResult<T> {
  item: T;
  score: number;
  matches: string[];
}

interface OptimizedSearchProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  onResults: (results: SearchResult<T>[]) => void;
  placeholder?: string;
  className?: string;
  debounceDelay?: number;
  minSearchLength?: number;
  maxResults?: number;
  highlightMatches?: boolean;
  caseSensitive?: boolean;
  fuzzySearch?: boolean;
  renderResult?: (result: SearchResult<T>, index: number) => React.ReactNode;
  renderNoResults?: () => React.ReactNode;
  showResultsCount?: boolean;
  clearOnSelect?: boolean;
}

const OptimizedSearch = <T extends Record<string, any>>({
  data,
  searchFields,
  onResults,
  placeholder = "Search...",
  className = "",
  debounceDelay = 300,
  minSearchLength = 2,
  maxResults = 50,
  highlightMatches = true,
  caseSensitive = false,
  fuzzySearch = false,
  renderResult,
  renderNoResults,
  showResultsCount = true,
  clearOnSelect = false,
}: OptimizedSearchProps<T>) => {
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [results, setResults] = useState<SearchResult<T>[]>([]);

  // Fuzzy search implementation
  const fuzzyMatch = useCallback(
    (text: string, pattern: string): number => {
      if (!fuzzySearch) {
        return caseSensitive
          ? text.includes(pattern)
            ? 1
            : 0
          : text.toLowerCase().includes(pattern.toLowerCase())
          ? 1
          : 0;
      }

      const textLower = caseSensitive ? text : text.toLowerCase();
      const patternLower = caseSensitive ? pattern : pattern.toLowerCase();

      let score = 0;
      let patternIndex = 0;

      for (
        let i = 0;
        i < textLower.length && patternIndex < patternLower.length;
        i++
      ) {
        if (textLower[i] === patternLower[patternIndex]) {
          score++;
          patternIndex++;
        }
      }

      return patternIndex === patternLower.length ? score / pattern.length : 0;
    },
    [fuzzySearch, caseSensitive]
  );

  // Search function
  const performSearch = useCallback(
    (query: string) => {
      if (query.length < minSearchLength) {
        setResults([]);
        setShowResults(false);
        onResults([]);
        return;
      }

      const searchResults: SearchResult<T>[] = [];

      for (const item of data) {
        let totalScore = 0;
        const matches: string[] = [];

        for (const field of searchFields) {
          const fieldValue = String(item[field] || "");
          const score = fuzzyMatch(fieldValue, query);

          if (score > 0) {
            totalScore += score;
            matches.push(String(field));
          }
        }

        if (totalScore > 0) {
          searchResults.push({
            item,
            score: totalScore,
            matches,
          });
        }
      }

      // Sort by score (descending) and limit results
      const sortedResults = searchResults
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      setResults(sortedResults);
      setShowResults(true);
      setSelectedIndex(-1);
      onResults(sortedResults);
    },
    [data, searchFields, minSearchLength, maxResults, fuzzyMatch, onResults]
  );

  // Debounced search
  const { searchQuery, handleSearch, isSearching } = useDebouncedSearch(
    performSearch,
    debounceDelay
  );

  // Highlight matches in text
  const highlightText = useCallback(
    (text: string, query: string) => {
      if (!highlightMatches || !query) return text;

      const regex = new RegExp(
        `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        caseSensitive ? "g" : "gi"
      );

      const parts = text.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      );
    },
    [highlightMatches, caseSensitive]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showResults || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          setShowResults(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showResults, results, selectedIndex]
  );

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: SearchResult<T>) => {
      onResults([result]);
      setShowResults(false);
      setSelectedIndex(-1);

      if (clearOnSelect) {
        handleSearch("");
      }
    },
    [onResults, clearOnSelect, handleSearch]
  );

  // Default result renderer
  const defaultRenderResult = useCallback(
    (result: SearchResult<T>, index: number) => (
      <div
        key={index}
        className={`px-4 py-2 cursor-pointer transition-colors ${
          index === selectedIndex
            ? "bg-blue-100 text-blue-900"
            : "hover:bg-gray-100"
        }`}
        onClick={() => handleResultSelect(result)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {searchFields.map((field) => {
              const value = String(result.item[field] || "");
              if (!value) return null;

              return (
                <div key={String(field)} className="text-sm">
                  <span className="font-medium text-gray-600 capitalize">
                    {String(field)}:
                  </span>{" "}
                  <span className="text-gray-900">
                    {highlightText(value, searchQuery)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 ml-2">
            Score: {result.score.toFixed(2)}
          </div>
        </div>
      </div>
    ),
    [
      selectedIndex,
      searchFields,
      highlightText,
      searchQuery,
      handleResultSelect,
    ]
  );

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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

        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={() => {
              handleSearch("");
              setShowResults(false);
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

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <>
              {showResultsCount && (
                <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                  {results.length === maxResults &&
                    ` (showing first ${maxResults})`}
                </div>
              )}

              <div className="py-1">
                {results.map((result, index) =>
                  renderResult
                    ? renderResult(result, index)
                    : defaultRenderResult(result, index)
                )}
              </div>
            </>
          ) : searchQuery.length >= minSearchLength ? (
            <div className="px-4 py-8 text-center text-gray-500">
              {renderNoResults ? renderNoResults() : "No results found"}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              Type at least {minSearchLength} characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(OptimizedSearch) as <T extends Record<string, any>>(
  props: OptimizedSearchProps<T>
) => JSX.Element;

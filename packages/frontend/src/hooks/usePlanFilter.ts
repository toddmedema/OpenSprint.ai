import { useState, useEffect, useRef, useCallback } from "react";

const SEARCH_DEBOUNCE_MS = 150;

export function usePlanFilter() {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchExpanded) {
      searchInputRef.current?.focus();
    }
  }, [searchExpanded]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    if (searchInputValue === "") {
      setSearchQuery("");
      return;
    }
    const id = setTimeout(() => {
      searchDebounceRef.current = null;
      setSearchQuery(searchInputValue);
    }, SEARCH_DEBOUNCE_MS);
    searchDebounceRef.current = id;
    return () => {
      clearTimeout(id);
      if (searchDebounceRef.current === id) searchDebounceRef.current = null;
    };
  }, [searchInputValue]);

  const handleSearchExpand = () => {
    setSearchExpanded(true);
  };

  const handleSearchClose = useCallback(() => {
    setSearchInputValue("");
    setSearchQuery("");
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    searchInputRef.current?.blur();
    setSearchExpanded(false);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleSearchClose();
    }
  };

  const isSearchActive = searchQuery.trim().length > 0;

  return {
    searchExpanded,
    searchInputValue,
    setSearchInputValue,
    searchQuery,
    searchInputRef,
    isSearchActive,
    handleSearchExpand,
    handleSearchClose,
    handleSearchKeyDown,
  };
}

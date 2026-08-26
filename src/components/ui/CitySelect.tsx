/**
 * Searchable city pickers backed by the canonical NIGERIAN_CITIES list.
 *
 * CitySelect      — single city (event city, discovery filter)
 * CityMultiSelect — multiple cities (artist available locations)
 *
 * Both are type-to-filter comboboxes with a scrollable result list, so the
 * long canonical list stays usable while guaranteeing that stored values are
 * always exact members of that list.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { NIGERIAN_CITIES } from "@/lib/nigerianCities";

function useOutsideClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

function filterCities(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return NIGERIAN_CITIES;
  return NIGERIAN_CITIES.filter((c) => c.toLowerCase().includes(q));
}

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  placeholder?: string;
  /** Adds an "All cities" reset entry, used by the discovery filter. */
  allowAll?: boolean;
  allLabel?: string;
  className?: string;
  ariaLabel?: string;
}

export function CitySelect({
  value,
  onChange,
  label,
  placeholder = "Choose a city",
  allowAll = false,
  allLabel = "All cities",
  className = "",
  ariaLabel,
}: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useOutsideClose(() => setOpen(false));
  const results = useMemo(() => filterCities(query), [query]);

  const display = !value || (allowAll && value === "all") ? (allowAll ? allLabel : "") : value;

  return (
    <div className={className}>
      {label ? (
        <label className="mb-1 block text-sm font-medium text-foreground-secondary">{label}</label>
      ) : null}
      <div className="relative" ref={ref}>
        <button
          type="button"
          aria-label={ariaLabel ?? label ?? "City"}
          onClick={() => {
            setOpen((v) => !v);
            setQuery("");
          }}
          className="flex h-11 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-left text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <span className={display ? "" : "text-muted-foreground-light"}>{display || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground-light" />
        </button>

        {open ? (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-background shadow-lg">
            <div className="relative border-b border-border">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground-light" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search cities"
                className="h-10 w-full pl-9 pr-3 text-sm focus:outline-none"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {allowAll ? (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onChange("all");
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground hover:bg-brand-tint"
                  >
                    {allLabel}
                    {value === "all" ? <Check className="h-4 w-4 text-brand-hover" /> : null}
                  </button>
                </li>
              ) : null}
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No matching city</li>
              ) : (
                results.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground hover:bg-brand-tint"
                    >
                      {c}
                      {value === c ? <Check className="h-4 w-4 text-brand-hover" /> : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface CityMultiSelectProps {
  values: string[];
  onChange: (cities: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function CityMultiSelect({
  values,
  onChange,
  placeholder = "Add a city",
  className = "",
}: CityMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useOutsideClose(() => setOpen(false));
  const results = useMemo(() => filterCities(query), [query]);

  function toggle(city: string) {
    onChange(values.includes(city) ? values.filter((c) => c !== city) : [...values, city]);
  }

  return (
    <div className={className}>
      {values.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full border border-primary bg-brand-tint px-3 py-1 text-xs font-medium text-brand-hover"
            >
              {c}
              <button
                type="button"
                aria-label={`Remove ${c}`}
                onClick={() => toggle(c)}
                className="text-brand-hover/70 hover:text-brand-hover"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setQuery("");
          }}
          className="flex h-11 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-left text-sm text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {placeholder}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground-light" />
        </button>

        {open ? (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-background shadow-lg">
            <div className="relative border-b border-border">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground-light" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search cities"
                className="h-10 w-full pl-9 pr-3 text-sm focus:outline-none"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No matching city</li>
              ) : (
                results.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground hover:bg-brand-tint"
                    >
                      {c}
                      {values.includes(c) ? <Check className="h-4 w-4 text-brand-hover" /> : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

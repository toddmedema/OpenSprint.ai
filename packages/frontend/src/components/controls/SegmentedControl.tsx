import type React from "react";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  testId?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "compact" | "default";
  activeTone?: "accent" | "neutral";
  dataTestId?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
  size = "default",
  activeTone = "accent",
  dataTestId = "segmented-control",
}: SegmentedControlProps<T>) {
  const activeClasses =
    activeTone === "accent"
      ? "bg-theme-info-bg text-theme-info-text ring-1 ring-theme-info-border"
      : "bg-theme-surface text-theme-text ring-1 ring-theme-border";
  const inactiveClasses =
    "bg-transparent text-theme-muted hover:text-theme-text hover:bg-theme-border-subtle";
  const sizeClasses =
    size === "compact" ? "px-2.5 py-1 text-xs min-h-[36px]" : "px-3 py-1.5 text-sm min-h-[44px]";

  return (
    <div
      role="radiogroup"
      data-testid={dataTestId}
      className={`inline-flex flex-nowrap items-center gap-1 rounded-xl border border-theme-border-subtle bg-theme-surface-muted/50 p-1 ${className}`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.ariaLabel ?? option.label}
            data-testid={option.testId}
            onClick={() => onChange(option.value)}
            disabled={option.disabled}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg min-w-[44px] font-medium transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`}
          >
            <span>{option.label}</span>
            {typeof option.count === "number" && (
              <span className={isActive ? "opacity-90" : "text-theme-muted"}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}


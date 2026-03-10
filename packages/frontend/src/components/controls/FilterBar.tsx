import type { ReactNode } from "react";

interface FilterBarProps {
  left: ReactNode;
  right?: ReactNode;
  dataTestId?: string;
}

export function FilterBar({ left, right, dataTestId }: FilterBarProps) {
  return (
    <div
      className="w-full px-4 sm:px-6 min-h-[48px] flex items-center py-2 border-b border-theme-border-subtle bg-theme-surface shrink-0"
      data-testid={dataTestId}
    >
      <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto overflow-y-visible flex-nowrap py-1">
          {left}
        </div>
        {right ? <div className="flex items-center shrink-0 gap-1 sm:gap-2">{right}</div> : null}
      </div>
    </div>
  );
}


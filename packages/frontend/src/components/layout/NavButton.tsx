import { Link } from "react-router-dom";

/**
 * Reusable nav button matching project topbar style.
 * ~36px height, slight corner rounding, no extra blue border.
 * Single source of truth for nav button styling.
 */
interface NavButtonBaseProps {
  active: boolean;
  children: React.ReactNode;
  variant?: "default" | "icon";
  className?: string;
  title?: string;
  "data-testid"?: string;
  "aria-label"?: string;
  "aria-selected"?: boolean;
  "aria-current"?: "page" | undefined;
  role?: string;
}

interface NavButtonAsLinkProps extends NavButtonBaseProps {
  to: string;
  onClick?: never;
  onKeyDown?: never;
}

interface NavButtonAsButtonProps extends NavButtonBaseProps {
  to?: never;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

type NavButtonProps = NavButtonAsLinkProps | NavButtonAsButtonProps;

const baseClasses =
  "inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-border focus-visible:ring-offset-1";

const iconVariantClasses = "aspect-square min-w-[36px] !p-2";

const activeClasses = "bg-brand-600 text-white";
const inactiveClasses = "text-theme-muted hover:text-theme-text hover:bg-theme-border-subtle";

export function NavButton({
  active,
  children,
  variant = "default",
  className = "",
  title,
  "data-testid": dataTestId,
  "aria-label": ariaLabel,
  "aria-selected": ariaSelected,
  "aria-current": ariaCurrent,
  role,
  ...rest
}: NavButtonProps) {
  const stateClasses = active ? activeClasses : inactiveClasses;
  const variantClasses = variant === "icon" ? iconVariantClasses : "";
  const combinedClassName = [
    baseClasses,
    stateClasses,
    variantClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const commonProps = {
    className: combinedClassName,
    title,
    "data-testid": dataTestId,
    "data-active": active,
    "aria-label": ariaLabel,
    "aria-current": ariaCurrent,
  };

  if ("to" in rest && rest.to) {
    return <Link to={rest.to} {...commonProps}>{children}</Link>;
  }

  return (
    <button
      type="button"
      role={role}
      onClick={"onClick" in rest ? rest.onClick : undefined}
      onKeyDown={"onKeyDown" in rest ? rest.onKeyDown : undefined}
      aria-selected={ariaSelected}
      {...commonProps}
    >
      {children}
    </button>
  );
}

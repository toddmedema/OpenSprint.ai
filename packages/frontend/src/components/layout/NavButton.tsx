import { Link } from "react-router-dom";

/**
 * Reusable nav button matching project topbar style.
 * ~36px height, slight corner rounding, no extra blue border.
 * Single source of truth for nav button styling.
 */
interface NavButtonBaseProps {
  active: boolean;
  children: React.ReactNode;
  /** Visual emphasis for active state. */
  tone?: "neutral" | "accent";
  variant?: "default" | "icon";
  className?: string;
  title?: string;
  /** When true, show a small unread indicator dot in the top-right of the button. */
  showUnreadDot?: boolean;
  "data-testid"?: string;
  "aria-label"?: string;
  "aria-selected"?: boolean;
  "aria-controls"?: string;
  "aria-current"?: "page" | undefined;
  role?: string;
  id?: string;
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

const iconVariantClasses = "aspect-square min-h-[44px] min-w-[44px] !p-2";

const activeToneClasses: Record<"neutral" | "accent", string> = {
  neutral: "bg-theme-border-subtle text-theme-text ring-1 ring-theme-border",
  accent: "bg-brand-600 text-white",
};
const inactiveClasses = "text-theme-muted hover:text-theme-text hover:bg-theme-border-subtle";

export function NavButton({
  active,
  children,
  tone = "neutral",
  variant = "default",
  className = "",
  title,
  showUnreadDot = false,
  "data-testid": dataTestId,
  "aria-label": ariaLabel,
  "aria-selected": ariaSelected,
  "aria-controls": ariaControls,
  "aria-current": ariaCurrent,
  role,
  id,
  ...rest
}: NavButtonProps) {
  const stateClasses = active ? activeToneClasses[tone] : inactiveClasses;
  const variantClasses = variant === "icon" ? iconVariantClasses : "";
  const combinedClassName = [
    baseClasses,
    stateClasses,
    variantClasses,
    showUnreadDot ? "relative" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const dot = showUnreadDot ? (
    <span
      className="absolute top-1 right-1 h-2 w-2 rounded-full bg-theme-info-solid shrink-0"
      aria-hidden
      data-testid="nav-button-unread-dot"
    />
  ) : null;

  const commonProps = {
    className: combinedClassName,
    title,
    "data-testid": dataTestId,
    "data-active": active,
    "aria-label": ariaLabel,
    "aria-controls": ariaControls,
    "aria-current": ariaCurrent,
    id,
  };

  if ("to" in rest && rest.to) {
    return (
      <Link to={rest.to} {...commonProps}>
        {children}
        {dot}
      </Link>
    );
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
      {dot}
    </button>
  );
}

import { NavButton } from "../layout/NavButton";
import { NAVBAR_HEIGHT } from "../../lib/constants";

/** Top-level panels inside Global Settings (homepage or project Global level). */
export type GlobalSettingsPanelTab = "general" | "agents";

const TABS: { key: GlobalSettingsPanelTab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "agents", label: "Agent Config" },
];

interface GlobalSettingsSubTabsBarProps {
  activeTab: GlobalSettingsPanelTab;
  onTabChange: (tab: GlobalSettingsPanelTab) => void;
}

export function GlobalSettingsSubTabsBar({
  activeTab,
  onTabChange,
}: GlobalSettingsSubTabsBarProps) {
  const content = (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-theme-border-subtle p-1">
      {TABS.map((tab) => (
        <NavButton
          key={tab.key}
          active={activeTab === tab.key}
          tone="accent"
          onClick={() => onTabChange(tab.key)}
          data-testid={`global-settings-tab-${tab.key}`}
        >
          {tab.label}
        </NavButton>
      ))}
    </div>
  );

  return (
    <div
      className="px-4 sm:px-6 flex items-center justify-center bg-theme-surface shrink-0 border-b border-theme-border"
      style={{ height: NAVBAR_HEIGHT }}
      data-testid="global-settings-sub-tabs-bar"
    >
      {content}
    </div>
  );
}

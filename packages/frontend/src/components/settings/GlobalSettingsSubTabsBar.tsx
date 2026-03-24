import { NavButton } from "../layout/NavButton";

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
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-xl border border-theme-border-subtle p-1 mb-6"
      data-testid="global-settings-sub-tabs-bar"
    >
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
}

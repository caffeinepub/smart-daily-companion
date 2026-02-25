import { Home, CalendarDays, RefreshCw, Sparkles } from "lucide-react";

export type TabId = "dashboard" | "planner" | "habits" | "motivation";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS = [
  { id: "dashboard" as TabId, label: "Today", icon: Home },
  { id: "planner" as TabId, label: "Planner", icon: CalendarDays },
  { id: "habits" as TabId, label: "Habits", icon: RefreshCw },
  { id: "motivation" as TabId, label: "Inspire", icon: Sparkles },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 safe-bottom">
      {/* Frosted blur bar */}
      <div className="relative">
        {/* Top border accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="bg-card/90 backdrop-blur-xl px-2 py-2">
          <div className="flex items-center justify-around">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[68px] ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {/* Active indicator pill */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-2xl bg-primary/10" />
                  )}
                  <Icon
                    className={`w-5 h-5 relative z-10 transition-all duration-200 ${
                      isActive ? "scale-110" : "scale-100"
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span
                    className={`text-[10px] font-600 relative z-10 transition-all duration-200 ${
                      isActive ? "font-display font-700" : ""
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

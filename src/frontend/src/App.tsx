import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav, { type TabId } from "./components/BottomNav";
import Onboarding from "./components/Onboarding";

// Lazy-load tab screens
const Dashboard = lazy(() => import("./components/Dashboard"));
const Planner = lazy(() => import("./components/Planner"));
const Habits = lazy(() => import("./components/Habits"));
const Motivation = lazy(() => import("./components/Motivation"));

function TabSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-2/3 rounded-xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    return localStorage.getItem("onboardingDone") === "true";
  });

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
  }

  function handleOnboardingComplete(name: string) {
    localStorage.setItem("onboardingDone", "true");
    localStorage.setItem("userName", name);
    setOnboardingDone(true);
  }

  if (!onboardingDone) {
    return (
      <>
        <Onboarding onComplete={handleOnboardingComplete} />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <>
      {/* Desktop wrapper — centers the mobile app */}
      <div className="min-h-dvh bg-gradient-to-br from-slate-100 via-purple-50 to-sky-50 flex items-start justify-center sm:py-0">
        <div className="app-shell relative overflow-hidden min-h-dvh">
          {/* Page content area — scrollable, padded above bottom nav */}
          <main
            className="overflow-y-auto overflow-x-hidden"
            style={{
              paddingBottom: "calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 16px)",
              minHeight: "100dvh",
            }}
          >
            <Suspense fallback={<TabSkeleton />}>
              {activeTab === "dashboard" && (
                <div className="tab-enter">
                  <Dashboard />
                </div>
              )}
              {activeTab === "planner" && (
                <div className="tab-enter">
                  <Planner />
                </div>
              )}
              {activeTab === "habits" && (
                <div className="tab-enter">
                  <Habits />
                </div>
              )}
              {activeTab === "motivation" && (
                <div className="tab-enter">
                  <Motivation />
                </div>
              )}
            </Suspense>
          </main>

          {/* Bottom Navigation */}
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>

      <Toaster richColors position="top-center" />
    </>
  );
}

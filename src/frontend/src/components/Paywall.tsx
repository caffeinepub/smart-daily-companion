import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpgradeSubscription, useSubscriptionStatus } from "../hooks/useQueries";
import { SubscriptionStatus } from "../backend.d";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Crown,
  X,
  Check,
  Loader2,
  Sparkles,
  BarChart3,
  BellOff,
  Infinity as InfinityIcon,
  Star,
} from "lucide-react";

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PlanId = "monthly" | "yearly" | "lifetime";

interface Plan {
  id: PlanId;
  label: string;
  price: string;
  period: string;
  badge?: string;
  highlight?: boolean;
  status: SubscriptionStatus;
}

const PLANS: Plan[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$4.99",
    period: "/ month",
    status: SubscriptionStatus.premium,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "$39.99",
    period: "/ year",
    badge: "Best Value",
    highlight: true,
    status: SubscriptionStatus.premium,
  },
  {
    id: "lifetime",
    label: "Lifetime",
    price: "$99.99",
    period: "one-time",
    status: SubscriptionStatus.lifetime,
  },
];

const BENEFITS = [
  { icon: InfinityIcon, text: "Unlimited AI planning" },
  { icon: BellOff, text: "No advertisements" },
  { icon: BarChart3, text: "Advanced habit analytics" },
  { icon: Sparkles, text: "Personalized motivation" },
];

export default function Paywall({ isOpen, onClose, onSuccess }: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("yearly");
  const [isRestoring, setIsRestoring] = useState(false);

  const upgradeSubscription = useUpgradeSubscription();
  const { refetch: refetchSubscriptionStatus } = useSubscriptionStatus();
  const qc = useQueryClient();

  if (!isOpen) return null;

  const chosen = PLANS.find((p) => p.id === selectedPlan)!;

  async function handleUnlock() {
    try {
      await upgradeSubscription.mutateAsync(chosen.status);
      toast.success("You're now Premium! 🎉");
      onSuccess();
    } catch {
      toast.error("Upgrade failed. Please try again.");
    }
  }

  async function handleRestorePurchase() {
    setIsRestoring(true);
    try {
      await refetchSubscriptionStatus();
      qc.invalidateQueries({ queryKey: ["isPremium"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Purchase restored successfully!");
      onSuccess();
    } catch {
      toast.error("No purchase found to restore.");
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close paywall"
        className="absolute inset-0 w-full h-full bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      {/* Sheet panel */}
      <div className="relative w-full max-w-[430px] bg-card rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden max-h-[92dvh] overflow-y-auto z-10">
        {/* Close button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2">
          {/* Crown icon + title */}
          <div className="text-center mb-6">
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-4">
              <Crown className="w-8 h-8 text-amber-500" />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Star className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-800 text-foreground">
              Unlock Premium
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Take your productivity to the next level
            </p>
          </div>

          {/* Benefits */}
          <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4 mb-6 space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-500 text-foreground">{text}</span>
                <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
              </div>
            ))}
          </div>

          {/* Pricing plans */}
          <div className="space-y-3 mb-6">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative ${
                    plan.highlight && isSelected
                      ? "border-primary bg-primary/8 shadow-soft"
                      : plan.highlight
                      ? "border-primary/50 bg-primary/4"
                      : isSelected
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border/50 bg-card/60 hover:border-primary/30"
                  }`}
                >
                  {/* Best Value badge */}
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] font-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Radio indicator */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border/60"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-700 ${
                            isSelected ? "text-foreground" : "text-foreground/80"
                          }`}
                        >
                          {plan.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.period}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-display text-xl font-800 ${
                        isSelected ? "text-primary" : "text-foreground/80"
                      }`}
                    >
                      {plan.price}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTA button */}
          <Button
            className="w-full rounded-2xl h-13 text-base font-700 shadow-glow mb-3"
            onClick={handleUnlock}
            disabled={upgradeSubscription.isPending}
          >
            {upgradeSubscription.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Crown className="w-4 h-4 mr-2" />
            )}
            {upgradeSubscription.isPending ? "Processing..." : "Unlock Premium"}
          </Button>

          {/* Restore purchase */}
          <button
            type="button"
            onClick={handleRestorePurchase}
            disabled={isRestoring || upgradeSubscription.isPending}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2 disabled:opacity-50"
          >
            {isRestoring ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Restoring...
              </span>
            ) : (
              "Restore Purchase"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

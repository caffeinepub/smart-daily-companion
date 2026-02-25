import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotivationTone } from "../backend.d";
import { useSaveProfile } from "../hooks/useQueries";
import { useGenerateSchedule } from "../hooks/useQueries";
import { getTodayString, timeStringToMinutes } from "../utils/timeUtils";
import { toast } from "sonner";
import {
  Target,
  X,
  Plus,
  Sunrise,
  Moon,
  Zap,
  Briefcase,
  Leaf,
  Loader2,
  Sparkles,
} from "lucide-react";

interface OnboardingProps {
  onComplete: (name: string) => void;
}

const MAX_FREE_GOALS = 5;

const TONE_OPTIONS = [
  {
    value: MotivationTone.calm,
    label: "Calm",
    icon: Leaf,
    desc: "Peaceful & grounding",
    color: "text-mint-DEFAULT",
    bg: "bg-mint-light",
  },
  {
    value: MotivationTone.energetic,
    label: "Energetic",
    icon: Zap,
    desc: "High energy & bold",
    color: "text-peach",
    bg: "bg-peach-light",
  },
  {
    value: MotivationTone.professional,
    label: "Professional",
    icon: Briefcase,
    desc: "Focused & driven",
    color: "text-sky-app",
    bg: "bg-sky-light",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  const [tone, setTone] = useState<MotivationTone>(MotivationTone.calm);
  const [isGenerating, setIsGenerating] = useState(false);

  const saveProfile = useSaveProfile();
  const generateSchedule = useGenerateSchedule();

  function addGoal() {
    const trimmed = goalInput.trim();
    if (!trimmed || goals.length >= MAX_FREE_GOALS) return;
    if (goals.includes(trimmed)) return;
    setGoals((prev) => [...prev, trimmed]);
    setGoalInput("");
  }

  function removeGoal(g: string) {
    setGoals((prev) => prev.filter((x) => x !== g));
  }

  function handleGoalKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addGoal();
    }
  }

  async function handleFinish() {
    setIsGenerating(true);
    try {
      await saveProfile.mutateAsync({
        name: name || "Friend",
        goals,
        wakeTime: timeStringToMinutes(wakeTime),
        sleepTime: timeStringToMinutes(sleepTime),
        motivationTone: tone,
        isPremium: false,
      });
      await generateSchedule.mutateAsync(getTodayString());
      onComplete(name || "Friend");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setIsGenerating(false);
    }
  }

  const steps = [
    { label: "Goals", icon: Target },
    { label: "Routine", icon: Sunrise },
    { label: "Ready!", icon: Sparkles },
  ];

  return (
    <div className="min-h-dvh aurora-bg flex flex-col items-center justify-start">
      <div className="w-full max-w-[430px] flex flex-col min-h-dvh px-6 pt-12 pb-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-800 text-foreground">
            Smart Daily Companion
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let's set you up for success
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground shadow-glow scale-110"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1">
          {step === 0 && (
            <div className="animate-slide-up">
              <h2 className="font-display text-xl font-700 mb-1">
                What's your name?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                We'll personalize your experience.
              </p>
              <Input
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-6 rounded-xl border-border/60 bg-card/60"
              />

              <h2 className="font-display text-xl font-700 mb-1">
                What are your goals?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Add up to 5 goals — we'll build your plan around them.
              </p>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="e.g. Exercise daily"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={handleGoalKeyDown}
                  className="rounded-xl border-border/60 bg-card/60"
                  disabled={goals.length >= MAX_FREE_GOALS}
                />
                <Button
                  size="icon"
                  onClick={addGoal}
                  disabled={
                    !goalInput.trim() || goals.length >= MAX_FREE_GOALS
                  }
                  className="rounded-xl shrink-0 w-10 h-10"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {goals.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {goals.map((g) => (
                    <span key={g} className="chip">
                      {g}
                      <button
                        type="button"
                        onClick={() => removeGoal(g)}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {goals.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No goals added yet — you can skip this.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="font-display text-xl font-700 mb-1">
                Your daily routine
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                When do you wake up and wind down?
              </p>

              <div className="space-y-4 mb-6">
                <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-peach-light flex items-center justify-center shrink-0">
                    <Sunrise className="w-5 h-5 text-peach" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Wake Time
                    </Label>
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="block w-full mt-1 text-lg font-display font-700 bg-transparent border-none outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-lavender-light flex items-center justify-center shrink-0">
                    <Moon className="w-5 h-5 text-lavender-DEFAULT" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Sleep Time
                    </Label>
                    <input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="block w-full mt-1 text-lg font-display font-700 bg-transparent border-none outline-none text-foreground"
                    />
                  </div>
                </div>
              </div>

              <h3 className="font-display text-base font-700 mb-1">
                Motivation style
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                How should we encourage you?
              </p>
              <div className="space-y-2">
                {TONE_OPTIONS.map((t) => {
                  const Icon = t.icon;
                  const selected = tone === t.value;
                  return (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 text-left ${
                        selected
                          ? "border-primary bg-primary/8 shadow-soft"
                          : "border-border/50 bg-card/50 hover:border-primary/40"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.bg}`}
                      >
                        <Icon className={`w-5 h-5 ${t.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {t.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.desc}
                        </p>
                      </div>
                      {selected && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up flex flex-col items-center justify-center min-h-[300px]">
              {isGenerating ? (
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping" />
                    <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-9 h-9 text-primary animate-spin-slow" />
                    </div>
                  </div>
                  <h2 className="font-display text-xl font-700 mb-2">
                    Creating your first plan...
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Our AI is building a personalized schedule based on your
                    goals and routine.
                  </p>
                  <div className="flex gap-1.5 justify-center mt-6">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        style={{
                          animation: `pulse-soft 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center w-full">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center animate-float">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-700 mb-2">
                    You're all set!
                  </h2>
                  <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                    We're ready to generate your first AI-powered daily plan.
                    Tap below to get started.
                  </p>
                  <Button
                    className="w-full rounded-2xl h-13 text-base font-700 shadow-glow"
                    onClick={handleFinish}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Generate My First Plan ✨
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        {!isGenerating && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 rounded-2xl h-12 border-border/60"
              >
                Back
              </Button>
            )}
            {step < 2 && (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 rounded-2xl h-12 font-600"
              >
                Continue
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

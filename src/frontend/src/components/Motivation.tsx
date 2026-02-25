import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMotivationalMessage,
  useStoreMotivationalMessage,
  useProfile,
  useSaveProfile,
} from "../hooks/useQueries";
import { getTodayString } from "../utils/timeUtils";
import { MotivationTone } from "../backend.d";
import { Sunrise, Moon, RefreshCw, Loader2, Leaf, Zap, Briefcase, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TONE_OPTIONS = [
  {
    value: MotivationTone.calm,
    label: "Calm",
    icon: Leaf,
    color: "text-mint-DEFAULT",
    bg: "bg-mint-light",
    activeBg: "bg-mint-DEFAULT text-white",
  },
  {
    value: MotivationTone.energetic,
    label: "Energetic",
    icon: Zap,
    color: "text-peach",
    bg: "bg-peach-light",
    activeBg: "bg-peach text-white",
  },
  {
    value: MotivationTone.professional,
    label: "Professional",
    icon: Briefcase,
    color: "text-sky-app",
    bg: "bg-sky-light",
    activeBg: "bg-sky-app text-white",
  },
];

interface MessageCardProps {
  message: string | null | undefined;
  isLoading: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cardClass: string;
  iconBg: string;
}

function MessageCard({
  message,
  isLoading,
  icon,
  title,
  subtitle,
  cardClass,
  iconBg,
}: MessageCardProps) {
  return (
    <div className={`rounded-3xl p-5 ${cardClass}`}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <p className="font-display font-700 text-base text-foreground">
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full rounded-full" />
          <Skeleton className="h-3.5 w-4/5 rounded-full" />
          <Skeleton className="h-3.5 w-3/5 rounded-full" />
        </div>
      ) : message ? (
        <p className="text-sm text-foreground/85 leading-relaxed italic">
          "{message}"
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Tap "Refresh Messages" to generate today's message.
        </p>
      )}
    </div>
  );
}

export default function Motivation() {
  const today = getTodayString();

  const { data: profile } = useProfile();
  const { data: morningMsg, isLoading: morningLoading } =
    useMotivationalMessage(today, false);
  const { data: eveningMsg, isLoading: eveningLoading } =
    useMotivationalMessage(today, true);
  const storeMsg = useStoreMotivationalMessage();
  const saveProfile = useSaveProfile();

  const currentTone = profile?.motivationTone ?? MotivationTone.calm;

  async function handleChangeTone(tone: MotivationTone) {
    if (!profile || tone === currentTone) return;
    try {
      await saveProfile.mutateAsync({ ...profile, motivationTone: tone });
      toast.success("Motivation style updated!");
    } catch {
      toast.error("Couldn't update style.");
    }
  }

  async function handleRefresh() {
    try {
      await Promise.all([
        storeMsg.mutateAsync({ date: today, isEvening: false }),
        storeMsg.mutateAsync({ date: today, isEvening: true }),
      ]);
      toast.success("Messages refreshed! ✨");
    } catch {
      toast.error("Couldn't refresh messages.");
    }
  }

  return (
    <div className="animate-fade-in px-4 pt-5 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-xl font-800 text-foreground">
          Daily Motivation
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your daily dose of inspiration
        </p>
      </div>

      {/* Tone Selector */}
      <section className="mb-6">
        <p className="text-xs font-700 text-muted-foreground uppercase tracking-wide mb-3">
          Your tone
        </p>
        <div className="grid grid-cols-3 gap-2">
          {TONE_OPTIONS.map((t) => {
            const Icon = t.icon;
            const isActive = currentTone === t.value;
            return (
              <button
                type="button"
                key={t.value}
                onClick={() => handleChangeTone(t.value)}
                className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl border-2 transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/8 shadow-soft"
                    : "border-border/50 bg-card/70 hover:border-primary/30"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? "bg-primary/15" : t.bg
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-primary" : t.color}`}
                  />
                </div>
                <span
                  className={`text-xs font-700 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Messages */}
      <section className="space-y-4 mb-6">
        <MessageCard
          message={morningMsg}
          isLoading={morningLoading}
          icon={<Sunrise className="w-5 h-5 text-peach" />}
          title="Morning Message"
          subtitle="Start your day right"
          cardClass="bg-gradient-to-br from-peach-light via-card to-card border border-peach/20"
          iconBg="bg-peach-light"
        />

        <MessageCard
          message={eveningMsg}
          isLoading={eveningLoading}
          icon={<Moon className="w-5 h-5 text-lavender-DEFAULT" />}
          title="Evening Message"
          subtitle="Reflect & unwind"
          cardClass="bg-gradient-to-br from-lavender-light via-card to-card border border-lavender-DEFAULT/20"
          iconBg="bg-lavender-light"
        />
      </section>

      {/* Refresh button */}
      <Button
        onClick={handleRefresh}
        disabled={storeMsg.isPending}
        className="w-full rounded-2xl h-12 font-600 shadow-soft gap-2"
      >
        {storeMsg.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        Refresh Messages
      </Button>

      {/* Decorative sparkle */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/50 border border-border/40">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">
            AI-generated messages personalized for you
          </span>
        </div>
      </div>

      <div className="h-2" />
    </div>
  );
}

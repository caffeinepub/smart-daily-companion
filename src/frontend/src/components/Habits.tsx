import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAllHabits,
  useCreateHabit,
  useCheckInHabit,
  useDeleteHabit,
  useHabitWeeklySummary,
} from "../hooks/useQueries";
import { getTodayString, getLast7Days, getDayLabel } from "../utils/timeUtils";
import { Flame, Plus, Trash2, Loader2, Trophy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { HabitWithStats } from "../backend.d";

// ─── Weekly Summary per habit ───────────────────────────────────────────────
function HabitWeeklyDots({
  habitId,
  checkedIn,
}: {
  habitId: bigint;
  checkedIn: boolean;
}) {
  const { data: summary } = useHabitWeeklySummary(habitId);
  const last7 = getLast7Days();
  const today = getTodayString();
  const checkIns = summary?.checkIns ?? [];

  return (
    <div className="flex gap-1.5 mt-2">
      {last7.map((day) => {
        const isToday = day === today;
        const isDone = checkIns.includes(day) || (isToday && checkedIn);
        return (
          <div key={day} className="flex flex-col items-center gap-0.5">
            <div
              className={`habit-dot text-[9px] ${
                isDone
                  ? isToday
                    ? "habit-dot-today"
                    : "habit-dot-filled"
                  : "habit-dot-empty"
              }`}
            >
              {isDone ? "✓" : ""}
            </div>
            <span className="text-[8px] text-muted-foreground font-600">
              {getDayLabel(day)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Habit Card ─────────────────────────────────────────────────────────────
interface HabitCardProps {
  hw: HabitWithStats;
  onDelete: (id: bigint) => void;
  onCheckIn: (id: bigint) => void;
  todayCheckIns: Set<string>;
}

function HabitCard({ hw, onDelete, onCheckIn, todayCheckIns }: HabitCardProps) {
  const isCheckedToday = todayCheckIns.has(hw.habit.id.toString());
  const completionPct = Number(hw.completionRate);
  const streak = Number(hw.streak);

  return (
    <div className="rounded-2xl bg-card border border-border/50 shadow-xs overflow-hidden">
      {/* Top area */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-base font-display font-700 text-foreground truncate">
              {hw.habit.name}
            </p>
            {hw.habit.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {hw.habit.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <div className="flex items-center gap-1 bg-peach-light px-2.5 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-peach" />
              <span className="text-xs font-800 text-peach">
                {streak}
              </span>
            </div>
          </div>
        </div>

        {/* Target info */}
        <p className="text-xs text-muted-foreground">
          {Number(hw.habit.targetDaysPerWeek)}×/week
        </p>

        {/* 7-day dots */}
        <HabitWeeklyDots
          habitId={hw.habit.id}
          checkedIn={isCheckedToday}
        />
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground font-600">
            This week
          </span>
          <span className="text-[10px] font-700 text-foreground">
            {completionPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-lavender-DEFAULT to-primary transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <Button
          size="sm"
          onClick={() => onCheckIn(hw.habit.id)}
          disabled={isCheckedToday}
          className={`flex-1 rounded-xl text-xs h-9 transition-all ${
            isCheckedToday
              ? "bg-primary/20 text-primary border border-primary/30 pointer-events-none"
              : ""
          }`}
          variant={isCheckedToday ? "outline" : "default"}
        >
          {isCheckedToday ? "✓ Done today!" : "Check In Today"}
        </Button>
        <button
          type="button"
          onClick={() => onDelete(hw.habit.id)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-border/50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function Habits() {
  const today = getTodayString();
  const { data: habits, isLoading } = useAllHabits();
  const createHabit = useCreateHabit();
  const checkIn = useCheckInHabit();
  const deleteHabit = useDeleteHabit();

  const [showModal, setShowModal] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitDesc, setHabitDesc] = useState("");
  const [targetDays, setTargetDays] = useState([5]);
  const [todayCheckIns, setTodayCheckIns] = useState<Set<string>>(new Set());

  async function handleCreateHabit() {
    const name = habitName.trim();
    if (!name) return;
    try {
      await createHabit.mutateAsync({
        id: 0n,
        name,
        description: habitDesc.trim(),
        targetDaysPerWeek: BigInt(targetDays[0]),
      });
      setHabitName("");
      setHabitDesc("");
      setTargetDays([5]);
      setShowModal(false);
      toast.success("Habit created! 🌱");
    } catch {
      toast.error("Couldn't create habit.");
    }
  }

  async function handleCheckIn(habitId: bigint) {
    const key = habitId.toString();
    if (todayCheckIns.has(key)) return;
    try {
      await checkIn.mutateAsync({ habitId, date: today });
      setTodayCheckIns((prev) => new Set([...prev, key]));
      toast.success("Checked in! 🔥");
    } catch {
      toast.error("Couldn't check in.");
    }
  }

  async function handleDelete(habitId: bigint) {
    try {
      await deleteHabit.mutateAsync(habitId);
      toast.success("Habit removed.");
    } catch {
      toast.error("Couldn't delete habit.");
    }
  }

  const totalCheckInsToday = todayCheckIns.size;
  const totalHabits = habits?.length ?? 0;

  return (
    <div className="animate-fade-in px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-800 text-foreground">
            Habit Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build lasting routines
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-600 shadow-soft active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          New Habit
        </button>
      </div>

      {/* Summary bar */}
      {totalHabits > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 glass-card rounded-2xl p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-peach-light flex items-center justify-center">
              <Flame className="w-4.5 h-4.5 text-peach" />
            </div>
            <div>
              <p className="text-lg font-display font-800 text-foreground">
                {habits
                  ? Math.max(0, ...habits.map((h) => Number(h.streak)))
                  : 0}
              </p>
              <p className="text-[10px] text-muted-foreground font-600">
                Best Streak
              </p>
            </div>
          </div>
          <div className="flex-1 glass-card rounded-2xl p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mint-light flex items-center justify-center">
              <Trophy className="w-4.5 h-4.5 text-mint-DEFAULT" />
            </div>
            <div>
              <p className="text-lg font-display font-800 text-foreground">
                {totalCheckInsToday}/{totalHabits}
              </p>
              <p className="text-[10px] text-muted-foreground font-600">
                Done Today
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Habit list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : habits && habits.length > 0 ? (
        <div className="space-y-3">
          {habits.map((hw) => (
            <HabitCard
              key={hw.habit.id.toString()}
              hw={hw}
              onDelete={handleDelete}
              onCheckIn={handleCheckIn}
              todayCheckIns={todayCheckIns}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-muted/40 border border-border/40 p-8 text-center">
          <RefreshCw className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-display text-base font-700 text-muted-foreground mb-1">
            No habits yet
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Start small. One habit at a time.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-xl"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Your First Habit
          </Button>
        </div>
      )}

      {/* Create Habit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[380px] rounded-3xl border-border/50 mx-4">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-800">
              New Habit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <Label className="text-xs text-muted-foreground font-600 mb-1.5 block">
                Habit name
              </Label>
              <Input
                placeholder="e.g. Morning meditation"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="rounded-xl border-border/60"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-600 mb-1.5 block">
                Description (optional)
              </Label>
              <Textarea
                placeholder="e.g. 10 minutes of mindfulness..."
                value={habitDesc}
                onChange={(e) => setHabitDesc(e.target.value)}
                className="rounded-xl border-border/60 resize-none"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-600 mb-3 block">
                Target days per week:{" "}
                <span className="text-foreground font-800">
                  {targetDays[0]} day{targetDays[0] !== 1 ? "s" : ""}
                </span>
              </Label>
              <div className="px-1">
                <Slider
                  min={1}
                  max={7}
                  step={1}
                  value={targetDays}
                  onValueChange={setTargetDays}
                  className="w-full"
                />
                <div className="flex justify-between mt-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <span
                      key={d}
                      className={`text-[10px] font-600 transition-colors ${
                        d === targetDays[0]
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="rounded-xl border-border/60"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateHabit}
              disabled={!habitName.trim() || createHabit.isPending}
              className="rounded-xl"
            >
              {createHabit.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : null}
              Create Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-2" />
    </div>
  );
}

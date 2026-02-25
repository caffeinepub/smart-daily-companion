import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useTasksByDate,
  useSchedule,
  useAllHabits,
  useMotivationalMessage,
  useCompleteTask,
  useCheckInHabit,
  useProfile,
} from "../hooks/useQueries";
import {
  getTodayString,
  getGreeting,
  formatDisplayDate,
  isEvening,
  minutesToTime,
  minutesToDuration,
} from "../utils/timeUtils";
import { CheckCircle2, Clock, Flame, Star, Quote } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const today = getTodayString();
  const evening = isEvening();

  const { data: profile } = useProfile();
  const { data: tasks, isLoading: tasksLoading } = useTasksByDate(today);
  const { data: schedule, isLoading: scheduleLoading } = useSchedule(today);
  const { data: habits, isLoading: habitsLoading } = useAllHabits();
  const { data: motivationMsg, isLoading: motivationLoading } =
    useMotivationalMessage(today, evening);
  const completeTask = useCompleteTask();
  const checkInHabit = useCheckInHabit();

  const [checkedToday, setCheckedToday] = useState<Set<string>>(new Set());

  const name = profile?.name || localStorage.getItem("userName") || undefined;
  const greeting = getGreeting(name);
  const dateLabel = formatDisplayDate(today);

  const completedTasks = tasks?.filter((t) => t.isCompleted).length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const bestStreak = habits
    ? Math.max(0, ...habits.map((h) => Number(h.streak)))
    : 0;

  async function handleCompleteTask(taskId: bigint, isCompleted: boolean) {
    if (isCompleted) return;
    try {
      await completeTask.mutateAsync(taskId);
      toast.success("Task completed! 🎉");
    } catch {
      toast.error("Couldn't update task.");
    }
  }

  async function handleCheckInHabit(habitId: bigint) {
    const key = habitId.toString();
    if (checkedToday.has(key)) return;
    try {
      await checkInHabit.mutateAsync({ habitId, date: today });
      setCheckedToday((prev) => new Set([...prev, key]));
      toast.success("Habit checked in! 🔥");
    } catch {
      toast.error("Couldn't check in habit.");
    }
  }

  return (
    <div className="animate-fade-in pb-4">
      {/* Header */}
      <div className="aurora-bg px-5 pt-6 pb-5 rounded-b-3xl mb-4">
        <div className="mb-3">
          <h1 className="font-display text-2xl font-800 text-foreground">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {dateLabel}
          </p>
        </div>

        {/* Motivation snippet */}
        {motivationLoading ? (
          <div className="glass-card rounded-2xl p-4">
            <Skeleton className="h-3 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ) : motivationMsg ? (
          <div className="glass-card rounded-2xl p-4 flex gap-3">
            <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 italic leading-relaxed">
              {motivationMsg}
            </p>
          </div>
        ) : null}
      </div>

      <div className="px-4 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl border-border/50 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-light flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-sky-app" />
              </div>
              <div>
                <p className="text-2xl font-display font-800 text-foreground">
                  {completedTasks}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{totalTasks}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Tasks Done
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-peach-light flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-peach" />
              </div>
              <div>
                <p className="text-2xl font-display font-800 text-foreground">
                  {bestStreak}
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    days
                  </span>
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Best Streak
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule — horizontal scroll */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-700 text-foreground">
              Today's Schedule
            </h2>
            <span className="text-xs text-muted-foreground">
              {schedule?.length ?? 0} blocks
            </span>
          </div>

          {scheduleLoading ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-w-[160px] h-[100px] rounded-2xl skeleton-shimmer shrink-0"
                />
              ))}
            </div>
          ) : schedule && schedule.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {schedule.slice(0, 5).map((block) => {
                const idx = schedule.indexOf(block);
                const colors = [
                  "bg-lavender-light border-lavender-DEFAULT/30",
                  "bg-sky-light border-sky-app/30",
                  "bg-peach-light border-peach/30",
                  "bg-mint-light border-mint-DEFAULT/30",
                  "bg-lavender-light border-lavender-DEFAULT/30",
                ];
                const textColors = [
                  "text-lavender-deep",
                  "text-sky-app",
                  "text-peach",
                  "text-mint-DEFAULT",
                  "text-lavender-deep",
                ];
                return (
                  <div
                    key={idx}
                    className={`min-w-[160px] shrink-0 rounded-2xl border p-4 ${colors[idx % colors.length]}`}
                  >
                    <p
                      className={`text-xs font-600 mb-1 ${textColors[idx % textColors.length]}`}
                    >
                      {minutesToTime(block.startTime)} –{" "}
                      {minutesToTime(block.endTime)}
                    </p>
                    <p className="text-sm font-display font-700 text-foreground line-clamp-2">
                      {block.title}
                    </p>
                    {block.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {block.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-muted/50 border border-border/40 p-5 text-center">
              <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No schedule yet — head to Planner to generate one!
              </p>
            </div>
          )}
        </section>

        {/* Habits Today */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-700 text-foreground">
              Habits Today
            </h2>
            {habits && habits.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {checkedToday.size}/{habits.length} done
              </span>
            )}
          </div>

          {habitsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : habits && habits.length > 0 ? (
            <div className="space-y-2">
              {habits.map((hw) => {
                const key = hw.habit.id.toString();
                const isChecked = checkedToday.has(key);
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
                      isChecked
                        ? "bg-primary/8 border-primary/25"
                        : "bg-card border-border/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCheckInHabit(hw.habit.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                        isChecked
                          ? "bg-primary border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {isChecked && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-600 truncate ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {hw.habit.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Flame className="w-3.5 h-3.5 text-peach" />
                      <span className="text-xs font-700 text-foreground">
                        {Number(hw.streak)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-muted/50 border border-border/40 p-5 text-center">
              <Star className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No habits yet — add some in the Habits tab!
              </p>
            </div>
          )}
        </section>

        {/* Tasks list */}
        {tasks && tasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-700 text-foreground">
                Today's Tasks
              </h2>
              <Badge variant="secondary" className="rounded-full text-xs">
                {completedTasks}/{totalTasks}
              </Badge>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id.toString()}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
                    task.isCompleted
                      ? "bg-muted/40 border-border/30"
                      : "bg-card border-border/50"
                  }`}
                >
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={() =>
                      handleCompleteTask(task.id, task.isCompleted)
                    }
                    className="rounded-full"
                  />
                  <span
                    className={`flex-1 text-sm font-500 ${task.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {task.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {minutesToDuration(task.estimatedMinutes)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer spacing */}
        <div className="h-2" />
      </div>
    </div>
  );
}

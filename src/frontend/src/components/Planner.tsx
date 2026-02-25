import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useTasksByDate,
  useCreateTask,
  useCompleteTask,
  useDeleteTask,
  useSchedule,
  useGenerateSchedule,
  useGenerationCount,
  useUpdateSchedule,
} from "../hooks/useQueries";
import {
  getTodayString,
  formatDisplayDate,
  minutesToTime,
  minutesToDuration,
} from "../utils/timeUtils";
import { TaskPriority } from "../backend.d";
import type { TimeBlock } from "../backend.d";
import {
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  CheckCircle2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

const MAX_FREE_GENERATIONS = 3;

const PRIORITY_COLORS: Record<
  TaskPriority,
  { badge: string; dot: string }
> = {
  [TaskPriority.low]: {
    badge: "bg-mint-light text-mint-DEFAULT border-mint-DEFAULT/30",
    dot: "bg-mint-DEFAULT",
  },
  [TaskPriority.medium]: {
    badge: "bg-peach-light text-peach border-peach/30",
    dot: "bg-peach",
  },
  [TaskPriority.high]: {
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
};

interface EditingBlock {
  idx: number;
  title: string;
  notes: string;
}

export default function Planner() {
  const today = getTodayString();
  const { data: tasks, isLoading: tasksLoading } = useTasksByDate(today);
  const { data: schedule, isLoading: scheduleLoading } = useSchedule(today);
  const { data: genCount } = useGenerationCount(today);

  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const generateSchedule = useGenerateSchedule();
  const updateSchedule = useUpdateSchedule();

  const [showAddForm, setShowAddForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskMinutes, setTaskMinutes] = useState("30");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(
    TaskPriority.medium
  );
  const [editingBlock, setEditingBlock] = useState<EditingBlock | null>(null);

  const usedGenerations = Number(genCount ?? 0n);
  const generationsLeft = Math.max(0, MAX_FREE_GENERATIONS - usedGenerations);
  const isQuotaReached = generationsLeft === 0;

  async function handleAddTask() {
    const title = taskTitle.trim();
    if (!title) return;
    try {
      await createTask.mutateAsync({
        id: 0n,
        title,
        description: "",
        estimatedMinutes: BigInt(Math.max(1, parseInt(taskMinutes) || 30)),
        priority: taskPriority,
        date: today,
        isCompleted: false,
      });
      setTaskTitle("");
      setTaskMinutes("30");
      setTaskPriority(TaskPriority.medium);
      setShowAddForm(false);
      toast.success("Task added!");
    } catch {
      toast.error("Couldn't add task.");
    }
  }

  async function handleCompleteTask(taskId: bigint) {
    try {
      await completeTask.mutateAsync(taskId);
    } catch {
      toast.error("Couldn't complete task.");
    }
  }

  async function handleDeleteTask(taskId: bigint) {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task removed.");
    } catch {
      toast.error("Couldn't delete task.");
    }
  }

  async function handleGenerateSchedule() {
    if (isQuotaReached) return;
    try {
      await generateSchedule.mutateAsync(today);
      toast.success("Schedule generated! ✨");
    } catch {
      toast.error("Couldn't generate schedule.");
    }
  }

  async function handleSaveBlock() {
    if (!editingBlock || !schedule) return;
    const updated: TimeBlock[] = schedule.map((b, i) =>
      i === editingBlock.idx
        ? { ...b, title: editingBlock.title, notes: editingBlock.notes }
        : b
    );
    try {
      await updateSchedule.mutateAsync({ date: today, blocks: updated });
      setEditingBlock(null);
      toast.success("Block updated.");
    } catch {
      toast.error("Couldn't update block.");
    }
  }

  return (
    <div className="animate-fade-in px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-800 text-foreground">
            Today's Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDisplayDate(today)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-600 shadow-soft active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <Card className="rounded-2xl border-border/50 mb-5 shadow-soft animate-slide-up overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="rounded-xl border-border/60"
              autoFocus
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Duration (min)
                </Label>
                <Input
                  type="number"
                  min="5"
                  max="480"
                  value={taskMinutes}
                  onChange={(e) => setTaskMinutes(e.target.value)}
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Priority
                </Label>
                <div className="flex gap-1.5">
                  {(
                    [
                      TaskPriority.low,
                      TaskPriority.medium,
                      TaskPriority.high,
                    ] as TaskPriority[]
                  ).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setTaskPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-600 border transition-all capitalize ${
                        taskPriority === p
                          ? PRIORITY_COLORS[p].badge + " shadow-xs"
                          : "bg-muted/50 border-border/40 text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddTask}
                disabled={!taskTitle.trim() || createTask.isPending}
                className="flex-1 rounded-xl"
                size="sm"
              >
                {createTask.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : null}
                Add Task
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border-border/60"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task list */}
      <section className="mb-5">
        <h2 className="font-display text-sm font-700 text-muted-foreground uppercase tracking-wide mb-3">
          Tasks
        </h2>
        {tasksLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => {
              const pc = PRIORITY_COLORS[task.priority];
              return (
                <div
                  key={task.id.toString()}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    task.isCompleted
                      ? "bg-muted/30 border-border/30 opacity-70"
                      : "bg-card border-border/50 shadow-xs"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={task.isCompleted}
                    className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      task.isCompleted
                        ? "bg-primary border-primary"
                        : "border-border hover:border-primary/60"
                    }`}
                  >
                    {task.isCompleted && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-500 truncate ${
                        task.isCompleted
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground">
                        {minutesToDuration(task.estimatedMinutes)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-700 px-2 py-0.5 rounded-full border capitalize shrink-0 ${pc.badge}`}
                  >
                    {task.priority}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-muted/40 border border-border/40 p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No tasks yet. Tap "Add Task" to start!
            </p>
          </div>
        )}
      </section>

      {/* Generate Schedule */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-700 text-muted-foreground uppercase tracking-wide">
            AI Schedule
          </h2>
          {!isQuotaReached ? (
            <Button
              onClick={handleGenerateSchedule}
              disabled={generateSchedule.isPending}
              size="sm"
              className="rounded-xl gap-1.5 text-xs font-600 shadow-soft"
            >
              {generateSchedule.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Generate ({generationsLeft}/{MAX_FREE_GENERATIONS} left)
            </Button>
          ) : null}
        </div>

        {/* Premium upsell */}
        {isQuotaReached && (
          <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-700 text-foreground">
                Daily limit reached
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to Premium for unlimited AI planning.
              </p>
            </div>
            <Button size="sm" className="rounded-xl text-xs shrink-0" variant="outline">
              Upgrade
            </Button>
          </div>
        )}

        {/* Schedule timeline */}
        {scheduleLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : schedule && schedule.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-border/60 rounded-full" />
            <div className="space-y-3">
                {schedule.map((block) => {
                  const idx = schedule.indexOf(block);
                const isEditing = editingBlock?.idx === idx;
                const blockColors = [
                  "bg-lavender-light",
                  "bg-sky-light",
                  "bg-peach-light",
                  "bg-mint-light",
                ];
                const dotColors = [
                  "bg-lavender-DEFAULT",
                  "bg-sky-app",
                  "bg-peach",
                  "bg-mint-DEFAULT",
                ];
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 relative"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`w-4 h-4 rounded-full mt-3.5 shrink-0 z-10 ${dotColors[idx % dotColors.length]}`}
                    />
                    <div className="flex-1 rounded-2xl bg-card border border-border/50 shadow-xs overflow-hidden">
                      {isEditing ? (
                        <div className="p-3.5 space-y-2">
                          <Input
                            value={editingBlock.title}
                            onChange={(e) =>
                              setEditingBlock((prev) =>
                                prev ? { ...prev, title: e.target.value } : prev
                              )
                            }
                            className="rounded-xl border-border/60 text-sm font-600"
                            autoFocus
                          />
                          <Textarea
                            value={editingBlock.notes}
                            onChange={(e) =>
                              setEditingBlock((prev) =>
                                prev ? { ...prev, notes: e.target.value } : prev
                              )
                            }
                            placeholder="Notes..."
                            className="rounded-xl border-border/60 text-sm resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveBlock}
                              disabled={updateSchedule.isPending}
                              className="flex-1 rounded-xl text-xs"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingBlock(null)}
                              className="rounded-xl text-xs border-border/60"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-3.5 ${blockColors[idx % blockColors.length]}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-600 mb-0.5">
                                {minutesToTime(block.startTime)} –{" "}
                                {minutesToTime(block.endTime)}
                              </p>
                              <p className="text-sm font-display font-700 text-foreground">
                                {block.title}
                              </p>
                              {block.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {block.notes}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingBlock({
                                  idx,
                                  title: block.title,
                                  notes: block.notes,
                                })
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-muted/40 border border-border/40 p-5 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isQuotaReached
                ? "Upgrade to Premium to generate more schedules today."
                : "Tap 'Generate' to create your AI-powered schedule."}
            </p>
          </div>
        )}
      </section>

      <div className="h-2" />
    </div>
  );
}

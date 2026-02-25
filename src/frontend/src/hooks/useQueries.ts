import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type {
  UserProfile,
  Task,
  Habit,
  HabitWithStats,
  TimeBlock,
} from "../backend.d";
import { getTodayString } from "../utils/timeUtils";

// ──────────────────────────────────────────────
// Profile
// ──────────────────────────────────────────────

export function useProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.createOrUpdateProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

// ──────────────────────────────────────────────
// Tasks
// ──────────────────────────────────────────────

export function useTasksByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["tasks", date],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTasksByDate(date);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (task: Task) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTask(task);
    },
    onSuccess: (_, task) =>
      qc.invalidateQueries({ queryKey: ["tasks", task.date] }),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.completeTask(taskId);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["tasks", getTodayString()] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteTask(taskId);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["tasks", getTodayString()] }),
  });
}

// ──────────────────────────────────────────────
// Schedule
// ──────────────────────────────────────────────

export function useSchedule(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<TimeBlock[] | null>({
    queryKey: ["schedule", date],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getSchedule(date);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGenerateSchedule() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (date: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.generateSchedule(date);
    },
    onSuccess: (_, date) => {
      qc.invalidateQueries({ queryKey: ["schedule", date] });
      qc.invalidateQueries({ queryKey: ["generationCount", date] });
    },
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: ({ date, blocks }: { date: string; blocks: TimeBlock[] }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateSchedule(date, blocks);
    },
    onSuccess: (_, { date }) =>
      qc.invalidateQueries({ queryKey: ["schedule", date] }),
  });
}

export function useGenerationCount(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["generationCount", date],
    queryFn: async () => {
      if (!actor) return 0n;
      try {
        return await actor.getGenerationCountForDate(date);
      } catch {
        return 0n;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ──────────────────────────────────────────────
// Habits
// ──────────────────────────────────────────────

export function useAllHabits() {
  const { actor, isFetching } = useActor();
  return useQuery<HabitWithStats[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllHabits();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (habit: Habit) => {
      if (!actor) throw new Error("Not connected");
      return actor.createHabit(habit);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useCheckInHabit() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: bigint; date: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.checkInHabit(habitId, date);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: (habitId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteHabit(habitId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useHabitWeeklySummary(habitId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["habitSummary", habitId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getHabitWeeklySummary(habitId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ──────────────────────────────────────────────
// Motivation
// ──────────────────────────────────────────────

export function useMotivationalMessage(date: string, isEve: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["motivation", date, isEve],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMotivationalMessage(date, isEve);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStoreMotivationalMessage() {
  const qc = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: ({ date, isEvening }: { date: string; isEvening: boolean }) => {
      if (!actor) throw new Error("Not connected");
      return actor.storeMotivationalMessage(date, isEvening);
    },
    onSuccess: (_, { date, isEvening }) =>
      qc.invalidateQueries({ queryKey: ["motivation", date, isEvening] }),
  });
}

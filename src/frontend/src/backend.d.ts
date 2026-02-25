import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HabitWithStats {
    streak: bigint;
    habit: Habit;
    completionRate: bigint;
}
export interface Task {
    id: bigint;
    title: string;
    isCompleted: boolean;
    date: string;
    description: string;
    priority: TaskPriority;
    estimatedMinutes: bigint;
}
export interface TimeBlock {
    startTime: bigint;
    title: string;
    endTime: bigint;
    notes: string;
}
export interface Habit {
    id: bigint;
    name: string;
    description: string;
    targetDaysPerWeek: bigint;
}
export interface UserProfile {
    isPremium: boolean;
    motivationTone: MotivationTone;
    name: string;
    sleepTime: bigint;
    wakeTime: bigint;
    goals: Array<string>;
}
export enum MotivationTone {
    calm = "calm",
    energetic = "energetic",
    professional = "professional"
}
export enum TaskPriority {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkInHabit(habitId: bigint, date: string): Promise<void>;
    completeTask(taskId: bigint): Promise<void>;
    createHabit(habit: Habit): Promise<bigint>;
    createOrUpdateProfile(profile: UserProfile): Promise<void>;
    createTask(task: Task): Promise<bigint>;
    deleteHabit(habitId: bigint): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    generateSchedule(date: string): Promise<Array<TimeBlock>>;
    getAllHabits(): Promise<Array<HabitWithStats>>;
    getAllTasks(): Promise<Array<Task>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGenerationCountForDate(date: string): Promise<bigint>;
    getHabitWeeklySummary(habitId: bigint): Promise<{
        habit: Habit;
        completionRate: bigint;
        checkIns: Array<string>;
    } | null>;
    getMotivationalMessage(date: string, isEvening: boolean): Promise<string | null>;
    getProfile(): Promise<UserProfile | null>;
    getSchedule(date: string): Promise<Array<TimeBlock> | null>;
    getTask(taskId: bigint): Promise<Task | null>;
    getTasksByDate(date: string): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    storeMotivationalMessage(date: string, isEvening: boolean): Promise<string>;
    updateHabit(habitId: bigint, habit: Habit): Promise<void>;
    updateSchedule(date: string, blocks: Array<TimeBlock>): Promise<void>;
    updateTask(taskId: bigint, task: Task): Promise<void>;
}

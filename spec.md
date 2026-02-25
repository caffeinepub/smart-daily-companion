# Smart Daily Companion

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full mobile-first web app: Smart Daily Companion
- Onboarding flow (3 steps: goals, daily routine preferences, generate first plan)
- AI Daily Planner: user inputs tasks/goals + wake/sleep time, AI generates a prioritized daily schedule with editable time blocks
- Smart Reminders: in-app context-aware reminders tied to scheduled tasks with motivational messages
- Habit Tracker: add/remove habits, track daily completion, streaks, weekly progress summary
- Daily Motivation: AI-generated motivational messages (morning + evening), with selectable tone (calm, energetic, professional)
- Dashboard: Today's plan overview, habits at a glance, progress stats
- Free vs Premium tier: free users get 3 AI plan generations per day; premium users get unlimited + advanced analytics (premium is a UI flag for now)
- Persistent data storage via backend (tasks, habits, schedules, user preferences, motivation tone)

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend actor with:
   - User profile: goals, wake/sleep time, motivation tone preference, premium status
   - Tasks: CRUD for daily tasks with time blocks
   - Schedule: store AI-generated schedule (list of time blocks with title, time, notes)
   - Habits: CRUD, daily check-in, streak tracking, weekly completion history
   - Motivational messages: store/retrieve morning and evening messages
   - AI plan generation quota (free: 3/day, premium: unlimited) tracking
2. Frontend with:
   - Mobile-first layout (max-width ~430px, centered)
   - Bottom navigation bar: Dashboard, Planner, Habits, Motivation
   - Onboarding flow (first launch): Step 1 - goals, Step 2 - routine (wake/sleep time + tone), Step 3 - generating first plan
   - Dashboard screen: today's schedule summary, habit ring progress, motivational snippet
   - Planner screen: input tasks, generate schedule button, editable schedule block list
   - Habits screen: habit list with streak/check-in, add habit form, weekly summary chart
   - Motivation screen: morning/evening message cards, tone selector
   - Soft color palette (lavender, sky, peach), clean sans-serif typography, smooth page transitions

## UX Notes
- App feels minimal and calm -- no clutter
- Onboarding generates the first plan immediately to deliver value fast
- Habits use a simple checkbox + streak number -- no complex UI
- AI generation is simulated with smart template logic on the backend (no external LLM dependency)
- Premium upgrade prompt appears subtly when free quota is reached
- All data persists across sessions via backend canister storage

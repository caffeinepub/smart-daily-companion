import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Custom types
  type TaskPriority = { #low; #medium; #high };
  type MotivationTone = { #calm; #energetic; #professional };
  type SubscriptionStatus = { #free; #premium; #lifetime };

  type UserProfile = {
    name : Text;
    motivationTone : MotivationTone;
    wakeTime : Nat;
    sleepTime : Nat;
    goals : [Text];
    subscriptionStatus : SubscriptionStatus;
  };

  type Task = {
    id : Nat;
    title : Text;
    date : Text;
    priority : TaskPriority;
    estimatedMinutes : Nat;
    isCompleted : Bool;
    description : Text;
  };

  type TimeBlock = {
    startTime : Nat;
    endTime : Nat;
    notes : Text;
    title : Text;
  };

  type Habit = {
    id : Nat;
    name : Text;
    targetDaysPerWeek : Nat;
    description : Text;
  };

  type HabitCheckIn = {
    habitId : Nat;
    date : Text;
  };

  type MotivationalMessage = {
    date : Text;
    message : Text;
    isEvening : Bool;
  };

  type HabitWithStats = {
    habit : Habit;
    streak : Nat;
    completionRate : Nat;
  };

  module Task {
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Int.compare(task1.id, task2.id);
    };
  };

  // System state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let tasks = Map.empty<Principal, Map.Map<Nat, Task>>();
  let schedules = Map.empty<Principal, Map.Map<Text, [TimeBlock]>>();
  let habits = Map.empty<Principal, Map.Map<Nat, Habit>>();
  let habitCheckIns = Map.empty<Principal, List.List<HabitCheckIn>>();
  let motivationalMessages = Map.empty<Principal, Map.Map<Text, MotivationalMessage>>();
  let dailyGenerationCount = Map.empty<Principal, Map.Map<Text, Nat>>();

  type GenerateScheduleResult = {
    #ok : [TimeBlock];
    #limitReached;
    #profileNotFound;
  };

  // Helper functions
  func getNextTaskId(user : Principal) : Nat {
    let userTasks = switch (tasks.get(user)) {
      case (null) { return 1 };
      case (?taskMap) { taskMap };
    };
    var maxId = 0;
    userTasks.values().forEach(
      func(task) {
        if (task.id > maxId) { maxId := task.id };
      }
    );
    maxId + 1;
  };

  func getNextHabitId(user : Principal) : Nat {
    let userHabits = switch (habits.get(user)) {
      case (null) { return 1 };
      case (?habitMap) { habitMap };
    };
    var maxId = 0;
    userHabits.values().forEach(
      func(habit) {
        if (habit.id > maxId) { maxId := habit.id };
      }
    );
    maxId + 1;
  };

  func incrementGenerationCount(user : Principal, date : Text) : Nat {
    let userCounts = switch (dailyGenerationCount.get(user)) {
      case (null) { Map.empty<Text, Nat>() };
      case (?countMap) { countMap };
    };
    let currentCount = switch (userCounts.get(date)) {
      case (null) { 0 };
      case (?count) { count };
    };
    let newCount = currentCount + 1;
    userCounts.add(date, newCount);
    dailyGenerationCount.add(user, userCounts);
    newCount;
  };

  func getGenerationCount(user : Principal, date : Text) : Nat {
    let userCounts = switch (dailyGenerationCount.get(user)) {
      case (null) { return 0 };
      case (?countMap) { countMap };
    };
    switch (userCounts.get(date)) {
      case (null) { 0 };
      case (?count) { count };
    };
  };

  func generateMotivationalMessage(tone : MotivationTone, isEvening : Bool) : Text {
    if (isEvening) {
      switch (tone) {
        case (#calm) { "Take a moment to reflect on today's accomplishments. Rest well." };
        case (#energetic) { "You crushed it today! Recharge and get ready for tomorrow!" };
        case (#professional) { "Review your progress and prepare for tomorrow's objectives." };
      };
    } else {
      switch (tone) {
        case (#calm) { "Good morning. Take a deep breath and start your day mindfully." };
        case (#energetic) { "Rise and shine! Let's make today amazing!" };
        case (#professional) { "Good morning. Focus on your priorities and execute your plan." };
      };
    };
  };

  func calculateStreak(checkIns : List.List<HabitCheckIn>, habitId : Nat) : Nat {
    let sortedCheckIns = checkIns.toArray().filter(func(c) { c.habitId == habitId });
    if (sortedCheckIns.size() == 0) { return 0 };
    var streak = 1;
    switch (sortedCheckIns.size()) {
      case (size) {
        var i = size;
        while (i > 1) {
          i -= 1;
          streak += 1;
        };
      };
    };
    streak;
  };

  func calculateCompletionRate(checkIns : List.List<HabitCheckIn>, habitId : Nat) : Nat {
    let last7Days = checkIns.toArray().filter(func(c) { c.habitId == habitId });
    if (last7Days.size() == 0) { return 0 };
    (last7Days.size() * 100) / 7;
  };

  // Subscription Management
  public query ({ caller }) func getSubscriptionStatus() : async ?SubscriptionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get subscription status");
    };
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile.subscriptionStatus };
    };
  };

  public shared ({ caller }) func upgradeSubscription(status : SubscriptionStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upgrade subscription");
    };

    let currentProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { p };
    };

    let callerRole = AccessControl.getUserRole(accessControlState, caller);

    if (callerRole == #admin) {
      let updatedProfile = {
        currentProfile with subscriptionStatus = status;
      };
      userProfiles.add(caller, updatedProfile);
      return ();
    };

    switch (currentProfile.subscriptionStatus, status) {
      case (#free, #premium) {
        let updatedProfile = {
          currentProfile with subscriptionStatus = #premium;
        };
        userProfiles.add(caller, updatedProfile);
      };
      case (#free, #lifetime) {
        let updatedProfile = {
          currentProfile with subscriptionStatus = #lifetime;
        };
        userProfiles.add(caller, updatedProfile);
      };
      case (#premium, #lifetime) {
        let updatedProfile = {
          currentProfile with subscriptionStatus = #lifetime;
        };
        userProfiles.add(caller, updatedProfile);
      };
      case (#free, #free) {
        Runtime.trap("No change. Already on free plan");
      };
      case (#premium, #premium) {
        Runtime.trap("No change. Already on premium plan");
      };
      case (#lifetime, _) {
        Runtime.trap("No change. Already on lifetime plan. No further upgrades allowed");
      };
      case (#premium, #free) {
        Runtime.trap("Downgrades from premium to free are not supported");
      };
      case (#lifetime, _) {
        Runtime.trap("Downgrades for lifetime subscriptions are not supported");
      };
      case (_, _) {
        Runtime.trap("Subscription change is not allowed");
      };
    };
  };

  public query ({ caller }) func getIsPremium() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check premium status");
    };
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.subscriptionStatus) {
          case (#premium) { true };
          case (#lifetime) { true };
          case (#free) { false };
        };
      };
    };
  };

  // User Profile - Required by frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // User Profile - Application specific
  public shared ({ caller }) func createOrUpdateProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profile");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profile");
    };
    userProfiles.get(caller);
  };

  // Tasks - CRUD operations with ownership verification
  public shared ({ caller }) func createTask(task : Task) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };
    let taskId = getNextTaskId(caller);
    let newTask : Task = { task with id = taskId };
    let userTasks = switch (tasks.get(caller)) {
      case (null) {
        let newMap = Map.empty<Nat, Task>();
        newMap.add(taskId, newTask);
        newMap;
      };
      case (?taskMap) {
        taskMap.add(taskId, newTask);
        taskMap;
      };
    };
    tasks.add(caller, userTasks);
    taskId;
  };

  public shared ({ caller }) func updateTask(taskId : Nat, task : Task) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { Runtime.trap("Task not found") };
      case (?taskMap) { taskMap };
    };

    switch (userTasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?_) {
        let updatedTask = { task with id = taskId };
        userTasks.add(taskId, updatedTask);
      };
    };
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { Runtime.trap("Task not found") };
      case (?taskMap) { taskMap };
    };

    switch (userTasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?_) {
        userTasks.remove(taskId);
      };
    };
  };

  public shared ({ caller }) func completeTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { Runtime.trap("Task not found") };
      case (?taskMap) { taskMap };
    };

    let taskToComplete = switch (userTasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };

    let updatedTask = { taskToComplete with isCompleted = true };
    userTasks.add(taskId, updatedTask);
  };

  public query ({ caller }) func getTask(taskId : Nat) : async ?Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { return null };
      case (?taskMap) { taskMap };
    };

    userTasks.get(taskId);
  };

  public query ({ caller }) func getTasksByDate(date : Text) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { return [] };
      case (?taskMap) { taskMap };
    };
    let filteredTasks = userTasks.values().toArray().filter(
      func(t) { t.date == date }
    );
    filteredTasks;
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get tasks");
    };

    let userTasks = switch (tasks.get(caller)) {
      case (null) { return [] };
      case (?taskMap) { taskMap };
    };
    userTasks.values().toArray();
  };

  // Schedule - with ownership verification and generation limits
  public shared ({ caller }) func generateSchedule(date : Text) : async GenerateScheduleResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate schedules");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) { return #profileNotFound };
      case (?p) { p };
    };

    let currentCount = getGenerationCount(caller, date);

    switch (profile.subscriptionStatus) {
      case (#free) {
        if (currentCount >= 3) {
          return #limitReached;
        };
      };
      case (_) {}; // No limit for premium and lifetime
    };

    let dayTasks = await getTasksByDate(date);
    let incompleteTasks = dayTasks.filter(func(t) { not t.isCompleted });

    if (incompleteTasks.size() == 0) {
      return #ok([]);
    };

    let wakeTime = profile.wakeTime;
    let sleepTime = profile.sleepTime;
    let availableMinutes = if (sleepTime > wakeTime) {
      (sleepTime.toInt() - wakeTime.toInt()).toNat() * 60;
    } else {
      ((24.toInt() - wakeTime.toInt()).toNat() + sleepTime) * 60;
    };

    var totalTaskMinutes = 0;
    for (task in incompleteTasks.vals()) {
      totalTaskMinutes += task.estimatedMinutes;
    };

    let breakMinutes = if (incompleteTasks.size() > 1) {
      ((incompleteTasks.size() - 1).toInt()).toNat() * 15;
    } else {
      0;
    };

    if (totalTaskMinutes + breakMinutes > availableMinutes) {
      return #ok([]);
    };

    var blocks : [TimeBlock] = [];
    var currentTime = wakeTime * 60;

    for (task in incompleteTasks.vals()) {
      let startTime = currentTime;
      let endTime = currentTime + task.estimatedMinutes;

      let block : TimeBlock = {
        startTime = startTime;
        endTime = endTime;
        title = task.title;
        notes = task.description;
      };

      blocks := blocks.concat([block]);
      currentTime := endTime + 15;
    };

    let userSchedules = switch (schedules.get(caller)) {
      case (null) { Map.empty<Text, [TimeBlock]>() };
      case (?scheduleMap) { scheduleMap };
    };

    userSchedules.add(date, blocks);
    schedules.add(caller, userSchedules);

    ignore incrementGenerationCount(caller, date);

    #ok(blocks);
  };

  public shared ({ caller }) func updateSchedule(date : Text, blocks : [TimeBlock]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update schedule");
    };

    let userSchedules = switch (schedules.get(caller)) {
      case (null) { Map.empty<Text, [TimeBlock]>() };
      case (?scheduleMap) { scheduleMap };
    };

    userSchedules.add(date, blocks);
    schedules.add(caller, userSchedules);
  };

  public query ({ caller }) func getSchedule(date : Text) : async ?[TimeBlock] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get schedules");
    };

    let userSchedules = switch (schedules.get(caller)) {
      case (null) { return null };
      case (?scheduleMap) { scheduleMap };
    };

    userSchedules.get(date);
  };

  public query ({ caller }) func getGenerationCountForDate(date : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check generation count");
    };

    getGenerationCount(caller, date);
  };

  // Habits - CRUD with ownership verification
  public shared ({ caller }) func createHabit(habit : Habit) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create habits");
    };

    let habitId = getNextHabitId(caller);
    let newHabit : Habit = { habit with id = habitId };

    let userHabits = switch (habits.get(caller)) {
      case (null) { Map.empty<Nat, Habit>() };
      case (?habitMap) { habitMap };
    };

    userHabits.add(habitId, newHabit);
    habits.add(caller, userHabits);
    habitId;
  };

  public shared ({ caller }) func updateHabit(habitId : Nat, habit : Habit) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update habits");
    };

    let userHabits = switch (habits.get(caller)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habitMap) { habitMap };
    };

    switch (userHabits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?_) {
        let updatedHabit = { habit with id = habitId };
        userHabits.add(habitId, updatedHabit);
      };
    };
  };

  public shared ({ caller }) func deleteHabit(habitId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete habits");
    };

    let userHabits = switch (habits.get(caller)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habitMap) { habitMap };
    };

    switch (userHabits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?_) {
        userHabits.remove(habitId);
      };
    };
  };

  public shared ({ caller }) func checkInHabit(habitId : Nat, date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check-in habits");
    };

    let userHabits = switch (habits.get(caller)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?habitMap) { habitMap };
    };

    switch (userHabits.get(habitId)) {
      case (null) { Runtime.trap("Habit not found") };
      case (?_) {
        let checkIn : HabitCheckIn = {
          habitId;
          date;
        };

        let userCheckIns = switch (habitCheckIns.get(caller)) {
          case (null) { List.empty<HabitCheckIn>() };
          case (?checkInList) { checkInList };
        };

        userCheckIns.add(checkIn);
        habitCheckIns.add(caller, userCheckIns);
      };
    };
  };

  public query ({ caller }) func getAllHabits() : async [HabitWithStats] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get habits");
    };

    let userHabits = switch (habits.get(caller)) {
      case (null) { return [] };
      case (?habitMap) { habitMap };
    };

    let userCheckIns = switch (habitCheckIns.get(caller)) {
      case (null) { List.empty<HabitCheckIn>() };
      case (?checkInList) { checkInList };
    };

    let habitsArray = userHabits.values().toArray();
    habitsArray.map<Habit, HabitWithStats>(
      func(habit) {
        {
          habit = habit;
          streak = calculateStreak(userCheckIns, habit.id);
          completionRate = calculateCompletionRate(userCheckIns, habit.id);
        };
      }
    );
  };

  public query ({ caller }) func getHabitWeeklySummary(habitId : Nat) : async ?{ habit : Habit; completionRate : Nat; checkIns : [Text] } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get habit summaries");
    };

    let userHabits = switch (habits.get(caller)) {
      case (null) { return null };
      case (?habitMap) { habitMap };
    };

    let habit = switch (userHabits.get(habitId)) {
      case (null) { return null };
      case (?h) { h };
    };

    let userCheckIns = switch (habitCheckIns.get(caller)) {
      case (null) { List.empty<HabitCheckIn>() };
      case (?checkInList) { checkInList };
    };

    let habitCheckInsArray = userCheckIns.toArray().filter(func(c) { c.habitId == habitId });
    let dates = habitCheckInsArray.map(func(c) { c.date });
    let completionRate = calculateCompletionRate(userCheckIns, habitId);

    ?{
      habit = habit;
      completionRate = completionRate;
      checkIns = dates;
    };
  };

  // Motivational Messages - with ownership verification
  public shared ({ caller }) func storeMotivationalMessage(date : Text, isEvening : Bool) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can store motivational messages");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found. Please create a profile first.") };
      case (?p) { p };
    };

    let message = generateMotivationalMessage(profile.motivationTone, isEvening);

    let motivationalMsg : MotivationalMessage = {
      date = date;
      message = message;
      isEvening = isEvening;
    };

    let userMessages = switch (motivationalMessages.get(caller)) {
      case (null) { Map.empty<Text, MotivationalMessage>() };
      case (?msgMap) { msgMap };
    };

    let key = date # (if (isEvening) { "-evening" } else { "-morning" });
    userMessages.add(key, motivationalMsg);
    motivationalMessages.add(caller, userMessages);

    message;
  };

  public query ({ caller }) func getMotivationalMessage(date : Text, isEvening : Bool) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get motivational messages");
    };

    let userMessages = switch (motivationalMessages.get(caller)) {
      case (null) { return null };
      case (?msgMap) { msgMap };
    };

    let key = date # (if (isEvening) { "-evening" } else { "-morning" });
    switch (userMessages.get(key)) {
      case (null) { null };
      case (?msg) { ?msg.message };
    };
  };
};

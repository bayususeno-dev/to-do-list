"use strict";

const STORAGE_KEYS = {
  profile: "todoProfile",
  tasks: "todoTasks",
};

const PRIORITY_RANK = {
  high: 1,
  medium: 2,
  low: 3,
};
import {
  getLocalDateString,
  parseDateOnly,
  fullDateFormatter,
  clockFormatter,
  formatDateOnly,
  formatTimestamp,
  readStorage,
  saveStorage,
} from "./date-reus.js";

/* ========================================
   1. CURRENT DATE & LIVE CLOCK
======================================== */

const currentDateElement = document.getElementById("current-date");
const liveClockElement = document.getElementById("live-clock");

function updateClock() {
  const now = new Date();

  currentDateElement.textContent = fullDateFormatter.format(now);
  currentDateElement.dateTime = getLocalDateString(now);

  liveClockElement.textContent = clockFormatter.format(now);
  liveClockElement.dateTime = now.toISOString();
}

updateClock();

// Refresh the clock every second.
setInterval(updateClock, 1000);

/* ========================================
   2. PROFILE
======================================== */

function loadProfile() {
  const savedProfile = readStorage(STORAGE_KEYS.profile, null);

  if (
    !savedProfile ||
    typeof savedProfile.name !== "string" ||
    typeof savedProfile.division !== "string"
  ) {
    return null;
  }

  return {
    name: savedProfile.name,
    division: savedProfile.division,
  };
}

let profile = loadProfile();

function renderProfile() {
  const profileDisplayName = document.getElementById("profile-display-name");
  const profileDisplayDivision = document.getElementById(
    "profile-display-division",
  );

  if (!profile) {
    profileDisplayName.textContent = "Profile not set";

    profileDisplayDivision.textContent =
      "Add your name and division or position.";

    return;
  }

  profileDisplayName.textContent = profile.name;
  profileDisplayDivision.textContent = profile.division;

  // Fill the inputs so the user can edit the saved profile.
  document.getElementById("profile-name").value = profile.name;
  document.getElementById("profile-division").value = profile.division;

  // Collapse the form when a saved profile already exists.
  document.getElementById("profile-settings").open = false;
}

document.getElementById("profile-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const profileNameInput = document.getElementById("profile-name");
  const profileDivisionInput = document.getElementById("profile-division");
  const profileMessage = document.getElementById("profile-message");

  const name = profileNameInput.value.trim();
  const division = profileDivisionInput.value.trim();

  if (!name || !division) {
    profileMessage.textContent =
      "Please enter both your name and division/position.";

    return;
  }

  const newProfile = {
    name,
    division,
  };

  const savedSuccessfully = saveStorage(STORAGE_KEYS.profile, newProfile);

  profile = newProfile;

  renderProfile();

  profileMessage.textContent = savedSuccessfully
    ? "Profile saved successfully."
    : "Profile updated for this session, but could not be saved in the browser.";
});

/* ========================================
   3. TASK DATA
======================================== */

function createTaskId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isValidTask(task) {
  if (!task || typeof task !== "object") {
    return false;
  }

  const validPriority = Object.hasOwn(PRIORITY_RANK, task.priority);
  const validDeadline = parseDateOnly(task.dueDate) !== null;

  const validCreatedAt =
    typeof task.createdAt === "number" &&
    Number.isFinite(task.createdAt) &&
    Number.isFinite(new Date(task.createdAt).getTime());

  const validCompletedAt =
    task.completedAt === null ||
    (typeof task.completedAt === "number" &&
      Number.isFinite(task.completedAt) &&
      Number.isFinite(new Date(task.completedAt).getTime()));

  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    task.title.trim().length > 0 &&
    validPriority &&
    validDeadline &&
    validCreatedAt &&
    typeof task.completed === "boolean" &&
    validCompletedAt
  );
}

function loadTasks() {
  const savedTasks = readStorage(STORAGE_KEYS.tasks, []);

  if (!Array.isArray(savedTasks)) {
    return [];
  }

  return savedTasks.filter(isValidTask);
}

let tasks = loadTasks();

function persistTasks() {
  return saveStorage(STORAGE_KEYS.tasks, tasks);
}

/* ========================================
   4. CREATE A TASK CARD
======================================== */

function createTaskCard(task) {
  // Get and clone the reusable HTML template.
  const taskTemplate = document.getElementById("task-template");
  const taskItem = taskTemplate.content.firstElementChild.cloneNode(true);

  // DOM elements belonging to this task card.
  const checkbox = taskItem.querySelector(".task-checkbox");
  const checkboxLabel = taskItem.querySelector(".visually-hidden");

  const titleElement = taskItem.querySelector(".task-item-title");
  const priorityElement = taskItem.querySelector(".task-priority");

  const deadlineElement = taskItem.querySelector(".task-deadline-date");
  const createdElement = taskItem.querySelector(".task-created-date");

  const completedContainer = taskItem.querySelector(".task-completed");
  const completedElement = taskItem.querySelector(".task-completed-date");

  const overdueBadge = taskItem.querySelector(".task-overdue-badge");
  const deleteButton = taskItem.querySelector(".task-delete-button");

  const overdue = isOverdue(task);

  // Add CSS classes used to style completed and overdue cards.
  taskItem.classList.toggle("is-completed", task.completed);
  taskItem.classList.toggle("is-overdue", overdue);

  // Task title.
  // textContent displays the title as text instead of interpreting it as HTML.
  titleElement.textContent = task.title;

  // Priority.
  priorityElement.textContent = task.priority;
  priorityElement.classList.add(`priority-${task.priority}`);

  // Deadline.
  deadlineElement.textContent = formatDateOnly(task.dueDate);
  deadlineElement.dateTime = task.dueDate;

  // Date the task was created.
  createdElement.textContent = formatTimestamp(task.createdAt);
  createdElement.dateTime = new Date(task.createdAt).toISOString();

  // Overdue badge.
  overdueBadge.textContent = "Overdue";
  overdueBadge.hidden = !overdue;

  // Checkbox state and accessible label.
  checkbox.checked = task.completed;

  checkboxLabel.textContent = task.completed
    ? `Mark "${task.title}" as not completed`
    : `Mark "${task.title}" as completed`;

  checkbox.addEventListener("change", () => {
    toggleTask(task.id, checkbox.checked);
  });

  // Completed date is only displayed for completed tasks.
  completedContainer.hidden = !task.completed;

  if (task.completed && task.completedAt !== null) {
    completedElement.textContent = formatTimestamp(task.completedAt);
    completedElement.dateTime = new Date(task.completedAt).toISOString();
  }

  // Delete button.
  deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);

  deleteButton.addEventListener("click", () => {
    deleteTask(task.id);
  });

  return taskItem;
}

/* ========================================
   5. RENDER TO DO & DONE
======================================== */

function renderTasks() {
  // DOM elements needed to render the task board.
  const todoList = document.getElementById("todo-list");
  const doneList = document.getElementById("done-list");

  const todoCount = document.getElementById("todo-count");
  const doneCount = document.getElementById("done-count");

  const todoEmptyState = document.getElementById("todo-empty-state");
  const doneEmptyState = document.getElementById("done-empty-state");

  const nextUpTask = document.getElementById("next-up-task");
  const deleteAllButton = document.getElementById("delete-all-button");

  // Divide tasks into incomplete and completed groups.
  const todoTasks = tasks.filter((task) => !task.completed).sort(sortTodoTasks);

  const doneTasks = tasks
    .filter((task) => task.completed)
    .sort((taskA, taskB) => {
      // Most recently completed tasks appear first.
      return (
        (taskB.completedAt ?? taskB.createdAt) -
        (taskA.completedAt ?? taskA.createdAt)
      );
    });

  // Remove previously rendered cards.
  todoList.replaceChildren();
  doneList.replaceChildren();

  // Create and insert incomplete task cards.
  todoTasks.forEach((task) => {
    todoList.appendChild(createTaskCard(task));
  });

  // Create and insert completed task cards.
  doneTasks.forEach((task) => {
    doneList.appendChild(createTaskCard(task));
  });

  // Update task counts.
  todoCount.textContent = todoTasks.length;
  doneCount.textContent = doneTasks.length;

  // Display empty states only when the corresponding list is empty.
  todoEmptyState.hidden = todoTasks.length > 0;
  doneEmptyState.hidden = doneTasks.length > 0;

  // Update empty-state wording.
  todoEmptyState.textContent =
    tasks.length > 0
      ? "No ongoing tasks. You've completed everything!"
      : "No ongoing tasks. Add your first task above.";

  doneEmptyState.textContent = "Completed tasks will appear here.";

  // Update the Next Up card.
  if (todoTasks.length === 0) {
    nextUpTask.textContent =
      tasks.length > 0
        ? "No pending tasks. Great work!"
        : "No tasks yet. Add your first task above.";
  } else {
    const nextTask = todoTasks[0];
    const priority = nextTask.priority.toUpperCase();
    const deadline = formatDateOnly(nextTask.dueDate);

    let status;

    if (isOverdue(nextTask)) {
      status = "OVERDUE";
    } else if (nextTask.dueDate === getLocalDateString()) {
      status = "DUE TODAY";
    } else {
      status = "UPCOMING";
    }

    nextUpTask.textContent = `${nextTask.title} — ${priority} — ${status} — Due ${deadline}`;
  }

  // Prevent an unnecessary Delete All confirmation when nothing exists.
  deleteAllButton.disabled = tasks.length === 0;
}

/* ========================================
   6. ADD TASK
======================================== */

document.getElementById("task-form").addEventListener("submit", (event) => {
  event.preventDefault();

  // DOM elements needed when adding a task.
  const taskTitleInput = document.getElementById("task-title");
  const taskPriorityInput = document.getElementById("task-priority");
  const taskDeadlineInput = document.getElementById("task-deadline");
  const taskFormMessage = document.getElementById("task-form-message");

  const title = taskTitleInput.value.trim();
  const priority = taskPriorityInput.value;
  const deadline = taskDeadlineInput.value;

  if (!title) {
    taskFormMessage.textContent = "Please enter a task description.";
    taskTitleInput.focus();

    return;
  }

  if (!Object.hasOwn(PRIORITY_RANK, priority)) {
    taskFormMessage.textContent = "Please select a valid priority.";
    taskPriorityInput.focus();

    return;
  }

  if (!parseDateOnly(deadline)) {
    taskFormMessage.textContent = "Please select a valid deadline.";
    taskDeadlineInput.focus();

    return;
  }

  const newTask = {
    id: createTaskId(),
    title,
    priority,
    dueDate: deadline,
    createdAt: Date.now(),
    completed: false,
    completedAt: null,
  };

  tasks.push(newTask);

  const savedSuccessfully = persistTasks();

  renderTasks();

  // Clear the form after adding the task.
  event.currentTarget.reset();

  taskFormMessage.textContent = savedSuccessfully
    ? "Task added successfully."
    : "Task added for this session, but could not be saved in the browser.";
});

/* ========================================
   7. COMPLETE / UNCOMPLETE TASK
======================================== */

function toggleTask(taskId, isCompleted) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  task.completed = isCompleted;
  task.completedAt = isCompleted ? Date.now() : null;

  const savedSuccessfully = persistTasks();

  renderTasks();

  const taskBoardMessage = document.getElementById("task-board-message");

  if (!savedSuccessfully) {
    taskBoardMessage.textContent =
      "Task updated for this session, but could not be saved in the browser.";

    return;
  }

  taskBoardMessage.textContent = isCompleted
    ? `"${task.title}" moved to Done.`
    : `"${task.title}" moved back to To Do.`;
}

/* ========================================
   8. TASK STATUS & SORTING
======================================== */

function isOverdue(task, today = getLocalDateString()) {
  return !task.completed && task.dueDate < today;
}

function sortTodoTasks(taskA, taskB) {
  const today = getLocalDateString();

  // Rule 1: Overdue tasks first.
  const taskAIsOverdue = isOverdue(taskA, today);
  const taskBIsOverdue = isOverdue(taskB, today);

  if (taskAIsOverdue !== taskBIsOverdue) {
    return taskAIsOverdue ? -1 : 1;
  }

  // Rule 2: High priority before Medium and Low.
  const priorityDifference =
    PRIORITY_RANK[taskA.priority] - PRIORITY_RANK[taskB.priority];

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  // Rule 3: Earlier deadlines first for equal priorities.
  if (taskA.dueDate !== taskB.dueDate) {
    return taskA.dueDate < taskB.dueDate ? -1 : 1;
  }

  // Final tie-breaker: older task first.
  return taskA.createdAt - taskB.createdAt;
}

/* ========================================
   9. DELETE ONE TASK
======================================== */

function deleteTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  tasks = tasks.filter((item) => item.id !== taskId);

  const savedSuccessfully = persistTasks();

  renderTasks();

  const taskBoardMessage = document.getElementById("task-board-message");

  taskBoardMessage.textContent = savedSuccessfully
    ? `"${task.title}" deleted.`
    : "Task deleted for this session, but the change could not be saved.";
}

/* ========================================
   10. DELETE ALL TASKS
======================================== */

document.getElementById("delete-all-button").addEventListener("click", () => {
  if (tasks.length === 0) {
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete all tasks? This action cannot be undone.",
  );

  if (!confirmed) {
    return;
  }

  tasks = [];

  const savedSuccessfully = persistTasks();

  renderTasks();

  const taskBoardMessage = document.getElementById("task-board-message");

  taskBoardMessage.textContent = savedSuccessfully
    ? "All tasks have been deleted."
    : "Tasks cleared for this session, but the change could not be saved.";
});

/* ========================================
   INITIALIZE APPLICATION
======================================== */
renderProfile();
renderTasks();

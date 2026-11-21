document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("taskList");
  const form = document.getElementById("taskForm");
  if (!list || !form) return;

  const endpoint = `${window.BusinessGrowthAPI.core}/tasks`;
  const token = sessionStorage.getItem("businessGrowthToken");
  const dialog = document.getElementById("taskDialog");
  const statusMessage = document.getElementById("tasksStatus");
  const search = document.getElementById("taskSearch");
  const filterButtons = [...document.querySelectorAll("[data-task-filter]")];
  let tasks = [];
  let activeFilter = "all";

  const today = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const dueDateValue = (task) => task.dueDate ? String(task.dueDate).slice(0, 10) : "";
  const deadlineState = (task) => {
    if (task.status === "done") return "complete";
    const due = dueDateValue(task);
    if (!due) return "";
    const daysRemaining = (Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today()}T00:00:00Z`)) / 86400000;
    if (daysRemaining < 0) return "overdue";
    if (daysRemaining <= 3) return "due-soon";
    return "";
  };
  const request = async (path = "", options = {}) => {
    if (!token) throw new Error("Sign in to manage your tasks.");
    const response = await fetch(`${endpoint}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Could not complete the task request.");
    return result;
  };

  function updateStats() {
    const counts = {
      all: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      in_progress: tasks.filter((task) => task.status === "in_progress").length,
      done: tasks.filter((task) => task.status === "done").length,
    };
    document.getElementById("taskTotalCount").textContent = counts.all;
    document.getElementById("taskOpenCount").textContent = counts.todo;
    document.getElementById("taskProgressCount").textContent = counts.in_progress;
    document.getElementById("taskCompletedCount").textContent = counts.done;
    const oldCompletedCount = document.getElementById("completedCount");
    if (oldCompletedCount) oldCompletedCount.textContent = counts.done;
  }

  function statusLabel(status) {
    return ({ todo: "To do", in_progress: "In progress", done: "Completed" })[status] || "To do";
  }

  function createTaskCard(task) {
    const card = document.createElement("article");
    const deadline = deadlineState(task);
    card.className = `task-card${deadline ? ` is-${deadline}` : ""}`;
    const top = document.createElement("div"); top.className = "task-card-top";
    const titleGroup = document.createElement("div"); titleGroup.className = "task-card-title-group";
    const title = document.createElement("h3"); title.textContent = task.title;
    const category = document.createElement("span"); category.className = "task-category"; category.textContent = task.category || "General";
    titleGroup.append(title, category);
    const priority = document.createElement("span"); priority.className = `task-priority priority-${task.priority}`; priority.textContent = `${task.priority} priority`;
    top.append(titleGroup, priority);
    card.appendChild(top);
    if (task.description) { const description = document.createElement("p"); description.className = "task-description"; description.textContent = task.description; card.appendChild(description); }

    const footer = document.createElement("div"); footer.className = "task-card-footer";
    const meta = document.createElement("div"); meta.className = "task-card-meta";
    const due = dueDateValue(task);
    if (due) {
      const dueLabel = document.createElement("span");
      const dueIsOverdue = deadline === "overdue";
      dueLabel.className = `task-due${dueIsOverdue ? " overdue" : deadline === "due-soon" ? " due-soon" : deadline === "complete" ? " completed" : ""}`;
      dueLabel.innerHTML = `<i class="bi bi-calendar-event" aria-hidden="true"></i>`;
      dueLabel.append(` ${dueIsOverdue ? "Overdue · " : "Due "}${new Date(`${due}T00:00:00`).toLocaleDateString()}`);
      meta.appendChild(dueLabel);
    } else {
      const noDue = document.createElement("span"); noDue.className = "task-due"; noDue.textContent = "No due date"; meta.appendChild(noDue);
    }
    const statusSelect = document.createElement("select");
    statusSelect.className = `task-status-select status-${task.status}`;
    statusSelect.setAttribute("aria-label", `Status for ${task.title}`);
    [["todo", "To do"], ["in_progress", "In progress"], ["done", "Completed"]].forEach(([value, label]) => {
      const option = document.createElement("option"); option.value = value; option.textContent = label; option.selected = task.status === value; statusSelect.appendChild(option);
    });
    statusSelect.addEventListener("change", async () => {
      statusMessage.textContent = "Updating task…";
      try { await request(`/${task._id}`, { method: "PATCH", body: JSON.stringify({ status: statusSelect.value }) }); await loadTasks(); }
      catch (error) { statusMessage.textContent = error.message; }
    });
    meta.appendChild(statusSelect);

    const actions = document.createElement("div"); actions.className = "task-card-actions";
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "task-action-button"; edit.innerHTML = '<i class="bi bi-pencil"></i> Edit';
    edit.addEventListener("click", () => openTaskDialog(task));
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "task-action-button task-delete-button"; remove.innerHTML = '<i class="bi bi-trash3"></i> Delete';
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Delete “${task.title}”?`)) return;
      try { await request(`/${task._id}`, { method: "DELETE" }); statusMessage.textContent = "Task deleted."; await loadTasks(); }
      catch (error) { statusMessage.textContent = error.message; }
    });
    actions.append(edit, remove); footer.append(meta, actions); card.appendChild(footer);
    return card;
  }

  function render() {
    updateStats();
    const query = (search?.value || "").trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      const matchesFilter = activeFilter === "all" || (activeFilter === "overdue" ? Boolean(dueDateValue(task) && dueDateValue(task) < today() && task.status !== "done") : task.status === activeFilter);
      const matchesSearch = !query || `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
    list.replaceChildren();
    filtered.forEach((task) => list.appendChild(createTaskCard(task)));
    if (!filtered.length) {
      const empty = document.createElement("div"); empty.className = "task-empty-state";
      const icon = document.createElement("i"); icon.className = "bi bi-check2-circle";
      const heading = document.createElement("strong"); heading.textContent = tasks.length ? "No matching tasks" : "Nothing on your list yet";
      const detail = document.createElement("span"); detail.textContent = tasks.length ? "Try another filter or search term." : "Add your first task to start organising your work.";
      empty.append(icon, heading, detail); list.appendChild(empty);
    }
  }

  async function loadTasks() {
    statusMessage.textContent = "Loading tasks…";
    try {
      const result = await request();
      tasks = result.tasks || [];
      const statusOrder = { todo: 0, in_progress: 1, done: 2 };
      tasks.sort((a, b) => {
        const statusDifference = (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1);
        if (statusDifference) return statusDifference;
        const aDue = dueDateValue(a) || "9999-12-31";
        const bDue = dueDateValue(b) || "9999-12-31";
        return aDue.localeCompare(bDue);
      });
      statusMessage.textContent = tasks.length ? `${tasks.length} task${tasks.length === 1 ? "" : "s"}` : "Your tasks are saved to your account.";
      render();
      window.dispatchEvent(new Event("businessgrowth:tasks-updated"));
    } catch (error) {
      tasks = [];
      updateStats();
      list.replaceChildren();
      statusMessage.textContent = error.message;
      const empty = document.createElement("div"); empty.className = "task-empty-state"; empty.textContent = "Sign in and make sure the BusinessGrowth server is running on port 4000."; list.appendChild(empty);
    }
  }

  function openTaskDialog(task = null) {
    form.reset();
    document.getElementById("taskId").value = task?._id || "";
    document.getElementById("taskTitle").value = task?.title || "";
    document.getElementById("taskDescription").value = task?.description || "";
    document.getElementById("taskDueDate").value = dueDateValue(task || {});
    document.getElementById("taskPriority").value = task?.priority || "medium";
    document.getElementById("taskCategory").value = task?.category || "General";
    document.getElementById("taskStatusSelect").value = task?.status || "todo";
    document.getElementById("taskDialogHeading").textContent = task ? "Edit task" : "Create a task";
    document.getElementById("saveTaskButton").textContent = task ? "Save changes" : "Save task";
    document.getElementById("taskFormError").textContent = "";
    dialog.showModal();
    document.getElementById("taskTitle").focus();
  }

  document.getElementById("createTaskButton").addEventListener("click", () => openTaskDialog());
  document.getElementById("closeTaskDialog").addEventListener("click", () => dialog.close());
  document.getElementById("cancelTaskDialog").addEventListener("click", () => dialog.close());
  filterButtons.forEach((button) => button.addEventListener("click", () => {
    activeFilter = button.dataset.taskFilter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    render();
  }));
  search?.addEventListener("input", render);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("taskId").value;
    const payload = {
      title: document.getElementById("taskTitle").value,
      description: document.getElementById("taskDescription").value,
      dueDate: document.getElementById("taskDueDate").value || null,
      priority: document.getElementById("taskPriority").value,
      category: document.getElementById("taskCategory").value || "General",
      status: document.getElementById("taskStatusSelect").value,
    };
    const saveButton = document.getElementById("saveTaskButton");
    const error = document.getElementById("taskFormError");
    saveButton.disabled = true; error.textContent = "";
    try {
      await request(id ? `/${id}` : "", { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) });
      dialog.close(); statusMessage.textContent = id ? "Task updated." : "Task created."; await loadTasks();
    } catch (saveError) { error.textContent = saveError.message; }
    finally { saveButton.disabled = false; }
  });

  loadTasks();
});

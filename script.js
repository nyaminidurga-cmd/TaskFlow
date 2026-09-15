/* =====================================================
   TASKFLOW
   ===================================================== */


/* ================= STORAGE ================= */

const STORAGE_KEY = "taskflowTasks";
const THEME_KEY = "taskflowDark";


/* ================= VARIABLES ================= */

let tasks = [];

let currentFilter = "today";

let selectedDifficulty = "medium";

let finishTaskId = null;

let reminderInterval = null;

let audioContext = null;


/* ================= SHORTCUT ================= */

function $(id) {
    return document.getElementById(id);
}


/* ================= DATE ================= */

function getToday() {

    const d = new Date();

    const year = d.getFullYear();

    const month =
        String(d.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(d.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* ================= DATE FORMAT ================= */

function formatDate(date) {

    if (!date) return "";

    const parts = date.split("-");

    if (parts.length !== 3) {
        return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


/* ================= CAPITALIZE ================= */

function capitalize(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase()
        + text.slice(1);
}


/* ================= ESCAPE ================= */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* ================= LOAD TASKS ================= */

function loadTasks() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        tasks =
            saved
                ? JSON.parse(saved)
                : [];

        if (!Array.isArray(tasks)) {
            tasks = [];
        }

    }
    catch {

        tasks = [];

    }
}


/* ================= SAVE ================= */

function saveTasks() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}


/* ================= MIGRATE OLD TASKS ================= */

function migrateTasks() {

    tasks.forEach(task => {

        if (!task.repeat) {
            task.repeat = "none";
        }

        if (!task.priority) {
            task.priority = "medium";
        }

        if (!task.difficulty) {
            task.difficulty = "medium";
        }

        if (typeof task.completed !== "boolean") {
            task.completed = false;
        }

        if (!("completedDate" in task)) {
            task.completedDate = null;
        }

        if (!("lastRemindedDate" in task)) {
            task.lastRemindedDate = null;
        }

        if (!("permanentlyFinished" in task)) {
            task.permanentlyFinished = false;
        }

    });

    saveTasks();
}


/* ================= ACTIVE ================= */

function isActive(task) {

    return !task.permanentlyFinished;
}


/* ================= COMPLETED TODAY ================= */

function isCompletedToday(task) {

    if (task.repeat === "daily") {

        return task.completedDate === getToday();

    }

    return task.completed === true;
}


/* ================= DUE TODAY ================= */

function isDueToday(task) {

    const today = getToday();

    if (task.repeat === "daily") {

        return task.date <= today;

    }

    return task.date === today;
}


/* ================= RENDER ================= */

function render() {

    renderStats();

    renderTasks();

}


/* ================= STATS ================= */

function renderStats() {

    const todayTasks =
        tasks.filter(task =>
            isActive(task) &&
            isDueToday(task)
        );


    const completed =
        todayTasks.filter(task =>
            isCompletedToday(task)
        );


    $("todayCount").textContent =
        todayTasks.length;


    $("completedCount").textContent =
        completed.length;
}


/* ================= SEARCH ================= */

function getSearch() {

    return $("searchInput")
        .value
        .trim()
        .toLowerCase();
}


/* ================= FILTER ================= */

function getVisibleTasks() {

    const search = getSearch();

    let result = [];


    if (currentFilter === "today") {

        result = tasks.filter(task =>
            isActive(task) &&
            isDueToday(task)
        );

    }


    else if (currentFilter === "all") {

        result = tasks.filter(task =>
            isActive(task)
        );

    }


    else if (currentFilter === "pending") {

        result = tasks.filter(task =>
            isActive(task) &&
            !isCompletedToday(task)
        );

    }


    else if (currentFilter === "completed") {

        result = tasks.filter(task =>
            isActive(task) &&
            isCompletedToday(task)
        );

    }


    else if (currentFilter === "finished") {

        result = tasks.filter(task =>
            task.permanentlyFinished
        );

    }


    if (search) {

        result = result.filter(task =>
            task.name
                .toLowerCase()
                .includes(search)
        );

    }


    return result;
}


/* ================= RENDER TASKS ================= */

function renderTasks() {

    const list =
        getVisibleTasks();


    if (currentFilter === "today") {

        $("todayView").style.display =
            "block";

        $("singleView").style.display =
            "none";

        renderToday(list);

    }

    else {

        $("todayView").style.display =
            "none";

        $("singleView").style.display =
            "block";

        renderSingle(list);

    }
}


/* ================= TODAY ================= */

function renderToday(list) {

    const daily =
        list.filter(task =>
            task.repeat === "daily"
        );


    const extra =
        list.filter(task =>
            task.repeat === "none"
        );


    $("dailyCount").textContent =
        daily.length;


    $("extraCount").textContent =
        extra.length;


    $("dailyTasks").innerHTML = "";

    $("extraTasks").innerHTML = "";


    daily.forEach(task => {

        createTaskCard(
            task,
            $("dailyTasks")
        );

    });


    extra.forEach(task => {

        createTaskCard(
            task,
            $("extraTasks")
        );

    });


    $("dailySection").style.display =
        daily.length
            ? "block"
            : "none";


    $("extraSection").style.display =
        extra.length
            ? "block"
            : "none";


    updateEmptyState(
        daily.length + extra.length
    );
}


/* ================= OTHER LIST ================= */

function renderSingle(list) {

    $("singleList").innerHTML = "";


    list.forEach(task => {

        createTaskCard(
            task,
            $("singleList")
        );

    });


    updateEmptyState(
        list.length
    );
}


/* ================= EMPTY ================= */

function updateEmptyState(count) {

    $("emptyState")
        .classList
        .toggle(
            "show",
            count === 0
        );
}


/* ================= TASK CARD ================= */

function createTaskCard(task, container) {

    const card =
        document.createElement("div");


    const completed =
        isCompletedToday(task);


    card.className =
        "task-card" +
        (completed ? " completed" : "");


    const repeatText =
        task.repeat === "daily"
            ? "Every day"
            : "One time";


    card.innerHTML = `

        <button
            class="check-btn"
            title="${
                completed
                    ? "Mark as pending"
                    : "Complete task"
            }"
        >
            ${completed ? "✓" : ""}
        </button>


        <div class="task-content">

            <div class="task-name">
                ${escapeHtml(task.name)}
            </div>


            <div class="badges">

                <span class="badge priority-${task.priority}">
                    ${capitalize(task.priority)}
                    Priority
                </span>


                <span class="badge">
                    ${capitalize(task.difficulty)}
                </span>


                <span class="badge">
                    ${repeatText}
                </span>


                ${
                    task.time
                        ? `
                            <span class="badge">
                                🔔 ${task.time}
                            </span>
                          `
                        : ""
                }


                <span class="badge">
                    📅 ${formatDate(task.date)}
                </span>

            </div>

        </div>


        <div class="task-actions">

            <button
                class="action-btn edit-btn"
                title="Edit"
            >
                ✏️
            </button>


            <button
                class="action-btn finish-btn"
                title="Finish permanently"
            >
                🏁
            </button>


            <button
                class="action-btn delete-btn"
                title="Delete"
            >
                🗑️
            </button>

        </div>

    `;


    card
        .querySelector(".check-btn")
        .addEventListener(
            "click",
            () => toggleComplete(task.id)
        );


    card
        .querySelector(".edit-btn")
        .addEventListener(
            "click",
            () => openEdit(task.id)
        );


    card
        .querySelector(".finish-btn")
        .addEventListener(
            "click",
            () => askFinish(task.id)
        );


    card
        .querySelector(".delete-btn")
        .addEventListener(
            "click",
            () => deleteTask(task.id)
        );


    container.appendChild(card);
}


/* ================= COMPLETE ================= */

function toggleComplete(id) {

    const task =
        tasks.find(task =>
            task.id === id
        );


    if (!task || task.permanentlyFinished) {
        return;
    }


    if (task.repeat === "daily") {

        if (isCompletedToday(task)) {

            task.completedDate = null;

        }
        else {

            task.completedDate = getToday();

        }

    }

    else {

        task.completed =
            !task.completed;

    }


    saveTasks();

    render();
}


/* ================= DELETE ================= */

function deleteTask(id) {

    const task =
        tasks.find(task =>
            task.id === id
        );


    if (!task) return;


    const answer =
        confirm(
            `Delete "${task.name}"?`
        );


    if (!answer) return;


    tasks =
        tasks.filter(task =>
            task.id !== id
        );


    saveTasks();

    render();
}


/* ================= ASK FINISH ================= */

function askFinish(id) {

    const task =
        tasks.find(task =>
            task.id === id
        );


    if (!task) return;


    finishTaskId = id;


    $("confirmText").textContent =
        `"${task.name}" will be moved to Finished.`;


    $("confirmModal")
        .classList
        .add("show");
}


/* ================= CONFIRM FINISH ================= */

$("confirmFinish")
    .addEventListener(
        "click",
        () => {

            const task =
                tasks.find(task =>
                    task.id === finishTaskId
                );


            if (task) {

                task.permanentlyFinished =
                    true;

            }


            finishTaskId = null;


            $("confirmModal")
                .classList
                .remove("show");


            saveTasks();

            render();

        }
    );


/* ================= CANCEL FINISH ================= */

$("cancelConfirm")
    .addEventListener(
        "click",
        () => {

            finishTaskId = null;

            $("confirmModal")
                .classList
                .remove("show");

        }
    );


/* ================= DIFFICULTY ================= */

function setDifficulty(value) {

    selectedDifficulty = value;


    document
        .querySelectorAll(".difficulty")
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.value === value
            );

        });
}


/* ================= DIFFICULTY BUTTONS ================= */

document
    .querySelectorAll(".difficulty")
    .forEach(button => {

        button.addEventListener(
            "click",
            () =>
                setDifficulty(
                    button.dataset.value
                )
        );

    });


/* ================= CREATE ================= */

function openCreate() {

    $("taskForm").reset();


    $("editTaskId").value = "";


    $("taskDate").value =
        getToday();


    $("taskPriority").value =
        "medium";


    $("taskRepeat").value =
        "none";


    $("modalTitle").textContent =
        "Create a Task";


    setDifficulty("medium");


    $("dailyInfo").style.display =
        "none";


    $("taskModal")
        .classList
        .add("show");
}


/* ================= EDIT ================= */

function openEdit(id) {

    const task =
        tasks.find(task =>
            task.id === id
        );


    if (!task) return;


    $("editTaskId").value =
        task.id;


    $("taskName").value =
        task.name;


    $("taskDate").value =
        task.date;


    $("taskTime").value =
        task.time || "";


    $("taskPriority").value =
        task.priority;


    $("taskRepeat").value =
        task.repeat;


    setDifficulty(
        task.difficulty
    );


    $("dailyInfo").style.display =
        task.repeat === "daily"
            ? "block"
            : "none";


    $("modalTitle").textContent =
        "Edit Task";


    $("taskModal")
        .classList
        .add("show");
}


/* ================= CREATE BUTTON ================= */

$("createTaskBtn")
    .addEventListener(
        "click",
        openCreate
    );


/* ================= CLOSE MODAL ================= */

function closeTaskModal() {

    $("taskModal")
        .classList
        .remove("show");
}


$("closeTaskModal")
    .addEventListener(
        "click",
        closeTaskModal
    );


$("cancelTask")
    .addEventListener(
        "click",
        closeTaskModal
    );


/* ================= TASK TYPE ================= */

$("taskRepeat")
    .addEventListener(
        "change",
        () => {

            $("dailyInfo").style.display =
                $("taskRepeat").value === "daily"
                    ? "block"
                    : "none";

        }
    );


/* ================= SAVE TASK ================= */

$("taskForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const id =
                $("editTaskId").value;


            const name =
                $("taskName")
                    .value
                    .trim();


            const date =
                $("taskDate").value;


            const time =
                $("taskTime").value;


            const priority =
                $("taskPriority").value;


            const repeat =
                $("taskRepeat").value;


            if (!name || !date) {
                return;
            }


            const data = {

                name: name,

                date: date,

                time: time,

                priority: priority,

                repeat: repeat,

                difficulty:
                    selectedDifficulty

            };


            /* EDIT */

            if (id) {

                const task =
                    tasks.find(task =>
                        String(task.id) ===
                        String(id)
                    );


                if (task) {

                    Object.assign(
                        task,
                        data
                    );

                }

            }


            /* CREATE */

            else {

                tasks.push({

                    id: Date.now(),

                    ...data,

                    completed: false,

                    completedDate: null,

                    lastRemindedDate: null,

                    permanentlyFinished: false

                });

            }


            saveTasks();

            closeTaskModal();

            render();

        }
    );


/* ================= NAVIGATION ================= */

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentFilter =
                    button.dataset.filter;


                document
                    .querySelectorAll(".nav-item")
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                const titles = {

                    today:
                        "Today's Tasks",

                    all:
                        "All Tasks",

                    pending:
                        "Pending Tasks",

                    completed:
                        "Completed Tasks",

                    finished:
                        "Finished Tasks"

                };


                $("pageTitle").textContent =
                    titles[currentFilter];


                render();

            }
        );

    });


/* ================= SEARCH ================= */

$("searchInput")
    .addEventListener(
        "input",
        render
    );


/* =====================================================
   REMINDERS
   ===================================================== */

function checkReminders() {

    const now = new Date();

    const today = getToday();


    const currentTime =
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;


    const task =
        tasks.find(task => {

            if (!isActive(task)) {
                return false;
            }


            if (task.time !== currentTime) {
                return false;
            }


            if (
                task.lastRemindedDate ===
                today
            ) {
                return false;
            }


            if (isCompletedToday(task)) {
                return false;
            }


            if (task.repeat === "daily") {

                return task.date <= today;

            }


            return task.date === today;

        });


    if (!task) {
        return;
    }


    task.lastRemindedDate =
        today;


    saveTasks();


    showReminder(task);
}


/* ================= SHOW REMINDER ================= */

function showReminder(task) {

    $("reminderTitle").textContent =
        task.name;


    $("reminderText").textContent =
        task.repeat === "daily"
            ? "It's time for your daily task."
            : "It's time for your task.";


    $("reminderModal")
        .classList
        .add("show");


    playChime();


    clearInterval(
        reminderInterval
    );


    reminderInterval =
        setInterval(
            () => {

                if (
                    $("reminderModal")
                        .classList
                        .contains("show")
                ) {

                    playChime();

                }

            },
            5000
        );
}


/* ================= DISMISS REMINDER ================= */

$("dismissReminder")
    .addEventListener(
        "click",
        () => {

            $("reminderModal")
                .classList
                .remove("show");


            clearInterval(
                reminderInterval
            );

        }
    );


/* ================= SOUND ================= */

function playChime() {

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        const notes = [
            523.25,
            659.25,
            783.99
        ];


        notes.forEach(
            (frequency, index) => {

                const oscillator =
                    audioContext
                        .createOscillator();


                const gain =
                    audioContext
                        .createGain();


                oscillator.type =
                    "sine";


                oscillator.frequency.value =
                    frequency;


                const start =
                    audioContext.currentTime +
                    index * 0.14;


                gain.gain.setValueAtTime(
                    0.0001,
                    start
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.12,
                    start + 0.03
                );


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    start + 0.35
                );


                oscillator
                    .connect(gain)
                    .connect(
                        audioContext.destination
                    );


                oscillator.start(start);

                oscillator.stop(
                    start + 0.4
                );

            }
        );

    }
    catch {

        /* Browser may block audio */

    }
}


/* =====================================================
   DARK MODE
   ===================================================== */

$("themeBtn")
    .addEventListener(
        "click",
        () => {

            document.body
                .classList
                .toggle("dark");


            const dark =
                document.body
                    .classList
                    .contains("dark");


            localStorage.setItem(
                THEME_KEY,
                dark ? "1" : "0"
            );


            $("themeBtn").innerHTML =
                dark
                    ? "☀️ <span>Light Mode</span>"
                    : "🌙 <span>Dark Mode</span>";

        }
    );


/* LOAD DARK MODE */

if (
    localStorage.getItem(
        THEME_KEY
    ) === "1"
) {

    document.body
        .classList
        .add("dark");


    $("themeBtn").innerHTML =
        "☀️ <span>Light Mode</span>";
}


/* =====================================================
   CLOSE MODALS BY CLICKING OUTSIDE
   ===================================================== */

$("taskModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("taskModal")
            ) {

                closeTaskModal();

            }

        }
    );


$("confirmModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("confirmModal")
            ) {

                $("confirmModal")
                    .classList
                    .remove("show");

            }

        }
    );


$("reminderModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("reminderModal")
            ) {

                $("reminderModal")
                    .classList
                    .remove("show");


                clearInterval(
                    reminderInterval
                );

            }

        }
    );


/* =====================================================
   START APPLICATION
   ===================================================== */

loadTasks();

migrateTasks();

checkReminders();

render();


/* CHECK REMINDERS */

setInterval(
    checkReminders,
    15000
);
(function () {
  "use strict";

  const PROFILE_KEY = "coolCaiProfileV1";
  const departments = window.COOL_CAI_DEPARTMENTS;
  const levels = window.COOL_CAI_LEVELS;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const random = (min, max) => min + Math.random() * (max - min);
  const randomInt = (min, max) => Math.floor(random(min, max + 1));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

  const elements = {
    profileScreen: $("#profile-screen"),
    levelScreen: $("#level-screen"),
    gameScreen: $("#game-screen"),
    confirmCharacter: $("#confirm-character"),
    profileWarning: $("#profile-warning"),
    levelCards: $("#level-cards"),
    menuAvatar: $("#menu-avatar"),
    menuCharacter: $("#menu-character"),
    gameAvatar: $("#game-avatar"),
    pmName: $("#pm-name"),
    gameEpisode: $("#game-episode"),
    gameTitle: $("#game-title"),
    dayLabel: $("#day-label"),
    clock: $("#clock"),
    phaseLabel: $("#phase-label"),
    cash: $("#cash"),
    pmStressText: $("#pm-stress-text"),
    pmStressBar: $("#pm-stress-bar"),
    pauseButton: $("#pause-button"),
    queues: $("#queues"),
    employees: $("#employees"),
    goals: $("#goals"),
    goalSummary: $("#goal-summary"),
    aiPanel: $("#ai-panel"),
    aiControls: $("#ai-controls"),
    meetingOptions: $("#meeting-options"),
    meetingCount: $("#meeting-count"),
    logEntries: $("#log-entries"),
    finishProject: $("#finish-project"),
    world: $("#world"),
    meetingPanel: $("#meeting-panel"),
    activeMeetingTitle: $("#active-meeting-title"),
    meetingScreenTitle: $("#meeting-screen-title"),
    meetingRemaining: $("#meeting-remaining"),
    meetingAttendees: $("#meeting-attendees"),
    remoteLabel: $("#remote-label"),
    officeStatus: $("#office-status"),
    windowView: $("#window-view"),
    windowTimeLabel: $("#window-time-label"),
    modal: $("#modal"),
    modalEyebrow: $("#modal-eyebrow"),
    modalTitle: $("#modal-title"),
    modalBody: $("#modal-body"),
    modalActions: $("#modal-actions")
  };

  let selectedCharacter = null;
  let profile = loadProfile();
  let state = null;
  let animationFrame = null;
  let lastFrame = performance.now();
  let renderElapsed = 0;

  function loadProfile() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY));
      return parsed && ["Denise", "Steven"].includes(parsed.character) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function avatarFor(character) {
    return character === "Steven"
      ? "assets/reimagined/steven.png"
      : "assets/reimagined/denise.png";
  }

  function showScreen(name) {
    elements.profileScreen.classList.toggle("hidden", name !== "profile");
    elements.levelScreen.classList.toggle("hidden", name !== "levels");
    elements.gameScreen.classList.toggle("hidden", name !== "game");
  }

  function initialize() {
    bindStaticEvents();
    renderLevelCards();
    if (profile) {
      openLevelSelect();
    } else {
      showScreen("profile");
    }
  }

  function bindStaticEvents() {
    $$(".character-card").forEach(card => {
      card.addEventListener("click", () => {
        selectedCharacter = card.dataset.character;
        $$(".character-card").forEach(item => item.classList.toggle("selected", item === card));
        elements.confirmCharacter.disabled = false;
        elements.profileWarning.textContent = `${selectedCharacter} will be permanently attached to this profile.`;
      });
    });

    elements.confirmCharacter.addEventListener("click", () => {
      if (!selectedCharacter) return;
      showModal({
        eyebrow: "PROFILE LOCK",
        title: `Continue as ${selectedCharacter}?`,
        body: `<p>This profile cannot switch protagonists later. Deleting the profile is the only way to choose again.</p>`,
        actions: [
          { label: "Go back", close: true },
          {
            label: "Confirm selection",
            primary: true,
            handler: () => {
              profile = { character: selectedCharacter, createdAt: new Date().toISOString() };
              localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
              closeModal();
              openLevelSelect();
            }
          }
        ]
      });
    });

    $("#delete-profile").addEventListener("click", () => {
      showModal({
        eyebrow: "DELETE PROFILE",
        title: "Remove this locked profile?",
        body: `<p>This clears the protagonist choice and local prototype progress. It does not touch the legacy game save.</p>`,
        actions: [
          { label: "Cancel", close: true },
          {
            label: "Delete profile",
            primary: true,
            handler: () => {
              localStorage.removeItem(PROFILE_KEY);
              profile = null;
              selectedCharacter = null;
              closeModal();
              $$(".character-card").forEach(card => card.classList.remove("selected"));
              elements.confirmCharacter.disabled = true;
              elements.profileWarning.textContent = "Select a character to continue.";
              showScreen("profile");
            }
          }
        ]
      });
    });

    $("#back-to-levels").addEventListener("click", confirmLeaveGame);
    elements.pauseButton.addEventListener("click", () => {
      if (!state) return;
      state.paused = !state.paused;
      renderHeader();
    });
    $$(".speed-button").forEach(button => button.addEventListener("click", () => {
      if (!state) return;
      state.speed = Number(button.dataset.speed);
      $$(".speed-button").forEach(item => item.classList.toggle("active", item === button));
    }));
    $$(".location-button[data-location]").forEach(button => button.addEventListener("click", () => changeLocation(button.dataset.location)));
    elements.finishProject.addEventListener("click", finishProject);
    elements.queues.addEventListener("click", handleQueueAction);
    elements.queues.addEventListener("change", event => {
      const select = event.target.closest("select[data-task-select]");
      if (select && state) state.assignmentSelections[select.dataset.taskSelect] = select.value;
    });
    elements.employees.addEventListener("click", handleEmployeeAction);
    elements.meetingOptions.addEventListener("click", handleMeetingAction);
    elements.meetingOptions.addEventListener("change", event => {
      const input = event.target.closest("input[data-meeting-participant]");
      if (!input || !state) return;
      const id = input.dataset.meetingParticipant;
      state.meetingSelections[id] = $$("input[data-meeting-participant]:checked", elements.meetingOptions)
        .filter(item => item.dataset.meetingParticipant === id)
        .map(item => item.value);
    });
    elements.aiControls.addEventListener("click", handleAiAction);
  }

  function renderLevelCards() {
    elements.levelCards.innerHTML = levels.map(level => `
      <button class="level-card" data-level="${level.id}" type="button">
        <span class="level-card-visual">
          <span class="episode-number">${String(level.id).padStart(2, "0")}</span>
          <span class="chapter-label">${escapeHtml(level.chapter)}</span>
        </span>
        <span class="level-card-content">
          <h2>${escapeHtml(level.title)}</h2>
          <p>${escapeHtml(level.subtitle)}</p>
          <span class="level-facts">
            <span>600 sec / day</span>
            <span>${level.days}-day 3-star target</span>
            <span>${level.employees.length} staff</span>
          </span>
          <span class="level-card-cta">PLAY EPISODE ${level.id} &rarr;</span>
        </span>
      </button>
    `).join("");
    $$(".level-card", elements.levelCards).forEach(card => card.addEventListener("click", () => startLevel(Number(card.dataset.level))));
  }

  function openLevelSelect() {
    stopLoop();
    state = null;
    elements.menuCharacter.textContent = profile.character;
    elements.menuAvatar.src = avatarFor(profile.character);
    showScreen("levels");
  }

  function startLevel(levelId) {
    const level = levels.find(item => item.id === levelId);
    if (!level) return;
    state = createState(level);
    elements.gameEpisode.textContent = `EPISODE ${level.id} / ${level.chapter}`;
    elements.gameTitle.textContent = level.title;
    elements.pmName.textContent = profile.character;
    elements.gameAvatar.src = avatarFor(profile.character);
    elements.aiPanel.classList.toggle("hidden", !level.aiRequired);
    elements.world.classList.remove("in-meeting");
    elements.remoteLabel.classList.add("hidden");
    $$(".speed-button").forEach(button => button.classList.toggle("active", button.dataset.speed === "1"));
    seedQueues();
    logEvent("System", `Episode ${level.id} started. Normal hours run from 09:00 to 19:00.`);
    if (level.id === 1) logEvent("General Affairs", "The alignment room is reserved for 60 minutes. It must finish by 18:20 (560 seconds).");
    renderAll();
    showScreen("game");
    startLoop();
  }

  function createState(level) {
    const employeeStates = {};
    level.employees.forEach(config => {
      employeeStates[config.name] = {
        ...config,
        stress: 0,
        status: "idle",
        taskId: null,
        restSeconds: 0,
        recoveryWait: 0,
        maxRecoveryWait: 0,
        recoverRemaining: 0,
        revives: 1,
        completed: 0,
        completedByDept: { orange: 0, green: 0, blue: 0, purple: 0 },
        reviewByDept: { orange: 0, green: 0, blue: 0, purple: 0 },
        projectCompleted: { Atlas: 0, Beacon: 0 },
        weakAssignments: 0,
        weakReviewAssignments: 0
      };
    });
    return {
      level,
      day: 1,
      time: 0,
      speed: 1,
      paused: false,
      cash: level.startingCash,
      pmStress: 0,
      pmRecoverRemaining: 0,
      pmRevives: 1,
      tasks: [],
      taskSequence: 0,
      assignmentSelections: {},
      nextSpawn: level.spawn.first,
      employees: employeeStates,
      meeting: null,
      completedMeetings: new Set(),
      meetingsToday: 0,
      meetingSelections: {},
      ai: { orange: false, green: false, blue: false, purple: false },
      everOverdue: false,
      reviewEverOverdue: false,
      meetingDeadlineViolation: false,
      levelFinished: false,
      atlasBeaconToggle: false,
      logs: [],
      lastRenderTime: 0
    };
  }

  function seedQueues() {
    if (!state.level.spawn.seedAllDepartments) return;
    Object.keys(departments).forEach(dept => createTask(dept, state.level.id === 1 ? "small" : null));
  }

  function weightedSize() {
    const entries = Object.entries(state.level.taskSizes);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let target = Math.random() * total;
    for (const [size, weight] of entries) {
      target -= weight;
      if (target <= 0) return size;
    }
    return entries[0][0];
  }

  function createTask(dept, forcedSize = null, options = {}) {
    const size = forcedSize || weightedSize();
    const workRanges = { small: [15, 30], medium: [40, 75], large: [80, 120] };
    const dueTimes = { small: 60, medium: 120, large: 180 };
    const isReview = Boolean(options.review);
    let project = null;
    if (state.level.id === 11 && dept === "blue") {
      project = state.atlasBeaconToggle ? "Beacon" : "Atlas";
      state.atlasBeaconToggle = !state.atlasBeaconToggle;
    }
    state.taskSequence += 1;
    state.tasks.push({
      id: `task-${state.taskSequence}`,
      dept,
      size: isReview ? "review" : size,
      title: isReview ? `Review AI output: ${pick(departments[dept].taskNames)}` : pick(departments[dept].taskNames),
      work: isReview ? random(20, 38) : random(workRanges[size][0], workRanges[size][1]),
      progress: 0,
      age: 0,
      due: isReview ? 90 : dueTimes[size],
      status: "queued",
      assignee: null,
      overdue: false,
      review: isReview,
      project,
      aiAccelerated: Boolean(state.ai[dept] && !isReview)
    });
  }

  function spawnTaskBatch() {
    const count = randomInt(state.level.spawn.batchMin, state.level.spawn.batchMax);
    const deptKeys = Object.keys(departments);
    for (let i = 0; i < count; i += 1) createTask(pick(deptKeys));
    state.nextSpawn += random(state.level.spawn.min, state.level.spawn.max);
    logEvent("Intake", `${count} new work item${count > 1 ? "s" : ""} entered the departmental queues.`);
  }

  function startLoop() {
    stopLoop();
    lastFrame = performance.now();
    renderElapsed = 0;
    animationFrame = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  function loop(now) {
    if (!state) return;
    const realDelta = Math.min(.25, (now - lastFrame) / 1000);
    lastFrame = now;
    if (!state.paused && !state.levelFinished && elements.modal.classList.contains("hidden")) {
      const simulatedDelta = realDelta * state.speed;
      tick(simulatedDelta);
      renderElapsed += realDelta;
      if (renderElapsed >= .16) {
        renderDynamic();
        renderElapsed = 0;
      }
    }
    animationFrame = requestAnimationFrame(loop);
  }

  function tick(delta) {
    if (!state) return;
    const before = state.time;
    state.time = Math.min(600, state.time + delta);
    while (state.time >= state.nextSpawn && state.time < 600) spawnTaskBatch();

    state.tasks.filter(task => task.status !== "complete").forEach(task => {
      task.age += delta;
      if (!task.overdue && task.age >= task.due) {
        task.overdue = true;
        state.everOverdue = true;
        if (task.review) state.reviewEverOverdue = true;
        logEvent("At risk", `${task.title} is overdue. PM pressure is now increasing.`, "alert");
      }
    });

    const pressureMultiplier = state.meeting ? .6 : 1;
    Object.values(state.employees).forEach(person => tickEmployee(person, delta, pressureMultiplier));
    tickMeeting(delta);
    tickPmStress(delta, pressureMultiplier);

    if (before < 560 && state.time >= 560) checkMeetingDeadline();
    if (state.time >= 600) endDay();
  }

  function tickEmployee(person, delta, pressureMultiplier) {
    if (person.status === "working") {
      const task = state.tasks.find(item => item.id === person.taskId);
      if (!task || task.status === "complete") {
        person.status = "idle";
        person.taskId = null;
        return;
      }
      const proficiency = getProficiency(person, task.dept);
      const speed = proficiency === "strong" ? 1.25 : proficiency === "weak" ? .75 : 1;
      const aiMultiplier = task.aiAccelerated ? 1.5 : 1;
      const stressRate = proficiency === "strong" ? .055 : proficiency === "weak" ? .14 : .08;
      task.progress += speed * aiMultiplier * delta;
      person.stress = clamp(person.stress + stressRate * pressureMultiplier * delta, 0, 100);
      if (task.progress >= task.work) completeTask(person, task);
    } else if (person.status === "resting") {
      person.stress = clamp(person.stress - .38 * delta, 0, 100);
      person.restSeconds += delta;
    } else if (person.status === "waiting-rest") {
      person.recoveryWait += delta;
      person.maxRecoveryWait = Math.max(person.maxRecoveryWait, person.recoveryWait);
      if (activeResters() < state.level.recoverySlots) {
        person.status = "resting";
        person.recoveryWait = 0;
        logEvent("Facilities", `${person.name} reached an available recovery space.`);
      }
    } else if (person.status === "meeting") {
      person.stress = clamp(person.stress + .025 * .6 * delta, 0, 100);
    } else if (person.status === "recovering") {
      person.recoverRemaining -= delta;
      if (person.recoverRemaining <= 0) {
        person.recoverRemaining = 0;
        person.stress = 50;
        person.status = "idle";
        logEvent("Medical", `${person.name} returned after a 60-minute recovery at 50% stress.`);
      }
    } else {
      person.stress = clamp(person.stress - .035 * delta, 0, 100);
    }

    if (person.stress >= 100 && person.status !== "recovering") handleEmployeeStressOut(person);
  }

  function tickMeeting(delta) {
    if (!state.meeting) return;
    state.meeting.remaining -= delta;
    if (state.meeting.remaining > 0) return;
    const meeting = state.meeting;
    meeting.participants.forEach(name => {
      const person = state.employees[name];
      if (person && person.status === "meeting") person.status = "idle";
    });
    state.completedMeetings.add(meeting.id);
    state.meeting = null;
    state.worldLocation = "office";
    elements.world.classList.remove("in-meeting");
    elements.remoteLabel.classList.add("hidden");
    logEvent("Meeting", `${meeting.title} ended. Sustained pressure growth returned to 100%.`);
    renderAll();
  }

  function tickPmStress(delta, multiplier) {
    if (state.pmRecoverRemaining > 0) {
      state.pmRecoverRemaining -= delta;
      if (state.pmRecoverRemaining <= 0) {
        state.pmRecoverRemaining = 0;
        state.pmStress = 50;
        logEvent("Medical", `${profile.character} returned after a 60-minute recovery at 50% stress.`);
      }
      return;
    }
    const overdueCount = state.tasks.filter(task => task.status !== "complete" && task.overdue).length;
    if (overdueCount) state.pmStress += overdueCount * .035 * delta * multiplier;
    else state.pmStress -= .07 * delta;
    state.pmStress = clamp(state.pmStress, 0, 100);
    if (state.pmStress >= 100) {
      if (state.pmRevives > 0) {
        state.pmRevives -= 1;
        state.pmRecoverRemaining = 60;
        state.pmStress = 99;
        logEvent("Medical", `${profile.character} stressed out. PM controls are unavailable for 60 minutes.`, "alert");
      } else {
        failProject(`${profile.character} stressed out again. The current day is invalid.`);
      }
    }
  }

  function getProficiency(person, dept) {
    if (person.strong.includes(dept)) return "strong";
    if (person.weak.includes(dept)) return "weak";
    return "neutral";
  }

  function completeTask(person, task) {
    task.progress = task.work;
    task.status = "complete";
    person.status = "idle";
    person.taskId = null;
    person.completed += 1;
    person.completedByDept[task.dept] += 1;
    if (task.review) person.reviewByDept[task.dept] += 1;
    if (task.project && person.projectCompleted[task.project] !== undefined) person.projectCompleted[task.project] += 1;
    const value = task.review ? 2 : task.size === "large" ? 8 : task.size === "medium" ? 5 : 3;
    state.cash += value;
    logEvent(person.name, `Completed ${task.title}${task.project ? ` for Project ${task.project}` : ""}.`);
    if (state.level.aiRequired && state.ai[task.dept] && !task.review) {
      createTask(task.dept, null, { review: true });
      logEvent("AI review", `${departments[task.dept].short} AI produced a review item. Accountability remains with the team.`);
    }
    renderAll();
  }

  function handleEmployeeStressOut(person) {
    if (person.revives > 0) {
      person.revives -= 1;
      if (person.taskId) {
        const task = state.tasks.find(item => item.id === person.taskId);
        if (task && task.status !== "complete") {
          task.status = "queued";
          task.assignee = null;
        }
      }
      person.taskId = null;
      person.status = "recovering";
      person.recoverRemaining = 60;
      person.stress = 99;
      logEvent("Medical", `${person.name} stressed out and was taken for a 60-minute recovery.`, "alert");
    } else {
      failProject(`${person.name} stressed out after using the available recovery. The current day is invalid.`);
    }
  }

  function handleQueueAction(event) {
    const button = event.target.closest("button[data-assign-task]");
    if (!button || !state) return;
    if (state.pmRecoverRemaining > 0) {
      logEvent("Controls", "PM controls are unavailable during recovery.", "alert");
      return;
    }
    const taskId = button.dataset.assignTask;
    const card = button.closest(".task-card");
    const select = $("select", card);
    assignTask(taskId, select.value);
  }

  function assignTask(taskId, employeeName) {
    const task = state.tasks.find(item => item.id === taskId && item.status === "queued");
    const person = state.employees[employeeName];
    if (!task || !person) return;
    if (!["idle", "resting", "waiting-rest"].includes(person.status)) {
      logEvent("Assignment", `${person.name} is not available.`, "alert");
      return;
    }
    if (person.status === "meeting") return;
    person.status = "working";
    person.taskId = task.id;
    person.recoveryWait = 0;
    task.status = "working";
    task.assignee = person.name;
    delete state.assignmentSelections[task.id];
    if (getProficiency(person, task.dept) === "weak") {
      person.weakAssignments += 1;
      if (task.review) person.weakReviewAssignments += 1;
    }
    logEvent("Assignment", `${task.title} assigned to ${person.name}.`);
    renderAll();
  }

  function handleEmployeeAction(event) {
    const button = event.target.closest("button[data-employee-action]");
    if (!button || !state) return;
    if (state.pmRecoverRemaining > 0) {
      logEvent("Controls", "PM controls are unavailable during recovery.", "alert");
      return;
    }
    const person = state.employees[button.dataset.employee];
    if (!person) return;
    const action = button.dataset.employeeAction;
    if (action === "rest") toggleRest(person);
    if (action === "release" && person.status === "working") releaseTask(person);
  }

  function activeResters() {
    return Object.values(state.employees).filter(person => person.status === "resting").length;
  }

  function toggleRest(person) {
    if (person.status === "meeting" || person.status === "recovering" || person.status === "working") return;
    if (person.status === "resting" || person.status === "waiting-rest") {
      person.status = "idle";
      person.recoveryWait = 0;
      logEvent("Facilities", `${person.name} returned to available status.`);
    } else if (activeResters() < state.level.recoverySlots) {
      person.status = "resting";
      logEvent("Facilities", `${person.name} started a recovery break.`);
    } else {
      person.status = "waiting-rest";
      person.recoveryWait = 0;
      logEvent("Facilities", `${person.name} is waiting for shared recovery space.`, "alert");
    }
    renderAll();
  }

  function releaseTask(person) {
    const task = state.tasks.find(item => item.id === person.taskId);
    if (task && task.status !== "complete") {
      task.status = "queued";
      task.assignee = null;
    }
    person.taskId = null;
    person.status = "idle";
    logEvent("Assignment", `${person.name}'s task returned to its department queue.`);
    renderAll();
  }

  function handleMeetingAction(event) {
    const button = event.target.closest("button[data-start-meeting]");
    if (!button || !state) return;
    if (state.pmRecoverRemaining > 0) {
      logEvent("Controls", "The PM cannot start a meeting during recovery.", "alert");
      return;
    }
    const preset = state.level.meetings.find(item => item.id === button.dataset.startMeeting);
    if (!preset) return;
    const option = button.closest(".meeting-option");
    const participants = $$("input[type=checkbox]:checked", option).map(input => input.value);
    startMeeting(preset, participants);
  }

  function startMeeting(preset, participants) {
    if (state.meeting || state.meetingsToday >= 3) return;
    if (state.completedMeetings.has(preset.id)) return;
    if (state.time + preset.duration > 560) {
      logEvent("Meeting", "This meeting cannot finish before the 18:20 cutoff.", "alert");
      return;
    }
    const unavailable = participants.find(name => !["idle", "resting", "waiting-rest"].includes(state.employees[name].status));
    if (unavailable) {
      logEvent("Meeting", `${unavailable} is currently working and cannot enter the meeting.`, "alert");
      return;
    }
    participants.forEach(name => {
      state.employees[name].status = "meeting";
      state.employees[name].recoveryWait = 0;
    });
    state.meeting = { ...preset, participants, remaining: preset.duration };
    state.meetingsToday += 1;
    elements.world.classList.add("in-meeting");
    elements.remoteLabel.classList.remove("hidden");
    logEvent("Meeting", `${preset.title} started. Sustained stress growth is now 60%; remote office controls remain active.`);
    renderAll();
  }

  function changeLocation(location) {
    if (!state) return;
    if (state.meeting && location === "office") {
      logEvent("Meeting", "The meeting is locked. The PM cannot leave before the timer ends.", "alert");
      return;
    }
    if (!state.meeting && location === "meeting") {
      logEvent("Meeting Floor", "Choose a preset meeting to travel to the Meeting Floor.");
      return;
    }
  }

  function handleAiAction(event) {
    const button = event.target.closest("button[data-ai-dept]");
    if (!button || !state || !state.level.aiRequired) return;
    if (state.pmRecoverRemaining > 0) return;
    const dept = button.dataset.aiDept;
    if (state.ai[dept]) return;
    state.ai[dept] = true;
    logEvent("AI adoption", `${departments[dept].name} AI deployed. Normal output is 50% faster and now creates review work.`);
    renderAll();
  }

  function checkMeetingDeadline() {
    const missedRequired = state.level.meetings.some(meeting => meeting.required && !state.completedMeetings.has(meeting.id));
    if (missedRequired) {
      state.meetingDeadlineViolation = true;
      logEvent("Compliance", "A required meeting missed the 18:20 completion cutoff.", "alert");
    }
  }

  function goalState() {
    const totalCompleted = Object.values(state.employees).reduce((sum, person) => sum + person.completed, 0);
    if (state.level.id === 1) {
      const completedByDept = { orange: 0, green: 0, blue: 0, purple: 0 };
      Object.values(state.employees).forEach(person => Object.keys(completedByDept).forEach(dept => completedByDept[dept] += person.completedByDept[dept]));
      const covered = Object.values(completedByDept).filter(value => value >= 1).length;
      const meetingDone = state.completedMeetings.has("reentry-alignment");
      return [
        { text: "Complete 8 work items", progress: `${Math.min(totalCompleted, 8)} / 8`, complete: totalCompleted >= 8, required: true },
        { text: "Cover all four departments", progress: `${covered} / 4`, complete: covered === 4, required: true },
        { text: "Finish the alignment meeting", progress: meetingDone ? "60 / 60 min" : "Required before 18:20", complete: meetingDone, required: true },
        { text: "Mahavir rests for 30 minutes", progress: `${Math.min(30, Math.floor(state.employees.Mahavir.restSeconds))} / 30 min`, complete: state.employees.Mahavir.restSeconds >= 30, required: false },
        { text: "No overdue work", progress: state.everOverdue ? "Missed" : "On track", complete: !state.everOverdue, required: false }
      ];
    }
    if (state.level.id === 11) {
      const winston = state.employees.Winston;
      const tara = state.employees.Tara;
      const pearl = state.employees.Pearl;
      const luke = state.employees.Luke;
      const wait = Math.max(...Object.values(state.employees).map(person => person.maxRecoveryWait));
      return [
        { text: "Winston: Project Atlas Engineering", progress: `${Math.min(6, winston.projectCompleted.Atlas)} / 6`, complete: winston.projectCompleted.Atlas >= 6, required: true },
        { text: "Winston: Project Beacon Engineering", progress: `${Math.min(6, winston.projectCompleted.Beacon)} / 6`, complete: winston.projectCompleted.Beacon >= 6, required: true },
        { text: "Tara: Product & Design", progress: `${Math.min(7, tara.completedByDept.orange)} / 7`, complete: tara.completedByDept.orange >= 7, required: true },
        { text: "Pearl: Data & Strategy", progress: `${Math.min(7, pearl.completedByDept.green)} / 7`, complete: pearl.completedByDept.green >= 7, required: true },
        { text: "Luke: Growth & Operations", progress: `${Math.min(7, luke.completedByDept.purple)} / 7`, complete: luke.completedByDept.purple >= 7, required: true },
        { text: "No Product work assigned to Winston", progress: winston.weakAssignments ? "Missed" : "On track", complete: winston.weakAssignments === 0, required: false },
        { text: "No recovery wait over 45 minutes", progress: `${Math.floor(wait)} / 45 min max`, complete: wait <= 45, required: false }
      ];
    }
    const aiCount = Object.values(state.ai).filter(Boolean).length;
    const expertReviews = {
      orange: state.employees.Ashley.reviewByDept.orange,
      green: state.employees.Nadine.reviewByDept.green,
      blue: state.employees.Winston.reviewByDept.blue,
      purple: state.employees.Luke.reviewByDept.purple
    };
    const reviewTotal = Object.values(expertReviews).reduce((sum, value) => sum + Math.min(8, value), 0);
    const weakReviews = Object.values(state.employees).reduce((sum, person) => sum + person.weakReviewAssignments, 0);
    const meetingDone = state.completedMeetings.has("adoption-briefing");
    return [
      { text: "Deploy AI in all four departments", progress: `${aiCount} / 4`, complete: aiCount === 4, required: true },
      { text: "Specialists complete AI reviews", progress: `${reviewTotal} / 32`, complete: Object.values(expertReviews).every(value => value >= 8), required: true },
      { text: "Finish mandatory adoption briefing", progress: meetingDone ? "90 / 90 min" : "Required before 18:20", complete: meetingDone, required: true },
      { text: "No weak-department AI review", progress: weakReviews ? `${weakReviews} weak assignment(s)` : "On track", complete: weakReviews === 0, required: false },
      { text: "No overdue AI review", progress: state.reviewEverOverdue ? "Missed" : "On track", complete: !state.reviewEverOverdue, required: false }
    ];
  }

  function requiredGoalsComplete() {
    return goalState().filter(goal => goal.required).every(goal => goal.complete);
  }

  function renderAll() {
    if (!state) return;
    renderHeader();
    renderWindow();
    renderQueues();
    renderEmployees();
    renderGoals();
    renderMeetings();
    renderAi();
    renderLog();
  }

  function renderDynamic() {
    renderHeader();
    renderWindow();
    renderQueues();
    renderEmployees();
    renderGoals();
    renderMeetings();
    renderLog();
  }

  function renderHeader() {
    if (!state) return;
    const totalMinutes = Math.floor(state.time);
    const hour = 9 + Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    elements.dayLabel.textContent = `DAY ${state.day} / ${state.level.days}`;
    elements.clock.textContent = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    elements.phaseLabel.textContent = state.meeting ? "MEETING / 60% PRESSURE" : state.pmRecoverRemaining > 0 ? "PM RECOVERY" : "NORMAL HOURS";
    elements.cash.textContent = `$${Math.floor(state.cash)}`;
    elements.pmStressText.textContent = `${Math.round(state.pmStress)}%`;
    elements.pmStressBar.style.width = `${state.pmStress}%`;
    elements.pauseButton.textContent = state.paused ? "Resume" : "Pause";
    elements.officeStatus.textContent = state.meeting ? "Remote controls remain active" : "Four live departmental queues";
  }

  function renderWindow() {
    const progress = state.time / 600;
    const sunX = 8 + progress * 84;
    const sunY = 52 - Math.sin(progress * Math.PI) * 42;
    elements.windowView.style.setProperty("--sun-x", `${sunX}%`);
    elements.windowView.style.setProperty("--sun-y", `${sunY}%`);
    let label = "MORNING";
    let background = "linear-gradient(#8ed3e7, #e9cf9c)";
    if (progress >= .1 && progress < .5) { label = "DAYLIGHT"; background = "linear-gradient(#75c5e0, #d7edf0)"; }
    if (progress >= .5 && progress < .8) { label = "WARM AFTERNOON"; background = "linear-gradient(#75b6d2, #efbf83)"; }
    if (progress >= .8) { label = "CITY LIGHTS"; background = "linear-gradient(#4c6188, #e58c65 55%, #263a55)"; }
    elements.windowView.style.background = background;
    elements.windowTimeLabel.textContent = label;
  }

  function availableEmployees(task) {
    return Object.values(state.employees).filter(person => ["idle", "resting", "waiting-rest"].includes(person.status));
  }

  function renderQueues() {
    elements.queues.innerHTML = Object.keys(departments).map(dept => {
      const tasks = state.tasks.filter(task => task.dept === dept && task.status === "queued");
      return `
        <section class="queue-column ${dept}">
          <header class="queue-header"><strong>${escapeHtml(departments[dept].name)}</strong><small>${tasks.length} WAITING</small></header>
          <div class="queue-items">
            ${tasks.length ? tasks.map(task => renderTaskCard(task)).join("") : `<div class="empty-queue">Queue clear</div>`}
          </div>
        </section>
      `;
    }).join("");
  }

  function renderTaskCard(task) {
    const options = availableEmployees(task);
    const preferred = options.some(person => person.name === state.assignmentSelections[task.id])
      ? state.assignmentSelections[task.id]
      : options[0] && options[0].name;
    const ageLeft = Math.max(0, Math.ceil(task.due - task.age));
    return `
      <article class="task-card ${task.dept} ${task.overdue ? "overdue" : ""} ${task.review ? "review" : ""}">
        <div class="task-title"><span>${escapeHtml(task.title)}</span><span>${task.overdue ? "OVERDUE" : `${ageLeft}m`}</span></div>
        <div class="task-meta">
          <span>${task.review ? "AI REVIEW" : task.size.toUpperCase()}</span>
          ${task.project ? `<span>PROJECT ${task.project.toUpperCase()}</span>` : ""}
          ${task.aiAccelerated ? `<span>AI +50%</span>` : ""}
          ${task.age / task.due > .75 && !task.overdue ? `<span class="at-risk">AT RISK</span>` : ""}
        </div>
        <div class="task-assign">
          <select data-task-select="${task.id}" aria-label="Assign ${escapeHtml(task.title)}">
            ${options.length ? options.map(person => `<option value="${person.name}" ${person.name === preferred ? "selected" : ""}>${person.name} / ${getProficiency(person, task.dept)}</option>`).join("") : `<option value="">No one available</option>`}
          </select>
          <button data-assign-task="${task.id}" type="button" ${options.length && state.pmRecoverRemaining <= 0 ? "" : "disabled"}>Assign</button>
        </div>
      </article>
    `;
  }

  function renderEmployees() {
    elements.employees.innerHTML = Object.values(state.employees).map(person => {
      const task = state.tasks.find(item => item.id === person.taskId);
      const taskProgress = task ? Math.round((task.progress / task.work) * 100) : 0;
      let statusCopy = "Available for assignment";
      if (person.status === "working" && task) statusCopy = `${task.title} / ${taskProgress}%`;
      if (person.status === "resting") statusCopy = `Recovering / ${Math.floor(person.restSeconds)} min total`;
      if (person.status === "waiting-rest") statusCopy = `Waiting for recovery space / ${Math.floor(person.recoveryWait)} min`;
      if (person.status === "meeting") statusCopy = "Locked in meeting";
      if (person.status === "recovering") statusCopy = `Medical recovery / ${Math.ceil(person.recoverRemaining)} min`;
      const locked = person.status === "meeting" || person.status === "recovering";
      return `
        <article class="employee-card ${locked ? "locked" : ""}">
          <span class="employee-portrait"><img src="${person.portrait}" alt="${person.name}"></span>
          <div class="employee-name"><strong>${person.name}</strong><small>${person.revives} RECOVERY LEFT</small></div>
          <div class="employee-job"><strong>${escapeHtml(statusCopy)}</strong>${escapeHtml(person.note)}</div>
          <div class="employee-stress">
            <div class="employee-stress-line"><span>STRESS</span><strong>${Math.round(person.stress)}%</strong></div>
            <div class="stress-track"><span style="width:${person.stress}%"></span></div>
          </div>
          <div class="employee-actions">
            <button data-employee-action="rest" data-employee="${person.name}" class="${person.status === "resting" || person.status === "waiting-rest" ? "active" : ""}" type="button" ${["working", "meeting", "recovering"].includes(person.status) || state.pmRecoverRemaining > 0 ? "disabled" : ""}>${person.status === "resting" || person.status === "waiting-rest" ? "End break" : "Rest"}</button>
            <button data-employee-action="release" data-employee="${person.name}" type="button" ${person.status === "working" && state.pmRecoverRemaining <= 0 ? "" : "disabled"}>Return task</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderGoals() {
    const goals = goalState();
    const required = goals.filter(goal => goal.required);
    const completeCount = required.filter(goal => goal.complete).length;
    elements.goalSummary.textContent = `${completeCount} / ${required.length} REQUIRED`;
    elements.goals.innerHTML = goals.map(goal => `
      <div class="goal-item ${goal.required ? "required" : "optional"} ${goal.complete ? "complete" : ""}">
        <strong>${escapeHtml(goal.text)}</strong><small>${escapeHtml(goal.progress)}</small>
      </div>
    `).join("");
    const complete = required.every(goal => goal.complete);
    elements.finishProject.disabled = !complete;
    elements.finishProject.textContent = complete ? "Finish project" : "Required goals incomplete";
  }

  function renderMeetings() {
    elements.meetingCount.textContent = `${state.meetingsToday} / 3 TODAY`;
    elements.meetingOptions.innerHTML = state.level.meetings.map(meeting => {
      const done = state.completedMeetings.has(meeting.id);
      const latestStart = 560 - meeting.duration;
      const tooLate = state.time > latestStart;
      return `
        <article class="meeting-option ${done ? "done" : ""}">
          <h3>${escapeHtml(meeting.title)} ${meeting.required ? "*" : ""}</h3>
          <span class="duration">${meeting.duration} MIN / LATEST START ${formatClock(latestStart)}</span>
          <p>${escapeHtml(meeting.description)}</p>
          <div class="participant-options">
            ${meeting.selectable.map(name => `<label><input data-meeting-participant="${meeting.id}" type="checkbox" value="${name}" ${(state.meetingSelections[meeting.id] || []).includes(name) ? "checked" : ""}> ${name}</label>`).join("") || `<span>PM attends alone</span>`}
          </div>
          <button data-start-meeting="${meeting.id}" type="button" ${done || tooLate || state.meeting || state.meetingsToday >= 3 || state.pmRecoverRemaining > 0 ? "disabled" : ""}>${done ? "Completed" : tooLate ? "Cutoff missed" : "Start meeting"}</button>
        </article>
      `;
    }).join("");
    if (state.meeting) {
      elements.activeMeetingTitle.textContent = state.meeting.title;
      elements.meetingScreenTitle.textContent = state.meeting.title.toUpperCase();
      elements.meetingRemaining.textContent = formatDuration(state.meeting.remaining);
      elements.meetingAttendees.innerHTML = [`${profile.character} / PM`, ...state.meeting.participants].map(name => `<span>${escapeHtml(name)}</span>`).join("");
    }
  }

  function renderAi() {
    if (!state.level.aiRequired) return;
    elements.aiControls.innerHTML = Object.keys(departments).map(dept => `
      <div class="ai-control">
        <strong>${escapeHtml(departments[dept].name)}</strong>
        <button data-ai-dept="${dept}" class="${state.ai[dept] ? "deployed" : ""}" type="button" ${state.ai[dept] ? "disabled" : ""}>${state.ai[dept] ? "DEPLOYED" : "DEPLOY"}</button>
      </div>
    `).join("");
  }

  function renderLog() {
    elements.logEntries.innerHTML = state.logs.slice(0, 16).map(entry => `
      <div class="log-entry ${entry.type || ""}"><strong>${escapeHtml(entry.source)}</strong> ${escapeHtml(entry.text)}</div>
    `).join("");
  }

  function logEvent(source, text, type = "") {
    if (!state) return;
    state.logs.unshift({ source: `${formatClock(state.time)} / ${source}`, text, type });
    state.logs = state.logs.slice(0, 30);
  }

  function formatClock(seconds) {
    const minutes = Math.floor(seconds);
    const hour = 9 + Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function formatDuration(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function endDay() {
    if (!state || state.levelFinished) return;
    state.paused = true;
    if (requiredGoalsComplete()) {
      finishProject();
      return;
    }
    if (state.day >= state.level.days) {
      failProject(`The ${state.level.days}-day project window ended before all required goals were completed.`);
      return;
    }
    const incomplete = state.tasks.filter(task => task.status !== "complete").length;
    const overdue = state.tasks.filter(task => task.status !== "complete" && task.overdue).length;
    showModal({
      eyebrow: `EPISODE ${state.level.id} / END OF DAY ${state.day}`,
      title: "The work carries forward.",
      body: `
        <div class="result-grid">
          <div><small>INCOMPLETE</small><strong>${incomplete}</strong></div>
          <div><small>OVERDUE</small><strong>${overdue}</strong></div>
          <div><small>BUDGET</small><strong>$${Math.floor(state.cash)}</strong></div>
        </div>
        <p>Normal unfinished work and goal progress carry into tomorrow. Staff recover 15 stress points overnight.</p>
      `,
      actions: [{
        label: `Start day ${state.day + 1}`,
        primary: true,
        handler: () => {
          state.day += 1;
          state.time = 0;
          state.nextSpawn = state.level.spawn.first;
          state.meetingsToday = 0;
          state.paused = false;
          Object.values(state.employees).forEach(person => { person.stress = Math.max(0, person.stress - 15); });
          closeModal();
          logEvent("System", `Day ${state.day} started. Carried work remains in its current state.`);
          renderAll();
        }
      }]
    });
  }

  function finishProject() {
    if (!state || !requiredGoalsComplete() || state.levelFinished) return;
    state.levelFinished = true;
    state.paused = true;
    const goals = goalState();
    const optional = goals.filter(goal => !goal.required);
    const optionalComplete = optional.filter(goal => goal.complete).length;
    const allOptional = optionalComplete === optional.length;
    const noViolation = !state.meetingDeadlineViolation;
    const stars = allOptional && noViolation ? 3 : optionalComplete > 0 ? 2 : 1;
    const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
    showModal({
      eyebrow: `EPISODE ${state.level.id} COMPLETE`,
      title: `${starText} ${state.level.title}`,
      body: `
        <div class="result-grid">
          <div><small>DAY</small><strong>${state.day}</strong></div>
          <div><small>OPTIONAL</small><strong>${optionalComplete}/${optional.length}</strong></div>
          <div><small>BUDGET</small><strong>$${Math.floor(state.cash)}</strong></div>
        </div>
        <div class="story-card">${escapeHtml(state.level.story[profile.character])}</div>
      `,
      actions: [
        { label: "Replay", handler: () => { closeModal(); startLevel(state.level.id); } },
        { label: "Episode select", primary: true, handler: () => { closeModal(); openLevelSelect(); } }
      ]
    });
  }

  function failProject(reason) {
    if (!state || state.levelFinished) return;
    state.levelFinished = true;
    state.paused = true;
    showModal({
      eyebrow: `EPISODE ${state.level.id} / DAY INVALID`,
      title: "The day's work is rolled back.",
      body: `<p>${escapeHtml(reason)}</p><p>This prototype restarts the current episode from Day 1, matching the agreed sample behavior.</p>`,
      actions: [
        { label: "Episode select", handler: () => { closeModal(); openLevelSelect(); } },
        { label: "Restart episode", primary: true, handler: () => { const id = state.level.id; closeModal(); startLevel(id); } }
      ]
    });
  }

  function confirmLeaveGame() {
    if (!state) return openLevelSelect();
    const wasPaused = state.paused;
    state.paused = true;
    showModal({
      eyebrow: "LEAVE EPISODE",
      title: "Return to episode select?",
      body: `<p>Leaving discards this run. Re-entering starts from Day 1.</p>`,
      actions: [
        { label: "Stay", handler: () => { state.paused = wasPaused; closeModal(); } },
        { label: "Leave episode", primary: true, handler: () => { closeModal(); openLevelSelect(); } }
      ]
    });
  }

  function showModal({ eyebrow = "", title, body, actions = [] }) {
    elements.modalEyebrow.textContent = eyebrow;
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = body;
    elements.modalActions.innerHTML = "";
    actions.forEach(action => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      if (action.primary) button.className = "primary-button";
      button.addEventListener("click", action.close ? closeModal : action.handler);
      elements.modalActions.appendChild(button);
    });
    elements.modal.classList.remove("hidden");
  }

  function closeModal() {
    elements.modal.classList.add("hidden");
    elements.modalBody.innerHTML = "";
    elements.modalActions.innerHTML = "";
  }

  initialize();
})();

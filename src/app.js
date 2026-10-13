/**
 * app.js — Application orchestrator for VolunteerMatch.
 * Wires state management, event handlers, and rendering together.
 * Imports from all other src/ modules; exports nothing.
 */

import { getSampleVolunteers, getSampleTasks, SKILLS } from './data.js';
import { rankVolunteers, countUnfilledRoles } from './matcher.js';
import { saveState, loadState, clearState } from './storage.js';
import { renderRoster, renderTaskForm, renderResults } from './ui.js';
import { AI_ENABLED, extractSkills } from './ai.js';

function initApp() {
  const saved = loadState();
  const state = saved || {
    volunteers: getSampleVolunteers(),
    tasks: getSampleTasks(),
    currentTask: null,
    results: [],
  };

  const rosterContainer = document.getElementById('roster-list');
  const formContainer = document.getElementById('task-form-container');
  const resultsContainer = document.getElementById('results-container');

  /** Full re-render: rebuilds all panels from current state. */
  function rerender() {
    renderRoster(state.volunteers, state.tasks, rosterContainer);
    renderTaskForm(SKILLS, handleSubmit, formContainer, AI_ENABLED, handleExtract);
    if (state.currentTask && state.results.length > 0) {
      const unfilledCount = countUnfilledRoles(state.results, state.currentTask);
      renderResults(state.results, state.currentTask, unfilledCount, handleAssign, resultsContainer);
    } else {
      renderResults([], null, 0, handleAssign, resultsContainer);
    }
  }

  /**
   * Called when the task form is submitted with valid data.
   * Creates a new task, ranks volunteers, and renders results.
   *
   * @param {{ name: string, description: string, requiredSkills: string[], slot: object, volunteersNeeded: number }} taskData
   */
  function handleSubmit(taskData) {
    const newTask = {
      id: 't' + Date.now(),
      ...taskData,
      assignedVolunteers: [],
    };

    // Don't add to state.tasks yet — only add when someone is assigned
    state.currentTask = newTask;
    state.results = rankVolunteers(state.volunteers, newTask, state.tasks);

    const unfilledCount = countUnfilledRoles(state.results, newTask);
    renderRoster(state.volunteers, state.tasks, rosterContainer);
    renderResults(state.results, state.currentTask, unfilledCount, handleAssign, resultsContainer);
    saveState(state);
  }

  /**
   * Called when the organiser clicks "Assign" on a volunteer result card.
   *
   * @param {string} volunteerId
   */
  function handleAssign(volunteerId) {
    const volunteer = state.volunteers.find(v => v.id === volunteerId);
    const task = state.currentTask;
    if (!volunteer || !task) return;

    // Add task to state.tasks if not already there
    if (!state.tasks.find(t => t.id === task.id)) {
      state.tasks.push(task);
    }

    // Guard against duplicate or conflict (belt-and-suspenders)
    if (volunteer.assignments.includes(task.id)) return;

    // Assign volunteer to task
    task.assignedVolunteers.push(volunteerId);
    volunteer.assignments.push(task.id);

    // Re-rank with updated state
    state.results = rankVolunteers(state.volunteers, task, state.tasks);

    saveState(state);
    rerender();

    // Re-render results panel with the latest unfilled count
    const unfilledCount = countUnfilledRoles(state.results, task);
    renderResults(state.results, task, unfilledCount, handleAssign, resultsContainer);
  }

  /**
   * Calls the AI extractor and checks the matching skill checkboxes in the form.
   *
   * @param {string} description
   */
  async function handleExtract(description) {
    const result = await extractSkills(description, SKILLS);
    if (result.source === 'ai' && result.skills.length > 0) {
      const checkboxes = document.querySelectorAll('input[name="skills"]');
      checkboxes.forEach(cb => {
        cb.checked = result.skills.includes(cb.value);
      });
    }
  }

  // Reset Demo button
  document.getElementById('reset-btn').addEventListener('click', () => {
    clearState();
    state.volunteers = getSampleVolunteers();
    state.tasks = getSampleTasks();
    state.currentTask = null;
    state.results = [];
    rerender();
  });

  // Initial render
  rerender();
}

document.addEventListener('DOMContentLoaded', initApp);

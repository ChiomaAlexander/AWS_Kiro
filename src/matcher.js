/**
 * matcher.js — Pure scoring and ranking logic for VolunteerMatch.
 * No DOM, no side effects. All functions are deterministic.
 */

/**
 * Returns true if two time slots overlap (exclusive of exact-boundary touches).
 * Adjacent slots (slotA.end === slotB.start) do NOT overlap.
 *
 * @param {{ start: string, end: string }} slotA
 * @param {{ start: string, end: string }} slotB
 * @returns {boolean}
 */
export function slotOverlaps(slotA, slotB) {
  return (
    Date.parse(slotA.start) < Date.parse(slotB.end) &&
    Date.parse(slotA.end) > Date.parse(slotB.start)
  );
}

/**
 * Returns true if any of the volunteer's availability slots overlaps the task slot.
 *
 * @param {{ availability: Array<{start: string, end: string}> }} volunteer
 * @param {{ start: string, end: string }} taskSlot
 * @returns {boolean}
 */
export function volunteerAvailableFor(volunteer, taskSlot) {
  return volunteer.availability.some(slot => slotOverlaps(slot, taskSlot));
}

/**
 * Checks whether a volunteer has a scheduling conflict with a new task.
 * A conflict exists when the volunteer is already assigned to a different task
 * whose slot overlaps the new task's slot.
 *
 * @param {{ assignments: string[] }} volunteer
 * @param {{ id: string, slot: {start: string, end: string} }} task
 * @param {Array<{id: string, slot: {start: string, end: string}}>} allTasks
 * @returns {{ hasConflict: boolean, conflictingTask: object|null }}
 */
export function volunteerHasConflict(volunteer, task, allTasks) {
  for (const taskId of volunteer.assignments) {
    const assignedTask = allTasks.find(t => t.id === taskId);
    if (!assignedTask) continue;
    // Don't flag the task itself as a conflict (relevant after partial assignment)
    if (assignedTask.id === task.id) continue;
    if (slotOverlaps(assignedTask.slot, task.slot)) {
      return { hasConflict: true, conflictingTask: assignedTask };
    }
  }
  return { hasConflict: false, conflictingTask: null };
}

/**
 * Scores a single volunteer against a task and returns a full MatchResult.
 *
 * Scoring algorithm:
 *   skillScore      = matchedSkills.length × 10
 *   availScore      = availabilityMatch ? 20 : 0
 *   workloadPenalty = volunteer.assignments.length × −5
 *   score           = skillScore + availScore + workloadPenalty
 *
 * @param {{ id: string, name: string, skills: string[], availability: object[], assignments: string[] }} volunteer
 * @param {{ id: string, requiredSkills: string[], slot: object, volunteersNeeded: number, assignedVolunteers: string[] }} task
 * @param {object[]} allTasks
 * @returns {{
 *   volunteer: object,
 *   score: number,
 *   skillScore: number,
 *   availScore: number,
 *   workloadPenalty: number,
 *   matchedSkills: string[],
 *   missingSkills: string[],
 *   availabilityMatch: boolean,
 *   isDuplicate: boolean,
 *   hasConflict: boolean,
 *   conflictingTask: object|null,
 *   explanation: string
 * }}
 */
export function scoreVolunteer(volunteer, task, allTasks) {
  const matchedSkills = task.requiredSkills.filter(s => volunteer.skills.includes(s));
  const missingSkills = task.requiredSkills.filter(s => !volunteer.skills.includes(s));
  const skillScore = matchedSkills.length * 10;

  const availabilityMatch = volunteerAvailableFor(volunteer, task.slot);
  const availScore = availabilityMatch ? 20 : 0;

  const workloadPenalty = volunteer.assignments.length === 0 ? 0 : volunteer.assignments.length * -5;
  const score = skillScore + availScore + workloadPenalty;

  const isDuplicate = volunteer.assignments.includes(task.id);
  const { hasConflict, conflictingTask } = volunteerHasConflict(volunteer, task, allTasks);

  // Build plain-English explanation
  const skillPart = `Has ${matchedSkills.length} of ${task.requiredSkills.length} required skill${task.requiredSkills.length !== 1 ? 's' : ''}`;
  const availPart = availabilityMatch ? 'available' : 'not available';
  const workloadPart = `currently has ${volunteer.assignments.length} other assignment${volunteer.assignments.length !== 1 ? 's' : ''}`;
  let explanation = `${skillPart}; ${availPart}; ${workloadPart}.`;
  if (isDuplicate) explanation += ' Already assigned to this task.';
  if (conflictingTask) explanation += ` Conflicts with "${conflictingTask.name}".`;

  return {
    volunteer,
    score,
    skillScore,
    availScore,
    workloadPenalty,
    matchedSkills,
    missingSkills,
    availabilityMatch,
    isDuplicate,
    hasConflict,
    conflictingTask,
    explanation,
  };
}

/**
 * Ranks all volunteers for a task, sorted by score descending.
 * Ties are broken alphabetically by volunteer name (ascending).
 *
 * @param {object[]} volunteers
 * @param {object} task
 * @param {object[]} allTasks
 * @returns {object[]} Sorted array of MatchResult objects
 */
export function rankVolunteers(volunteers, task, allTasks) {
  const results = volunteers.map(v => scoreVolunteer(v, task, allTasks));
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.volunteer.name.localeCompare(b.volunteer.name);
  });
  return results;
}

/**
 * Counts how many volunteer slots for a task cannot be filled.
 * Eligible = not a duplicate and no scheduling conflict and available for the slot.
 *
 * @param {object[]} results - Array of MatchResult objects from rankVolunteers
 * @param {{ volunteersNeeded: number }} task
 * @returns {number} Number of slots that cannot be filled (0 if all can be filled)
 */
export function countUnfilledRoles(results, task) {
  const eligibleCount = results.filter(
    r => !r.isDuplicate && !r.hasConflict && r.availabilityMatch
  ).length;
  return Math.max(0, task.volunteersNeeded - Math.min(eligibleCount, task.volunteersNeeded));
}

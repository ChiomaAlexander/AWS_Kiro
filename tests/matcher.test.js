import { describe, it, expect } from 'vitest';
import {
  slotOverlaps,
  volunteerAvailableFor,
  volunteerHasConflict,
  scoreVolunteer,
  rankVolunteers,
  countUnfilledRoles,
} from '../src/matcher.js';

const slotA = { label: 'A', start: '2026-10-17T09:00', end: '2026-10-17T13:00' };
const slotB = { label: 'B', start: '2026-10-17T10:00', end: '2026-10-17T16:00' };
const slotC = { label: 'C', start: '2026-10-17T09:00', end: '2026-10-17T11:00' };
const slotD = { label: 'D', start: '2026-10-17T14:00', end: '2026-10-17T18:00' };

// ─────────────────────────────────────────────
// slotOverlaps
// ─────────────────────────────────────────────
describe('slotOverlaps', () => {
  it('overlapping slots return true', () => {
    expect(slotOverlaps(slotA, slotB)).toBe(true);
  });

  it('adjacent slots (end === start) return false', () => {
    const s1 = { start: '2026-10-17T09:00', end: '2026-10-17T11:00' };
    const s2 = { start: '2026-10-17T11:00', end: '2026-10-17T13:00' };
    expect(slotOverlaps(s1, s2)).toBe(false);
  });

  it('fully contained slot returns true', () => {
    // slotC (9-11) is fully inside slotA (9-13)
    expect(slotOverlaps(slotC, slotA)).toBe(true);
  });

  it('completely separate slots return false', () => {
    // slotC ends 11:00, slotD starts 14:00 — no overlap
    expect(slotOverlaps(slotC, slotD)).toBe(false);
  });

  it('identical slots return true', () => {
    expect(slotOverlaps(slotA, slotA)).toBe(true);
  });

  it('partial overlap (B starts before A ends) returns true', () => {
    // slotA 9-13 overlaps slotB 10-16
    expect(slotOverlaps(slotA, slotB)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// volunteerAvailableFor
// ─────────────────────────────────────────────
describe('volunteerAvailableFor', () => {
  // vol is available slotA (9-13) and slotD (14-18)
  const vol = { availability: [slotA, slotD] };

  it('returns true when volunteer has a matching slot', () => {
    // slotC (9-11) overlaps slotA (9-13)
    expect(volunteerAvailableFor(vol, slotC)).toBe(true);
  });

  it('returns false when volunteer has no matching slot', () => {
    // 13:00-14:00 is the gap between slotA (ends 13:00) and slotD (starts 14:00)
    const noMatch = { start: '2026-10-17T13:00', end: '2026-10-17T14:00' };
    expect(volunteerAvailableFor(vol, noMatch)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// volunteerHasConflict
// ─────────────────────────────────────────────
describe('volunteerHasConflict', () => {
  it('no assignments → no conflict', () => {
    const vol = { assignments: [] };
    const task = { id: 'tx', slot: slotA, requiredSkills: [], assignedVolunteers: [] };
    const result = volunteerHasConflict(vol, task, [task]);
    expect(result.hasConflict).toBe(false);
    expect(result.conflictingTask).toBeNull();
  });

  it('assigned to a task whose slot overlaps → hasConflict true', () => {
    const existingTask = { id: 't1', slot: slotA, requiredSkills: [], assignedVolunteers: ['v1'] };
    const newTask = { id: 'tx', slot: slotC, requiredSkills: [], assignedVolunteers: [] };
    // slotA (9-13) overlaps slotC (9-11)
    const vol = { assignments: ['t1'] };
    const result = volunteerHasConflict(vol, newTask, [existingTask, newTask]);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingTask.id).toBe('t1');
  });
});

// ─────────────────────────────────────────────
// scoreVolunteer
// ─────────────────────────────────────────────
describe('scoreVolunteer', () => {
  const task = {
    id: 'tx',
    requiredSkills: ['logistics', 'event-setup'],
    slot: slotA,
    volunteersNeeded: 2,
    assignedVolunteers: [],
  };
  const allTasks = [task];

  it('all skills match, available, no workload → max score', () => {
    const vol = { id: 'v1', name: 'Ann', skills: ['logistics', 'event-setup'], availability: [slotA], assignments: [] };
    const result = scoreVolunteer(vol, task, allTasks);
    expect(result.skillScore).toBe(20);
    expect(result.availScore).toBe(20);
    expect(result.workloadPenalty).toBe(0);
    expect(result.score).toBe(40);
  });

  it('no skills match → skillScore = 0', () => {
    const vol = { id: 'v2', name: 'Bob', skills: ['photography', 'first-aid'], availability: [slotA], assignments: [] };
    const result = scoreVolunteer(vol, task, allTasks);
    expect(result.skillScore).toBe(0);
  });

  it('unavailable → availScore = 0', () => {
    const vol = { id: 'v3', name: 'Cal', skills: ['logistics'], availability: [slotD], assignments: [] };
    const result = scoreVolunteer(vol, task, allTasks);
    expect(result.availScore).toBe(0);
  });

  it('2 existing assignments → workloadPenalty = -10', () => {
    const t2 = { id: 't2', slot: slotD, requiredSkills: [], assignedVolunteers: [] };
    const t3 = { id: 't3', slot: slotD, requiredSkills: [], assignedVolunteers: [] };
    const vol = { id: 'v4', name: 'Dan', skills: [], availability: [slotA], assignments: ['t2', 't3'] };
    const result = scoreVolunteer(vol, task, [task, t2, t3]);
    expect(result.workloadPenalty).toBe(-10);
  });

  it('explanation string is a non-empty string', () => {
    const vol = { id: 'v5', name: 'Eva', skills: ['logistics'], availability: [slotA], assignments: [] };
    const result = scoreVolunteer(vol, task, allTasks);
    expect(typeof result.explanation).toBe('string');
    expect(result.explanation.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// rankVolunteers
// ─────────────────────────────────────────────
describe('rankVolunteers', () => {
  const task = {
    id: 'tx',
    requiredSkills: ['logistics'],
    slot: slotA,
    volunteersNeeded: 1,
    assignedVolunteers: [],
  };
  const allTasks = [task];

  it('higher scoring volunteer is ranked first', () => {
    const v1 = { id: 'v1', name: 'Zara', skills: ['logistics'], availability: [slotA], assignments: [] };
    const v2 = { id: 'v2', name: 'Adam', skills: [], availability: [slotA], assignments: [] };
    const results = rankVolunteers([v1, v2], task, allTasks);
    expect(results[0].volunteer.id).toBe('v1');
  });

  it('tie broken alphabetically (Adam before Zara)', () => {
    const v1 = { id: 'v1', name: 'Zara', skills: ['logistics'], availability: [slotA], assignments: [] };
    const v2 = { id: 'v2', name: 'Adam', skills: ['logistics'], availability: [slotA], assignments: [] };
    const results = rankVolunteers([v1, v2], task, allTasks);
    expect(results[0].volunteer.name).toBe('Adam');
  });

  it('isDuplicate flag set correctly', () => {
    const taskWithV1 = { ...task, assignedVolunteers: ['v1'] };
    const v1 = { id: 'v1', name: 'Ann', skills: ['logistics'], availability: [slotA], assignments: ['tx'] };
    const results = rankVolunteers([v1], taskWithV1, [taskWithV1]);
    expect(results[0].isDuplicate).toBe(true);
  });

  it('hasConflict flag set correctly', () => {
    const otherTask = { id: 't_other', slot: slotA, requiredSkills: [], assignedVolunteers: ['v1'] };
    const newTask = { id: 't_new', requiredSkills: ['logistics'], slot: slotC, volunteersNeeded: 1, assignedVolunteers: [] };
    // slotA (9-13) overlaps slotC (9-11)
    const v1 = { id: 'v1', name: 'Ann', skills: ['logistics'], availability: [slotA, slotC], assignments: ['t_other'] };
    const results = rankVolunteers([v1], newTask, [otherTask, newTask]);
    expect(results[0].hasConflict).toBe(true);
  });
});

// ─────────────────────────────────────────────
// countUnfilledRoles
// ─────────────────────────────────────────────
describe('countUnfilledRoles', () => {
  it('3 eligible, task needs 2 → unfilled = 0', () => {
    const task = { id: 'tx', requiredSkills: ['logistics'], slot: slotA, volunteersNeeded: 2, assignedVolunteers: [] };
    const volunteers = [
      { id: 'v1', name: 'A', skills: ['logistics'], availability: [slotA], assignments: [] },
      { id: 'v2', name: 'B', skills: ['logistics'], availability: [slotA], assignments: [] },
      { id: 'v3', name: 'C', skills: ['logistics'], availability: [slotA], assignments: [] },
    ];
    const results = rankVolunteers(volunteers, task, [task]);
    expect(countUnfilledRoles(results, task)).toBe(0);
  });

  it('1 eligible, task needs 5 → unfilled = 4', () => {
    const task = { id: 'tx', requiredSkills: ['logistics'], slot: slotA, volunteersNeeded: 5, assignedVolunteers: [] };
    const volunteers = [
      { id: 'v1', name: 'A', skills: ['logistics'], availability: [slotA], assignments: [] },
      { id: 'v2', name: 'B', skills: ['logistics'], availability: [slotD], assignments: [] }, // unavailable
      { id: 'v3', name: 'C', skills: ['logistics'], availability: [slotD], assignments: [] }, // unavailable
    ];
    const results = rankVolunteers(volunteers, task, [task]);
    expect(countUnfilledRoles(results, task)).toBe(4);
  });
});

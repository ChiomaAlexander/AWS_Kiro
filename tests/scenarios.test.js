import { describe, it, expect } from 'vitest';
import { rankVolunteers, countUnfilledRoles, scoreVolunteer } from '../src/matcher.js';

const slotA = { label: 'A', start: '2026-10-17T09:00', end: '2026-10-17T13:00' };
const slotC = { label: 'C', start: '2026-10-17T09:00', end: '2026-10-17T11:00' };
const slotD = { label: 'D', start: '2026-10-17T14:00', end: '2026-10-17T18:00' };

// ─────────────────────────────────────────────
// Unfilled roles
// ─────────────────────────────────────────────
describe('unfilled roles', () => {
  it('task needs 5, only 2 eligible → countUnfilledRoles returns 3', () => {
    const task = {
      id: 'tx',
      requiredSkills: ['logistics'],
      slot: slotA,
      volunteersNeeded: 5,
      assignedVolunteers: [],
    };
    const volunteers = [
      { id: 'v1', name: 'A', skills: ['logistics'], availability: [slotA], assignments: [] },
      { id: 'v2', name: 'B', skills: ['logistics'], availability: [slotA], assignments: [] },
      { id: 'v3', name: 'C', skills: ['logistics'], availability: [slotD], assignments: [] }, // unavailable
      { id: 'v4', name: 'D', skills: ['logistics'], availability: [slotD], assignments: [] }, // unavailable
      { id: 'v5', name: 'E', skills: ['logistics'], availability: [slotD], assignments: [] }, // unavailable
    ];
    const results = rankVolunteers(volunteers, task, [task]);
    const unfilled = countUnfilledRoles(results, task);
    expect(unfilled).toBe(3);
  });
});

// ─────────────────────────────────────────────
// Duplicate prevention
// ─────────────────────────────────────────────
describe('duplicate prevention', () => {
  it('volunteer already in task.assignedVolunteers → isDuplicate = true', () => {
    const task = {
      id: 'tx',
      requiredSkills: ['logistics'],
      slot: slotA,
      volunteersNeeded: 1,
      assignedVolunteers: ['v1'],
    };
    const volunteer = { id: 'v1', name: 'Ann', skills: ['logistics'], availability: [slotA], assignments: ['tx'] };
    const result = scoreVolunteer(volunteer, task, [task]);
    expect(result.isDuplicate).toBe(true);
  });
});

// ─────────────────────────────────────────────
// Conflict prevention
// ─────────────────────────────────────────────
describe('conflict prevention', () => {
  it('volunteer assigned to overlapping task → hasConflict = true', () => {
    const existingTask = { id: 't1', slot: slotA, requiredSkills: [], assignedVolunteers: ['v1'] };
    const newTask = { id: 't2', requiredSkills: ['logistics'], slot: slotC, volunteersNeeded: 1, assignedVolunteers: [] };
    // slotA (9-13) overlaps slotC (9-11)
    const volunteer = { id: 'v1', name: 'Ann', skills: ['logistics'], availability: [slotA, slotC], assignments: ['t1'] };
    const result = scoreVolunteer(volunteer, newTask, [existingTask, newTask]);
    expect(result.hasConflict).toBe(true);
  });

  it('volunteer assigned to non-overlapping task → hasConflict = false', () => {
    const existingTask = { id: 't1', slot: slotD, requiredSkills: [], assignedVolunteers: ['v1'] };
    const newTask = { id: 't2', requiredSkills: ['logistics'], slot: slotC, volunteersNeeded: 1, assignedVolunteers: [] };
    // slotD (14-18) does NOT overlap slotC (9-11)
    const volunteer = { id: 'v1', name: 'Ann', skills: ['logistics'], availability: [slotC, slotD], assignments: ['t1'] };
    const result = scoreVolunteer(volunteer, newTask, [existingTask, newTask]);
    expect(result.hasConflict).toBe(false);
  });
});

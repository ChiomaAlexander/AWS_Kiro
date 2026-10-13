/**
 * data.js — Sample data and skills catalogue for VolunteerMatch.
 * This file is the single source of truth for volunteers, tasks, and skill tags.
 * Nothing in this file imports from src/; it is a leaf dependency.
 */

/**
 * Complete list of recognised skill tags.
 * @type {string[]}
 */
export const SKILLS = [
  'first-aid', 'cpr', 'spanish', 'photography', 'social-media',
  'logistics', 'sound-tech', 'event-setup', 'catering', 'fundraising',
  'graphic-design', 'translation', 'security', 'childcare', 'accessibility',
];

// Reusable slot definitions used in sample data
const slotA = { label: 'Sat Oct 17, 9am–1pm',  start: '2026-10-17T09:00', end: '2026-10-17T13:00' };
const slotB = { label: 'Sat Oct 17, 10am–4pm', start: '2026-10-17T10:00', end: '2026-10-17T16:00' };
const slotC = { label: 'Sat Oct 17, 9am–11am', start: '2026-10-17T09:00', end: '2026-10-17T11:00' };
const slotD = { label: 'Sat Oct 17, 2pm–6pm',  start: '2026-10-17T14:00', end: '2026-10-17T18:00' };

/**
 * Returns a fresh array of 10 sample Volunteer objects.
 * Each call returns new object literals so Reset Demo gets unmodified originals.
 *
 * @returns {Array<{
 *   id: string,
 *   name: string,
 *   bio: string,
 *   skills: string[],
 *   availability: Array<{label: string, start: string, end: string}>,
 *   assignments: string[]
 * }>}
 */
export function getSampleVolunteers() {
  return [
    {
      id: 'v1',
      name: 'Jordan Lee',
      bio: 'Event management major who has coordinated three campus fairs.',
      skills: ['logistics', 'event-setup', 'catering'],
      availability: [{ ...slotA }, { ...slotD }],
      assignments: ['t1'],
    },
    {
      id: 'v2',
      name: 'Alex Rivera',
      bio: 'Nursing student, CPR certified, and fluent Spanish speaker.',
      skills: ['first-aid', 'cpr', 'spanish'],
      availability: [{ ...slotA }, { ...slotC }, { ...slotD }],
      assignments: [],
    },
    {
      id: 'v3',
      name: 'Sam Okafor',
      bio: 'Digital media student with a passion for live event storytelling.',
      skills: ['photography', 'social-media', 'graphic-design'],
      availability: [{ ...slotB }],
      assignments: ['t2'],
    },
    {
      id: 'v4',
      name: 'Maya Patel',
      bio: 'Audio engineer and certified translator with five years of stage experience.',
      skills: ['sound-tech', 'spanish', 'translation'],
      availability: [{ ...slotC }, { ...slotD }],
      assignments: [],
    },
    {
      id: 'v5',
      name: 'Chris Wang',
      bio: 'Nonprofit veteran who has run fundraising drives raising over $50k.',
      skills: ['fundraising', 'logistics', 'event-setup'],
      availability: [{ ...slotA }, { ...slotD }],
      assignments: [],
    },
    {
      id: 'v6',
      name: 'Taylor Nguyen',
      bio: 'Certified first-responder and disability-inclusion advocate.',
      skills: ['first-aid', 'cpr', 'accessibility'],
      availability: [{ ...slotA }, { ...slotC }],
      assignments: [],
    },
    {
      id: 'v7',
      name: 'Morgan Blake',
      bio: 'Freelance photographer who covered last year\'s city marathon.',
      skills: ['social-media', 'graphic-design', 'photography'],
      availability: [{ ...slotB }, { ...slotD }],
      assignments: [],
    },
    {
      id: 'v8',
      name: 'Jamie Kim',
      bio: 'Professional caterer and certified childcare volunteer.',
      skills: ['catering', 'event-setup', 'childcare'],
      availability: [{ ...slotD }],
      assignments: [],
    },
    {
      id: 'v9',
      name: 'Riley Torres',
      bio: 'Former campus security officer and seasoned logistics coordinator.',
      skills: ['security', 'logistics', 'fundraising'],
      availability: [{ ...slotA }, { ...slotB }, { ...slotD }],
      assignments: [],
    },
    {
      id: 'v10',
      name: 'Drew Sharma',
      bio: 'Sign-language interpreter and assistive-technology specialist.',
      skills: ['sound-tech', 'translation', 'accessibility'],
      availability: [{ ...slotC }, { ...slotD }],
      assignments: [],
    },
  ];
}

/**
 * Returns a fresh array of 3 sample Task objects.
 * Each call returns new object literals so Reset Demo gets unmodified originals.
 *
 * @returns {Array<{
 *   id: string,
 *   name: string,
 *   description: string,
 *   requiredSkills: string[],
 *   slot: {label: string, start: string, end: string},
 *   volunteersNeeded: number,
 *   assignedVolunteers: string[]
 * }>}
 */
export function getSampleTasks() {
  return [
    {
      id: 't1',
      name: 'Registration Desk',
      description: 'Manage check-in and registration for event attendees.',
      requiredSkills: ['logistics', 'event-setup'],
      slot: { ...slotA },
      volunteersNeeded: 2,
      assignedVolunteers: ['v1'],
    },
    {
      id: 't2',
      name: 'Social Media Coverage',
      description: 'Capture and post live event content on social platforms.',
      requiredSkills: ['photography', 'social-media'],
      slot: { ...slotB },
      volunteersNeeded: 1,
      assignedVolunteers: ['v3'],
    },
    {
      id: 't3',
      name: 'Welcome Ceremony A/V',
      description: 'Operate audio/visual equipment and provide Spanish language support during the opening ceremony.',
      requiredSkills: ['sound-tech', 'spanish'],
      slot: { ...slotC },
      volunteersNeeded: 2,
      assignedVolunteers: [],
    },
  ];
}

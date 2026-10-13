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
  'teaching', 'counselling', 'coding', 'nursing', 'carpentry',
  'plumbing', 'driving', 'cooking', 'cleaning', 'admin',
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

// ─────────────────────────────────────────────
// PLATFORM SAMPLE DATA (extended for VolunteerMatch platform)
// ─────────────────────────────────────────────

/**
 * Returns a fresh array of 12 sample User objects (1 admin + 11 community members).
 * passwordHash is stored as DEMO_HASH_<username> — never a real hash in production.
 *
 * @returns {Array<object>}
 */
export function getSampleUsers() {
  return [
    {
      id: 'u_admin',
      username: 'admin',
      email: 'admin@volunteermatch.ng',
      passwordHash: 'DEMO_HASH_admin',
      displayName: 'Platform Admin',
      bio: 'VolunteerMatch platform administrator.',
      avatar: null,
      location: 'Lagos, Nigeria',
      skills: ['admin'],
      languages: ['English'],
      availability: [],
      interests: ['platform management'],
      role: 'admin',
      bloodDonor: false,
      createdAt: '2026-08-01T08:00',
      onboarded: true,
    },
    {
      id: 'u1',
      username: 'jordan_lee',
      email: 'jordan@example.com',
      passwordHash: 'DEMO_HASH_jordan_lee',
      displayName: 'Jordan Lee',
      bio: 'Event management major who has coordinated three campus fairs.',
      avatar: null,
      location: 'Lagos, Nigeria',
      skills: ['logistics', 'event-setup'],
      languages: ['English', 'Yoruba'],
      availability: [{ ...slotA }, { ...slotD }],
      interests: ['community events', 'education'],
      role: 'user',
      bloodDonor: false,
      createdAt: '2026-09-01T10:00',
      onboarded: true,
    },
    {
      id: 'u2',
      username: 'amara_obi',
      email: 'amara@brightfutures.ng',
      passwordHash: 'DEMO_HASH_amara_obi',
      displayName: 'Amara Obi',
      bio: 'Director of Bright Futures Orphanage. Passionate about child welfare.',
      avatar: null,
      location: 'Lagos, Nigeria',
      skills: ['childcare', 'admin', 'fundraising'],
      languages: ['English', 'Igbo'],
      availability: [{ ...slotA }],
      interests: ['child welfare', 'education', 'fundraising'],
      role: 'user',
      bloodDonor: false,
      createdAt: '2026-09-05T09:00',
      onboarded: true,
    },
    {
      id: 'u3',
      username: 'kofi_mensah',
      email: 'kofi@example.com',
      passwordHash: 'DEMO_HASH_kofi_mensah',
      displayName: 'Kofi Mensah',
      bio: 'Public health nurse volunteering across Lagos clinics.',
      avatar: null,
      location: 'Lagos, Nigeria',
      skills: ['nursing', 'first-aid', 'cpr'],
      languages: ['English', 'Twi'],
      availability: [{ ...slotB }, { ...slotD }],
      interests: ['health', 'community'],
      role: 'user',
      bloodDonor: false,
      createdAt: '2026-09-10T11:00',
      onboarded: true,
    },
    {
      id: 'u4',
      username: 'fatima_bello',
      email: 'fatima@example.com',
      passwordHash: 'DEMO_HASH_fatima_bello',
      displayName: 'Fatima Bello',
      bio: 'Community organiser and certified translator.',
      avatar: null,
      location: 'Abuja, Nigeria',
      skills: ['translation', 'logistics', 'social-media'],
      languages: ['English', 'Hausa', 'French'],
      availability: [{ ...slotA }, { ...slotC }],
      interests: ['community', 'education', 'environment'],
      role: 'user',
      bloodDonor: true,
      createdAt: '2026-09-12T08:30',
      onboarded: true,
    },
    {
      id: 'u5',
      username: 'emeka_nwosu',
      email: 'emeka@example.com',
      passwordHash: 'DEMO_HASH_emeka_nwosu',
      displayName: 'Emeka Nwosu',
      bio: 'Carpenter and construction volunteer building homes for displaced families.',
      avatar: null,
      location: 'Port Harcourt, Nigeria',
      skills: ['carpentry', 'logistics', 'security'],
      languages: ['English', 'Igbo'],
      availability: [{ ...slotB }],
      interests: ['housing', 'community', 'environment'],
      role: 'user',
      bloodDonor: false,
      createdAt: '2026-09-15T14:00',
      onboarded: true,
    },
    {
      id: 'u6',
      username: 'ngozi_eze',
      email: 'ngozi@example.com',
      passwordHash: 'DEMO_HASH_ngozi_eze',
      displayName: 'Ngozi Eze',
      bio: 'Social worker and frequent blood donor. Helping families in need.',
      avatar: null,
      location: 'Abuja, Nigeria',
      skills: ['counselling', 'childcare', 'social-media'],
      languages: ['English', 'Igbo'],
      availability: [{ ...slotA }, { ...slotD }],
      interests: ['social work', 'health', 'child welfare'],
      role: 'user',
      bloodDonor: true,
      createdAt: '2026-09-18T10:00',
      onboarded: true,
    },
    {
      id: 'u7',
      username: 'tunde_adeyemi',
      email: 'tunde@example.com',
      passwordHash: 'DEMO_HASH_tunde_adeyemi',
      displayName: 'Tunde Adeyemi',
      bio: 'Tech volunteer teaching coding to youth in underserved communities.',
      avatar: null,
      location: 'Lagos, Nigeria',
      skills: ['coding', 'teaching', 'graphic-design'],
      languages: ['English', 'Yoruba'],
      availability: [{ ...slotC }, { ...slotD }],
      interests: ['education', 'technology', 'youth'],
      role: 'user',
      bloodDonor: false,
      createdAt: '2026-09-20T09:00',
      onboarded: true,
    },
    {
      id: 'u8',
      username: 'aisha_ibrahim',
      email: 'aisha@example.com',
      passwordHash: 'DEMO_HASH_aisha_ibrahim',
      displayName: 'Aisha Ibrahim',
      bio: 'Environmental advocate organising clean-up drives across northern Nigeria.',
      avatar: null,
      location: 'Kano, Nigeria',
      skills: ['logistics', 'driving', 'social-media'],
      languages: ['English', 'Hausa'],
      availability: [{ ...slotA }, { ...slotB }],
      interests: ['environment', 'community', 'health'],
      role: 'user',
      bloodDonor: false,
      createdAt: '2026-09-22T11:30',
      onboarded: true,
    },
    {
      id: 'u9',
      username: 'chidi_okeke',
      email: 'chidi@example.com',
      passwordHash: 'DEMO_HASH_chidi_okeke',
      displayName: 'Chidi Okeke',
      bio: 'Chef and cooking volunteer providing meals at local shelters.',
      avatar: null,
      location: 'Enugu, Nigeria',
      skills: ['cooking', 'catering', 'cleaning'],
      languages: ['English', 'Igbo'],
      availability: [{ ...slotB }, { ...slotC }],
      interests: ['food security', 'community', 'health'],
      role: 'user',
      bloodDonor: true,
      createdAt: '2026-09-25T08:00',
      onboarded: true,
    },
    {
      id: 'u10',
      username: 'blessing_okonkwo',
      email: 'blessing@example.com',
      passwordHash: 'DEMO_HASH_blessing_okonkwo',
      displayName: 'Blessing Okonkwo',
      bio: 'Fundraising coordinator with 7 years experience in the NGO sector.',
      avatar: null,
      location: 'Lagos, Nigeria',
      skills: ['fundraising', 'admin', 'event-setup'],
      languages: ['English', 'Igbo'],
      availability: [{ ...slotA }, { ...slotD }],
      interests: ['fundraising', 'community', 'education'],
      role: 'user',
      bloodDonor: false,
      createdAt: '2026-09-28T13:00',
      onboarded: true,
    },
    {
      id: 'u11',
      username: 'alex_rivera',
      email: 'alex@example.com',
      passwordHash: 'DEMO_HASH_alex_rivera',
      displayName: 'Alex Rivera',
      bio: 'Nursing student, CPR certified, and fluent Spanish speaker.',
      avatar: null,
      location: 'Lagos, Nigeria',
      skills: ['first-aid', 'cpr', 'spanish', 'nursing'],
      languages: ['English', 'Spanish'],
      availability: [{ ...slotA }, { ...slotC }, { ...slotD }],
      interests: ['health', 'community', 'education'],
      role: 'user',
      bloodDonor: true,
      createdAt: '2026-10-01T09:00',
      onboarded: true,
    },
  ];
}

/**
 * Returns a fresh array of 4 sample Organisation objects.
 * verificationStatus: 'verified' | 'pending' | 'draft' | 'rejected'
 *
 * @returns {Array<object>}
 */
export function getSampleOrgs() {
  return [
    {
      id: 'org1',
      name: 'Bright Futures Orphanage',
      type: 'orphanage',
      description: 'A home and learning centre for 80 children aged 3–17 in Lagos.',
      mission: 'To provide a safe, nurturing and educational environment for orphaned children.',
      contact: 'info@brightfutures.ng',
      website: 'https://brightfutures.ng',
      operatingArea: 'Lagos, Nigeria',
      representative: 'u2',
      members: ['u2'],
      verificationStatus: 'verified',
      verificationNote: 'Documents verified by admin on 2026-09-20.',
      createdAt: '2026-09-15T08:00',
      ownerId: 'u2',
    },
    {
      id: 'org2',
      name: 'Hands of Hope Shelter',
      type: 'shelter',
      description: 'Emergency shelter providing food and temporary housing to displaced families.',
      mission: 'To restore dignity and hope to families affected by displacement.',
      contact: 'contact@handsofhope.ng',
      website: '',
      operatingArea: 'Abuja, Nigeria',
      representative: 'u6',
      members: ['u6', 'u8'],
      verificationStatus: 'pending',
      verificationNote: 'Awaiting document review.',
      createdAt: '2026-09-28T10:00',
      ownerId: 'u6',
    },
    {
      id: 'org3',
      name: 'GreenNigeria Initiative',
      type: 'ngo',
      description: 'An NGO driving environmental awareness and clean-up campaigns nationwide.',
      mission: 'A cleaner, greener Nigeria for future generations.',
      contact: 'hello@greennigeria.org',
      website: 'https://greennigeria.org',
      operatingArea: 'Nationwide, Nigeria',
      representative: 'u8',
      members: ['u8'],
      verificationStatus: 'draft',
      verificationNote: '',
      createdAt: '2026-10-02T11:00',
      ownerId: 'u8',
    },
    {
      id: 'org4',
      name: 'YouthBridge Community',
      type: 'community',
      description: 'A community group connecting youth volunteers with local projects.',
      mission: 'Empowering youth through meaningful community service.',
      contact: 'youthbridge@example.com',
      website: '',
      operatingArea: 'Port Harcourt, Nigeria',
      representative: 'u5',
      members: ['u5', 'u7'],
      verificationStatus: 'rejected',
      verificationNote: 'Incomplete documentation submitted. Please re-apply with full records.',
      createdAt: '2026-10-05T09:00',
      ownerId: 'u5',
    },
  ];
}

/**
 * Returns a fresh array of 8 sample Post objects for the community feed.
 *
 * @returns {Array<object>}
 */
export function getSamplePosts() {
  return [
    {
      id: 'p1',
      authorId: 'u1',
      text: 'Just finished organising the campus food drive — 200kg of canned goods collected! Huge thanks to every volunteer who showed up at 6am. 🙌',
      tags: ['food-security', 'community'],
      likes: ['u2', 'u3', 'u6'],
      createdAt: '2026-10-10T14:30',
    },
    {
      id: 'p2',
      authorId: 'u2',
      text: 'Bright Futures Orphanage just received a verified badge on VolunteerMatch! We are now accepting volunteer applications for our after-school tutoring programme.',
      tags: ['education', 'child-welfare'],
      likes: ['u1', 'u4', 'u7', 'u10'],
      createdAt: '2026-10-11T09:15',
    },
    {
      id: 'p3',
      authorId: 'u6',
      text: 'Hands of Hope Shelter served 150 meals today. Grateful to our kitchen volunteers. If you can spare 3 hours on Saturday, we need you!',
      tags: ['food-security', 'shelter'],
      likes: ['u1', 'u3'],
      createdAt: '2026-10-11T18:00',
    },
    {
      id: 'p4',
      authorId: 'u7',
      text: 'Wrapped up a 4-week beginner coding bootcamp for 30 students in Surulere. Every single student built their first webpage. 💻🎉',
      tags: ['education', 'technology'],
      likes: ['u1', 'u2', 'u4', 'u8'],
      createdAt: '2026-10-12T10:00',
    },
    {
      id: 'p5',
      authorId: 'u8',
      text: 'GreenNigeria cleaned up 2km of Kano riverside today — 40 bags of waste collected. The river is breathing again. Join our next drive!',
      tags: ['environment', 'community'],
      likes: ['u3', 'u5', 'u9'],
      createdAt: '2026-10-12T16:45',
    },
    {
      id: 'p6',
      authorId: 'u3',
      text: 'Ran a free first-aid training session for 25 market traders in Oshodi today. Knowing CPR could save a life. Everyone passed!',
      tags: ['health', 'education'],
      likes: ['u1', 'u6', 'u11'],
      createdAt: '2026-10-13T11:30',
    },
    {
      id: 'p7',
      authorId: 'u10',
      text: 'Our fundraising campaign for Bright Futures reached 70% of target in just 5 days. Thank you to every donor. Keep it going! 🙏',
      tags: ['fundraising', 'child-welfare'],
      likes: ['u2', 'u4', 'u7'],
      createdAt: '2026-10-13T14:00',
    },
    {
      id: 'p8',
      authorId: 'u4',
      text: 'Translated 3 community health booklets into Hausa and French this week — free for any NGO to use. DM me for the files.',
      tags: ['health', 'education', 'community'],
      likes: ['u3', 'u8', 'u11'],
      createdAt: '2026-10-14T08:20',
    },
  ];
}

/**
 * Returns a fresh array of 5 sample Opportunity objects.
 * opp1-opp4 are open; opp5 is closed.
 *
 * @returns {Array<object>}
 */
export function getSampleOpportunities() {
  return [
    {
      id: 'opp1',
      title: 'Food Bank Sorting Shift',
      description: 'Help sort and pack donated food items at the Lagos Food Bank. No experience needed — just a willing pair of hands.',
      organiserId: 'u2',
      orgId: 'org1',
      requiredSkills: ['logistics', 'catering'],
      slot: { ...slotA },
      volunteersNeeded: 4,
      assignedVolunteers: [],
      location: 'Lagos Food Bank, Victoria Island',
      format: 'in-person',
      category: 'food-security',
      deadline: '2026-10-15T23:59',
      status: 'open',
      applications: [
        { userId: 'u3', status: 'submitted', appliedAt: '2026-10-11T09:00' },
      ],
    },
    {
      id: 'opp2',
      title: 'After-School Tutoring — Mathematics',
      description: 'Provide weekly one-hour maths tutoring sessions to primary school students at Bright Futures Orphanage.',
      organiserId: 'u2',
      orgId: 'org1',
      requiredSkills: ['teaching'],
      slot: { label: 'Every Saturday, 10am–11am', start: '2026-10-17T10:00', end: '2026-10-17T11:00' },
      volunteersNeeded: 2,
      assignedVolunteers: ['u7'],
      location: 'Bright Futures Orphanage, Lagos',
      format: 'in-person',
      category: 'education',
      deadline: '2026-10-20T23:59',
      status: 'open',
      applications: [
        { userId: 'u7', status: 'accepted', appliedAt: '2026-10-09T14:00' },
      ],
    },
    {
      id: 'opp3',
      title: 'Community Health Outreach',
      description: 'Join our team for a free health screening day in Ajegunle. Tasks include blood pressure checks, basic first aid and health education.',
      organiserId: 'u3',
      orgId: null,
      requiredSkills: ['first-aid', 'nursing', 'cpr'],
      slot: { ...slotB },
      volunteersNeeded: 6,
      assignedVolunteers: ['u11'],
      location: 'Ajegunle Community Centre, Lagos',
      format: 'in-person',
      category: 'health',
      deadline: '2026-10-16T23:59',
      status: 'open',
      applications: [
        { userId: 'u11', status: 'accepted', appliedAt: '2026-10-10T11:00' },
        { userId: 'u6', status: 'submitted', appliedAt: '2026-10-12T15:30' },
      ],
    },
    {
      id: 'opp4',
      title: 'Riverside Clean-Up Drive',
      description: 'Join GreenNigeria to clean up the Kano riverside. Gloves and bags provided. Bring water!',
      organiserId: 'u8',
      orgId: 'org3',
      requiredSkills: ['logistics', 'driving'],
      slot: { ...slotD },
      volunteersNeeded: 15,
      assignedVolunteers: ['u5'],
      location: 'Kano River, Northern Bank',
      format: 'in-person',
      category: 'environment',
      deadline: '2026-10-16T18:00',
      status: 'open',
      applications: [
        { userId: 'u5', status: 'accepted', appliedAt: '2026-10-08T09:00' },
        { userId: 'u8', status: 'accepted', appliedAt: '2026-10-08T09:05' },
        { userId: 'u1', status: 'submitted', appliedAt: '2026-10-13T10:00' },
      ],
    },
    {
      id: 'opp5',
      title: 'Fundraising Gala — Volunteer Ushers',
      description: 'Assist with guest management and logistics at the annual Bright Futures fundraising gala.',
      organiserId: 'u10',
      orgId: 'org1',
      requiredSkills: ['event-setup', 'logistics', 'fundraising'],
      slot: { label: 'Fri Oct 10, 6pm–11pm', start: '2026-10-10T18:00', end: '2026-10-10T23:00' },
      volunteersNeeded: 5,
      assignedVolunteers: ['u1', 'u4', 'u10'],
      location: 'Eko Hotel, Lagos',
      format: 'in-person',
      category: 'community',
      deadline: '2026-10-08T23:59',
      status: 'closed',
      applications: [
        { userId: 'u1', status: 'accepted', appliedAt: '2026-10-05T08:00' },
        { userId: 'u4', status: 'accepted', appliedAt: '2026-10-05T09:30' },
        { userId: 'u10', status: 'accepted', appliedAt: '2026-10-05T10:00' },
      ],
    },
  ];
}

/**
 * Returns a fresh array of 4 sample DonationRequest objects.
 * Two food requests, one medical, one clothing.
 *
 * @returns {Array<object>}
 */
export function getSampleDonations() {
  return [
    {
      id: 'don1',
      orgId: 'org1',
      type: 'resource',
      title: 'Canned Food Drive',
      description: 'We need canned and non-perishable food items to stock the Bright Futures food pantry for the next 3 months.',
      category: 'food',
      items: [
        { name: 'Canned beans', quantity: 200, unit: 'cans' },
        { name: 'Rice (5kg bags)', quantity: 50, unit: 'bags' },
        { name: 'Tomato paste', quantity: 100, unit: 'tins' },
      ],
      priority: 'high',
      deadline: '2026-10-31',
      status: 'open',
      offers: [
        { userId: 'u4', quantity: 50, note: 'Dropping off Saturday', offeredAt: '2026-10-10T10:00' },
        { userId: 'u9', quantity: 30, note: 'Will deliver canned beans', offeredAt: '2026-10-11T14:00' },
      ],
      createdAt: '2026-10-01T08:00',
    },
    {
      id: 'don2',
      orgId: 'org2',
      type: 'fundraising',
      title: 'Emergency Shelter Repair Fund',
      description: 'The Hands of Hope shelter roof sustained damage in last month\'s heavy rains. We need funds to repair it before the next rainy season.',
      category: 'other',
      items: [],
      priority: 'urgent',
      deadline: '2026-11-15',
      status: 'open',
      offers: [
        { userId: 'u10', quantity: 1, note: 'Campaign contribution ₦5,000', offeredAt: '2026-10-12T09:00' },
      ],
      createdAt: '2026-10-08T11:00',
    },
    {
      id: 'don3',
      orgId: 'org1',
      type: 'resource',
      title: 'Medical Supplies for Health Outreach',
      description: 'Seeking basic medical supplies for our quarterly community health outreach day.',
      category: 'medical',
      items: [
        { name: 'Bandages (box)', quantity: 20, unit: 'boxes' },
        { name: 'Gloves (pack)', quantity: 30, unit: 'packs' },
        { name: 'Paracetamol (strips)', quantity: 100, unit: 'strips' },
      ],
      priority: 'medium',
      deadline: '2026-10-25',
      status: 'partial',
      offers: [
        { userId: 'u3', quantity: 10, note: 'Donating 10 packs of gloves', offeredAt: '2026-10-09T16:00' },
      ],
      createdAt: '2026-10-05T09:00',
    },
    {
      id: 'don4',
      orgId: 'org2',
      type: 'resource',
      title: 'Winter Clothing Drive',
      description: 'Collecting warm clothing items for families at the Hands of Hope shelter ahead of the harmattan season.',
      category: 'clothing',
      items: [
        { name: 'Blankets', quantity: 50, unit: 'pieces' },
        { name: 'Jackets (adult)', quantity: 30, unit: 'pieces' },
        { name: 'Socks (pairs)', quantity: 100, unit: 'pairs' },
      ],
      priority: 'medium',
      deadline: '2026-11-01',
      status: 'open',
      offers: [],
      createdAt: '2026-10-09T10:00',
    },
  ];
}

/**
 * Returns a fresh array of 4 sample BloodDonorProfile objects.
 * Blood groups: O+, A+, B+, AB-
 *
 * @returns {Array<object>}
 */
export function getSampleBloodDonors() {
  return [
    {
      userId: 'u6',
      bloodGroup: 'O+',
      location: 'Abuja, Nigeria',
      active: true,
      lastUpdated: '2026-10-01',
    },
    {
      userId: 'u9',
      bloodGroup: 'A+',
      location: 'Enugu, Nigeria',
      active: true,
      lastUpdated: '2026-09-28',
    },
    {
      userId: 'u11',
      bloodGroup: 'B+',
      location: 'Lagos, Nigeria',
      active: true,
      lastUpdated: '2026-10-01',
    },
    {
      userId: 'u4',
      bloodGroup: 'AB-',
      location: 'Abuja, Nigeria',
      active: true,
      lastUpdated: '2026-09-30',
    },
  ];
}

/**
 * Returns a fresh array of 3 sample BloodRequest objects.
 * Statuses: open, matched, fulfilled.
 *
 * @returns {Array<object>}
 */
export function getSampleBloodRequests() {
  return [
    {
      id: 'br1',
      requesterId: 'u7',
      bloodGroup: 'A+',
      facility: 'Lagos University Teaching Hospital',
      location: 'Lagos, Nigeria',
      urgency: 'urgent',
      requiredBy: '2026-10-18T18:00',
      contactMethod: 'In-app message only',
      status: 'open',
      verifiedByAdmin: false,
      createdAt: '2026-10-13T08:00',
    },
    {
      id: 'br2',
      requesterId: 'u5',
      bloodGroup: 'O+',
      facility: 'National Hospital Abuja',
      location: 'Abuja, Nigeria',
      urgency: 'critical',
      requiredBy: '2026-10-15T12:00',
      contactMethod: 'Call +234 800 0000 001',
      status: 'matched',
      verifiedByAdmin: true,
      createdAt: '2026-10-12T21:00',
    },
    {
      id: 'br3',
      requesterId: 'u1',
      bloodGroup: 'B+',
      facility: 'University of Lagos Medical Centre',
      location: 'Lagos, Nigeria',
      urgency: 'routine',
      requiredBy: '2026-10-20T10:00',
      contactMethod: 'Email: coordinator@unilag.edu.ng',
      status: 'fulfilled',
      verifiedByAdmin: true,
      createdAt: '2026-10-08T10:00',
    },
  ];
}

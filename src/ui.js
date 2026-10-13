/**
 * ui.js — All DOM rendering functions for VolunteerMatch.
 * Each exported function receives a container element and rebuilds it from scratch.
 */

/**
 * Renders the volunteer roster into the given container.
 *
 * @param {object[]} volunteers - Array of Volunteer objects
 * @param {object[]} tasks - Array of Task objects (used to look up task names)
 * @param {HTMLElement} container - The DOM element to render into
 */
export function renderRoster(volunteers, tasks, container) {
  container.innerHTML = '';

  volunteers.forEach(volunteer => {
    const card = document.createElement('div');
    card.className = 'volunteer-card';
    card.setAttribute('role', 'listitem');

    // Name
    const nameEl = document.createElement('h3');
    nameEl.textContent = volunteer.name;
    card.appendChild(nameEl);

    // Bio
    const bioEl = document.createElement('p');
    bioEl.className = 'bio';
    bioEl.textContent = volunteer.bio;
    card.appendChild(bioEl);

    // Skill tags
    const tagsEl = document.createElement('div');
    tagsEl.className = 'skill-tags';
    volunteer.skills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = skill;
      tagsEl.appendChild(tag);
    });
    card.appendChild(tagsEl);

    // Availability
    const availEl = document.createElement('p');
    availEl.className = 'availability-text';
    availEl.textContent = 'Available: ' + volunteer.availability.map(s => s.label).join(', ');
    card.appendChild(availEl);

    // Assignments
    const assignEl = document.createElement('p');
    assignEl.className = 'assignment-text';
    if (volunteer.assignments.length === 0) {
      assignEl.textContent = 'No current assignments';
    } else {
      const taskNames = volunteer.assignments
        .map(tid => {
          const t = tasks.find(tk => tk.id === tid);
          return t ? t.name : tid;
        })
        .join(', ');
      const count = volunteer.assignments.length;
      assignEl.textContent = `Assigned: ${taskNames} (${count} task${count > 1 ? 's' : ''})`;
    }
    card.appendChild(assignEl);

    container.appendChild(card);
  });
}

/**
 * Renders the task entry form into the given container.
 *
 * @param {string[]} skills - The SKILLS catalogue
 * @param {function} onSubmit - Called with a task draft object on valid submission
 * @param {HTMLElement} container - The DOM element to render into
 * @param {boolean} aiEnabled - Whether AI extraction is active
 * @param {function} onExtract - Called with the description string when Extract is clicked
 */
export function renderTaskForm(skills, onSubmit, container, aiEnabled, onExtract) {
  container.innerHTML = '';

  const formEl = document.createElement('form');
  formEl.className = 'task-form';
  formEl.setAttribute('novalidate', '');

  // Heading
  const heading = document.createElement('h2');
  heading.className = 'panel-title';
  heading.textContent = '📋 Find Volunteers for a Task';
  formEl.appendChild(heading);

  // Task Name
  const nameGroup = document.createElement('div');
  nameGroup.className = 'form-group';
  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', 'task-name');
  nameLabel.textContent = 'Task Name *';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'task-name';
  nameInput.required = true;
  nameInput.setAttribute('aria-label', 'Task name');
  nameInput.placeholder = 'e.g. Registration Desk';
  const nameErr = document.createElement('p');
  nameErr.id = 'err-name';
  nameErr.className = 'error-message';
  nameErr.setAttribute('role', 'alert');
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  nameGroup.appendChild(nameErr);
  formEl.appendChild(nameGroup);

  // Description
  const descGroup = document.createElement('div');
  descGroup.className = 'form-group';
  const descLabel = document.createElement('label');
  descLabel.setAttribute('for', 'task-description');
  descLabel.textContent = 'Description';
  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.id = 'task-description';
  descInput.setAttribute('aria-label', 'Task description');
  descInput.placeholder = 'Describe what volunteers will do…';
  descGroup.appendChild(descLabel);
  descGroup.appendChild(descInput);

  // AI extract button
  if (aiEnabled) {
    const aiBadge = document.createElement('p');
    aiBadge.className = 'ai-badge';
    aiBadge.textContent = '✨ AI skill extraction is active';
    descGroup.appendChild(aiBadge);

    const extractBtn = document.createElement('button');
    extractBtn.type = 'button';
    extractBtn.id = 'extract-btn';
    extractBtn.className = 'btn btn-secondary';
    extractBtn.textContent = 'Extract Skills from Description';
    extractBtn.addEventListener('click', async () => {
      if (onExtract) await onExtract(descInput.value);
    });
    descGroup.appendChild(extractBtn);
  }
  formEl.appendChild(descGroup);

  // Required Skills
  const skillsGroup = document.createElement('div');
  skillsGroup.className = 'form-group';
  const skillsLabel = document.createElement('label');
  skillsLabel.textContent = 'Required Skills *';
  const skillsGrid = document.createElement('div');
  skillsGrid.className = 'skills-grid';
  skills.forEach(skill => {
    const lbl = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = 'skills';
    cb.value = skill;
    cb.setAttribute('aria-label', skill);
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(' ' + skill));
    skillsGrid.appendChild(lbl);
  });
  const skillsErr = document.createElement('p');
  skillsErr.id = 'err-skills';
  skillsErr.className = 'error-message';
  skillsErr.setAttribute('role', 'alert');
  skillsGroup.appendChild(skillsLabel);
  skillsGroup.appendChild(skillsGrid);
  skillsGroup.appendChild(skillsErr);
  formEl.appendChild(skillsGroup);

  // Start Time
  const startGroup = document.createElement('div');
  startGroup.className = 'form-group';
  const startLabel = document.createElement('label');
  startLabel.setAttribute('for', 'task-start');
  startLabel.textContent = 'Start Time *';
  const startInput = document.createElement('input');
  startInput.type = 'datetime-local';
  startInput.id = 'task-start';
  startInput.value = '2026-10-17T09:00';
  startInput.setAttribute('aria-label', 'Task start time');
  startGroup.appendChild(startLabel);
  startGroup.appendChild(startInput);
  formEl.appendChild(startGroup);

  // End Time
  const endGroup = document.createElement('div');
  endGroup.className = 'form-group';
  const endLabel = document.createElement('label');
  endLabel.setAttribute('for', 'task-end');
  endLabel.textContent = 'End Time *';
  const endInput = document.createElement('input');
  endInput.type = 'datetime-local';
  endInput.id = 'task-end';
  endInput.value = '2026-10-17T11:00';
  endInput.setAttribute('aria-label', 'Task end time');
  const slotErr = document.createElement('p');
  slotErr.id = 'err-slot';
  slotErr.className = 'error-message';
  slotErr.setAttribute('role', 'alert');
  endGroup.appendChild(endLabel);
  endGroup.appendChild(endInput);
  endGroup.appendChild(slotErr);
  formEl.appendChild(endGroup);

  // Volunteers Needed
  const volGroup = document.createElement('div');
  volGroup.className = 'form-group';
  const volLabel = document.createElement('label');
  volLabel.setAttribute('for', 'task-volunteers');
  volLabel.textContent = 'Volunteers Needed *';
  const volInput = document.createElement('input');
  volInput.type = 'number';
  volInput.id = 'task-volunteers';
  volInput.min = '1';
  volInput.value = '1';
  volInput.setAttribute('aria-label', 'Number of volunteers needed');
  const volErr = document.createElement('p');
  volErr.id = 'err-volunteers';
  volErr.className = 'error-message';
  volErr.setAttribute('role', 'alert');
  volGroup.appendChild(volLabel);
  volGroup.appendChild(volInput);
  volGroup.appendChild(volErr);
  formEl.appendChild(volGroup);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.style.width = '100%';
  submitBtn.textContent = '🔍 Find Volunteers';
  formEl.appendChild(submitBtn);

  // Form submit handler
  formEl.addEventListener('submit', e => {
    e.preventDefault();

    // Clear previous errors
    nameErr.textContent = '';
    skillsErr.textContent = '';
    slotErr.textContent = '';
    volErr.textContent = '';

    let valid = true;

    const name = nameInput.value.trim();
    if (!name) {
      nameErr.textContent = 'Task name is required.';
      valid = false;
    }

    const checkedSkills = Array.from(
      formEl.querySelectorAll('input[name="skills"]:checked')
    ).map(cb => cb.value);
    if (checkedSkills.length === 0) {
      skillsErr.textContent = 'Select at least one required skill.';
      valid = false;
    }

    const startVal = startInput.value;
    const endVal = endInput.value;
    if (!startVal || !endVal) {
      slotErr.textContent = 'Start and end times are required.';
      valid = false;
    } else if (startVal >= endVal) {
      slotErr.textContent = 'End time must be after start time.';
      valid = false;
    }

    const volunteersNeeded = parseInt(volInput.value, 10);
    if (isNaN(volunteersNeeded) || volunteersNeeded < 1) {
      volErr.textContent = 'At least 1 volunteer is required.';
      valid = false;
    }

    if (!valid) return;

    // Build a human-readable slot label
    const startDate = new Date(startVal);
    const endDate = new Date(endVal);
    const fmt = d => d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const slotLabel = `${fmt(startDate)} – ${fmt(endDate)}`;

    onSubmit({
      name,
      description: descInput.value.trim(),
      requiredSkills: checkedSkills,
      slot: { label: slotLabel, start: startVal, end: endVal },
      volunteersNeeded,
    });
  });

  container.appendChild(formEl);
}

/**
 * Renders the ranked volunteer results for a task.
 *
 * @param {object[]} results - Array of MatchResult objects from rankVolunteers
 * @param {object|null} task - The current task being matched
 * @param {number} unfilledCount - Number of volunteer slots that cannot be filled
 * @param {function} onAssign - Called with volunteerId when Assign is clicked
 * @param {HTMLElement} container - The DOM element to render into
 */
export function renderResults(results, task, unfilledCount, onAssign, container) {
  container.innerHTML = '';

  if (results.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'results-placeholder';
    placeholder.textContent = 'Submit a task to see volunteer rankings.';
    container.appendChild(placeholder);
    return;
  }

  // Results heading
  const heading = document.createElement('h2');
  heading.className = 'panel-title';
  heading.textContent = `🏆 Rankings for: ${task.name}`;
  container.appendChild(heading);

  // Unfilled warning
  if (unfilledCount > 0) {
    const warning = document.createElement('div');
    warning.className = 'unfilled-warning';
    warning.setAttribute('role', 'alert');
    warning.textContent = `⚠️ ${unfilledCount} of ${task.volunteersNeeded} volunteer slot(s) cannot be filled — no eligible volunteers remain.`;
    container.appendChild(warning);
  }

  // Result list
  const list = document.createElement('div');
  list.setAttribute('role', 'list');

  results.forEach((result, i) => {
    const { volunteer, score, matchedSkills, missingSkills, availabilityMatch,
            isDuplicate, hasConflict, conflictingTask, explanation,
            skillScore, availScore, workloadPenalty } = result;

    // Determine tier
    let tier;
    if (isDuplicate || hasConflict) {
      tier = 'tier-ineligible';
    } else if (score >= 30) {
      tier = 'tier-high';
    } else if (score >= 10) {
      tier = 'tier-mid';
    } else {
      tier = 'tier-low';
    }

    const card = document.createElement('div');
    card.className = `result-card ${tier}`;
    card.setAttribute('role', 'listitem');

    // Rank badge
    const rankBadge = document.createElement('div');
    rankBadge.className = 'rank-badge';
    rankBadge.setAttribute('aria-label', `Rank ${i + 1}`);
    rankBadge.textContent = `#${i + 1}`;
    card.appendChild(rankBadge);

    // Middle content
    const middle = document.createElement('div');

    const nameEl = document.createElement('h3');
    nameEl.textContent = volunteer.name;
    middle.appendChild(nameEl);

    // Score breakdown text
    const scoreBreakdown = document.createElement('p');
    scoreBreakdown.className = 'explanation-text';
    scoreBreakdown.textContent = `Skills: +${skillScore} | Availability: +${availScore} | Workload: ${workloadPenalty}`;
    middle.appendChild(scoreBreakdown);

    // Explanation
    const explEl = document.createElement('p');
    explEl.className = 'explanation-text';
    explEl.textContent = explanation;
    middle.appendChild(explEl);

    // Skill tags
    const tagsEl = document.createElement('div');
    tagsEl.className = 'skill-tags';
    matchedSkills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag skill-matched';
      tag.textContent = `✅ ${skill}`;
      tagsEl.appendChild(tag);
    });
    missingSkills.forEach(skill => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag skill-missing';
      tag.textContent = `❌ ${skill}`;
      tagsEl.appendChild(tag);
    });
    middle.appendChild(tagsEl);

    // Availability indicator
    const availEl = document.createElement('p');
    availEl.className = 'availability-indicator';
    availEl.textContent = availabilityMatch ? '✅ Available' : '⚠️ Unavailable';
    middle.appendChild(availEl);

    // Workload
    const workloadEl = document.createElement('p');
    workloadEl.className = 'explanation-text';
    const count = volunteer.assignments.length;
    workloadEl.textContent = `${count} current assignment${count !== 1 ? 's' : ''}`;
    middle.appendChild(workloadEl);

    card.appendChild(middle);

    // Right section: score badge + assign button
    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.flexDirection = 'column';
    right.style.alignItems = 'center';
    right.style.gap = '0.5rem';

    const scoreBadge = document.createElement('div');
    const scoreClass = score >= 30 ? 'score-high' : score >= 10 ? 'score-mid' : 'score-low';
    scoreBadge.className = `score-badge ${scoreClass}`;
    scoreBadge.setAttribute('aria-label', `Score: ${score}`);
    scoreBadge.textContent = score;
    right.appendChild(scoreBadge);

    const assignBtn = document.createElement('button');
    assignBtn.className = 'btn btn-primary';
    assignBtn.textContent = 'Assign';
    assignBtn.setAttribute('aria-label', `Assign ${volunteer.name}`);

    if (isDuplicate) {
      assignBtn.disabled = true;
      assignBtn.title = 'Already assigned to this task';
      assignBtn.setAttribute('aria-disabled', 'true');
    } else if (hasConflict) {
      assignBtn.disabled = true;
      assignBtn.title = `Scheduling conflict with: ${conflictingTask.name}`;
      assignBtn.setAttribute('aria-disabled', 'true');
    } else {
      assignBtn.addEventListener('click', () => onAssign(volunteer.id));
    }

    right.appendChild(assignBtn);
    card.appendChild(right);

    list.appendChild(card);
  });

  container.appendChild(list);

  // Scroll results into view smoothly
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

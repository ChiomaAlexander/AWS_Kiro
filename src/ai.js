/**
 * ai.js — Optional AI-powered skill extraction for VolunteerMatch.
 *
 * AI extraction is only active when window.__AI_API_KEY is set at runtime.
 * If the key is absent, AI_ENABLED is false and extractSkills returns an empty
 * result immediately. AI output is always validated against the known skills list
 * before use. AI never determines eligibility or overrides the deterministic score.
 */

/** @type {boolean} True only when running in a browser with __AI_API_KEY set. */
export const AI_ENABLED = typeof window !== 'undefined' && !!window.__AI_API_KEY;

/**
 * Attempts to extract skill tags from a natural-language task description using
 * the OpenAI API. Falls back gracefully to an empty result on any error.
 *
 * @param {string} description - Free-text task description
 * @param {string[]} knownSkills - The SKILLS catalogue to validate against
 * @returns {Promise<{ skills: string[], source: 'ai'|'manual' }>}
 */
export async function extractSkills(description, knownSkills) {
  if (!AI_ENABLED) {
    return { skills: [], source: 'manual' };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${window.__AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Extract skill tags from this description as a JSON array. Only use tags from this list: ${knownSkills.join(', ')}. Description: ${description}. Respond with only a JSON array like ["tag1","tag2"].`,
          },
        ],
        temperature: 0,
      }),
    });

    const data = await res.json();
    const raw = JSON.parse(data.choices[0].message.content);
    const validatedSkills = Array.isArray(raw)
      ? raw.filter(s => knownSkills.includes(s))
      : [];

    return { skills: validatedSkills, source: 'ai' };
  } catch (err) {
    console.warn('[VolunteerMatch] AI extraction failed:', err);
    return { skills: [], source: 'manual' };
  }
}

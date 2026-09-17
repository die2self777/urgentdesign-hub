/**
 * Gemini API Service
 *
 * Direct fetch() calls to the Google Gemini API using GEMINI_API_KEY
 * from environment variables. Bypasses native AI credits.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Generate content using the Gemini API.
 *
 * @param {string} prompt - The text prompt to send
 * @param {object} options - Optional config: { model, temperature, maxOutputTokens }
 * @returns {Promise<string>} The generated text response
 */
export async function generateContent(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const model = options.model || 'gemini-2.0-flash';
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || '';
}

export default { generateContent };

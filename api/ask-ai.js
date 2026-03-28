const https = require('https');
const fs = require('fs/promises');
const path = require('path');

const PORTFOLIO_FILES = ['index.html', 'leolingo.html', 'preplus.html', 'mediops.html', 'gravity.html'];
const MAX_FILE_CONTEXT_LENGTH = 6000;
const MAX_HISTORY_MESSAGES = 8;

let cachedPortfolioContext = null;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `
You are the portfolio assistant for Sachin Tarkar.

Write every answer in first person, as if Sachin himself is replying.
Keep the tone warm, natural, clear, and human.
Answer only from the provided portfolio context and recent chat history.
If something is not supported by the provided context, say that directly instead of inventing details.
Keep answers concise unless the user asks for more depth.
When the user asks about projects, skills, experience, education, resume, contact, or working style, answer like a real person talking about his own work.
`;

const decodeEntities = (text) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim();

const extractTitle = (html) => {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? normalizeWhitespace(decodeEntities(match[1])) : '';
};

const extractDescription = (html) => {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
  return match ? normalizeWhitespace(decodeEntities(match[1])) : '';
};

const extractMainContent = (html) => {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return mainMatch ? mainMatch[1] : html;
};

const htmlToText = (html) => {
  const withAltText = html.replace(/<img\b[^>]*alt=["']([^"']+)["'][^>]*>/gi, ' Image: $1 ');
  const withoutNoise = withAltText
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ');

  return normalizeWhitespace(
    decodeEntities(
      withoutNoise
        .replace(/<\/(section|article|div|p|li|h1|h2|h3|h4|h5|h6|header|footer|main|nav)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
    )
  );
};

const buildFileContext = async (fileName) => {
  const filePath = path.join(process.cwd(), fileName);
  const html = await fs.readFile(filePath, 'utf8');
  const title = extractTitle(html);
  const description = extractDescription(html);
  const mainText = htmlToText(extractMainContent(html)).slice(0, MAX_FILE_CONTEXT_LENGTH);

  return [`FILE: ${fileName}`, title ? `TITLE: ${title}` : '', description ? `DESCRIPTION: ${description}` : '', `CONTENT: ${mainText}`]
    .filter(Boolean)
    .join('\n');
};

const getPortfolioContext = async () => {
  if (cachedPortfolioContext) {
    return cachedPortfolioContext;
  }

  const fileContexts = await Promise.all(PORTFOLIO_FILES.map((fileName) => buildFileContext(fileName)));
  cachedPortfolioContext = fileContexts.join('\n\n---\n\n');
  return cachedPortfolioContext;
};

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((entry) => entry && (entry.role === 'user' || entry.role === 'assistant') && typeof entry.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim().slice(0, 1500),
    }))
    .filter((entry) => entry.content);
};

const resolvePageContext = async (pagePath) => {
  const normalizedPath = typeof pagePath === 'string' ? pagePath.trim() : '';
  const pageName = normalizedPath === '/' || !normalizedPath ? 'index.html' : path.basename(normalizedPath);

  if (!PORTFOLIO_FILES.includes(pageName)) {
    return '';
  }

  return buildFileContext(pageName);
};

const postToGroq = (apiKey, payload) =>
  new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(payload);
    const request = https.request(
      GROQ_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (response) => {
        let raw = '';

        response.on('data', (chunk) => {
          raw += chunk;
        });

        response.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : {};

            if (response.statusCode < 200 || response.statusCode >= 300) {
              const message = parsed?.error?.message || `Groq request failed with status ${response.statusCode}`;
              reject(new Error(message));
              return;
            }

            resolve(parsed);
          } catch {
            reject(new Error('Unable to parse Groq response'));
          }
        });
      }
    );

    request.on('error', (error) => {
      reject(error);
    });

    request.write(requestBody);
    request.end();
  });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing GROQ_API_KEY' }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const pageTitle = typeof body.pageTitle === 'string' ? body.pageTitle.trim() : '';
    const history = normalizeHistory(body.history);

    if (!question) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Question is required' }));
      return;
    }

    const [portfolioContext, pageContext] = await Promise.all([
      getPortfolioContext(),
      resolvePageContext(body.pagePath),
    ]);

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT.trim(),
      },
      {
        role: 'system',
        content: `FULL PORTFOLIO CONTEXT\n\n${portfolioContext}`,
      },
    ];

    if (pageContext) {
      messages.push({
        role: 'system',
        content: `CURRENT PAGE CONTEXT\n\nPAGE TITLE: ${pageTitle || 'Unknown'}\n${pageContext}`,
      });
    }

    messages.push(...history);
    messages.push({
      role: 'user',
      content: question,
    });

    const data = await postToGroq(apiKey, {
      model: GROQ_MODEL,
      messages,
      max_tokens: 700,
      temperature: 0.8,
    });

    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      const message = data?.error?.message || 'Groq request failed';
      throw new Error(message);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ answer }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Ask AI request failed',
      })
    );
  }
};

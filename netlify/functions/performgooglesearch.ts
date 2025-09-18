// netlify/functions/performgooglesearch.ts

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. Get the API keys from the secure environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey) {
      throw new Error("Gemini API key not found.");
    }

    if (!cx) {
      throw new Error("Google Search CX not found.");
    }

    // 3. Parse the request body
    const requestBody = JSON.parse(event.body || '{}');
    const { query } = requestBody;

    if (!query) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Query is required' }) };
    }

    // 4. Build the Google Custom Search API URL
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=3`;

    // 5. Make the request to Google Custom Search API
    const response = await fetch(searchUrl);

    if (!response.ok) {
      const errorData = await response.json();
      return { statusCode: response.status, body: JSON.stringify(errorData) };
    }

    const data = await response.json();

    // 6. Format the search results
    let formattedResults = 'No results found.';

    if (data.items && data.items.length > 0) {
      formattedResults = data.items.slice(0, 3).map((item: any) =>
        `${item.title}\n${item.snippet}`
      ).join('\n\n');
    }

    // 7. Return the formatted search results
    return {
      statusCode: 200,
      body: JSON.stringify({
        query: query,
        results: formattedResults,
        totalResults: data.searchInformation?.totalResults || 0
      }),
    };

  } catch (error) {
    console.error('Google Search function error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};

export { handler };

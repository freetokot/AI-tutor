// netlify/functions/openrouter.ts

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. Get the OpenRouter API key from the secure environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not found.");
    }

    // 3. Parse the request body
    const requestBody = JSON.parse(event.body || '{}');
    const { prompt, model = 'openrouter/sonoma-sky-alpha', systemPrompt, temperature = 0.7, useHistory = true, chatHistory = [] } = requestBody;

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }) };
    }

    // 4. Build the OpenRouter API request body
    let openRouterMessages: Array<{role: string, content: string}> = [];

    // Add system prompt if provided
    if (systemPrompt) {
      openRouterMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    // Add conversation history if enabled
    if (useHistory && chatHistory.length > 0) {
      // Add recent messages from history (excluding system messages)
      const recentMessages = chatHistory.slice(-10).filter((msg: any) => msg.role !== 'system');
      openRouterMessages.push(...recentMessages);
    }

    // Add current user message
    openRouterMessages.push({
      role: 'user',
      content: prompt
    });

    const openRouterRequestBody = {
      model: model,
      messages: openRouterMessages,
      temperature: temperature,
    };

    // 5. Make the request to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(openRouterRequestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { statusCode: response.status, body: JSON.stringify(errorData) };
    }

    const data = await response.json();

    // 6. Check if the response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected response format from OpenRouter' }) };
    }

    const botMessage = data.choices[0].message.content || 'No response content';

    // 7. Return the response in a format similar to Gemini for consistency
    return {
      statusCode: 200,
      body: JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: botMessage
            }],
            role: 'model'
          },
          finishReason: 'STOP',
          index: 0
        }]
      }),
    };

  } catch (error) {
    console.error('OpenRouter function error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};

export { handler };

// netlify/functions/gemini.ts

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. Get the API key from the secure environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not found.");
    }

    // 3. Parse the request body
    const requestBody = JSON.parse(event.body || '{}');
    const { prompt, model = 'models/gemini-2.5-flash', systemPrompt, temperature = 0.7, useTools = false, useHistory = true, chatHistory = [] } = requestBody;

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }) };
    }

    // 4. Build the Gemini API request body
    const geminiRequestBody: any = {
      contents: [],
      generationConfig: {
        temperature: temperature,
      }
    };

    // Add system instruction if provided
    if (systemPrompt) {
      geminiRequestBody.systemInstruction = {
        parts: [{
          text: systemPrompt
        }]
      };
    }

    // Add tools if requested (for function calling)
    if (useTools) {
      geminiRequestBody.tools = [{
        functionDeclarations: [{
          name: 'googleSearch',
          description: 'Search the web for information to answer questions',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to find information'
              }
            },
            required: ['query']
          }
        }]
      }];
    }

    // Add conversation history if enabled
    if (useHistory && chatHistory.length > 0) {
      // Add recent messages from history (excluding system messages)
      const recentMessages = chatHistory.slice(-10).filter((msg: any) => msg.role !== 'system');

      // Convert chat history to Gemini format
      for (const msg of recentMessages) {
        geminiRequestBody.contents.push({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{
            text: msg.content
          }]
        });
      }
    }

    // Add current user message
    //geminiRequestBody.contents.push({
    //  role: 'user',
    //  parts: [{
    //    text: prompt
    //  }]
    //});

    // 5. Make the request to Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { statusCode: response.status, body: JSON.stringify(errorData) };
    }

    const data = await response.json();

    // 6. Return the successful response
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Netlify function error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};

export { handler };

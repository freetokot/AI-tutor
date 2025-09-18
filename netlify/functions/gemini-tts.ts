// netlify/functions/gemini-tts.ts

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 2. Get the Gemini API key from the secure environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not found.");
    }

    // 3. Parse the request body
    const requestBody = JSON.parse(event.body || '{}');
    const { text, voiceName = 'Laomedeia', temperature = 0.7 } = requestBody;

    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Text is required' }) };
    }

    // 4. Build the Gemini TTS API request body
    const geminiTTSRequestBody = {
      contents: [{
        role: 'user',
        parts: [{
          text: text
        }]
      }],
      generationConfig: {
        temperature: temperature,
        responseModalities: ['audio'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    };

    // 5. Make the request to Gemini TTS API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiTTSRequestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { statusCode: response.status, body: JSON.stringify(errorData) };
    }

    const data = await response.json();

    // 6. Check if the response has the expected structure
    if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].inlineData) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected response format from Gemini TTS' }) };
    }

    const inlineData = data.candidates[0].content.parts[0].inlineData;

    // 7. Convert base64 audio content to binary and return as audio response
    const audioBuffer = Buffer.from(inlineData.data, 'base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': inlineData.mimeType || 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      },
      body: audioBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Gemini TTS function error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};

export { handler };

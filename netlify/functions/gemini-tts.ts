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

    // 7. Convert base64 audio content to binary and ensure WAV format
    let audioBuffer = Buffer.from(inlineData.data, 'base64');
    let contentType = 'audio/wav';

    if (!(inlineData.mimeType && inlineData.mimeType.includes('wav'))) {
      // Convert to WAV
      const options = parseMimeType(inlineData.mimeType || 'audio/L16;rate=24000');
      const wavHeader = createWavHeader(audioBuffer.length, options);
      audioBuffer = Buffer.concat([wavHeader, audioBuffer]);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
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

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
  const {
    numChannels,
    sampleRate,
    bitsPerSample,
  } = options;

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);                      // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
  buffer.write('WAVE', 8);                      // Format
  buffer.write('fmt ', 12);                     // Subchunk1ID
  buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);        // NumChannels
  buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
  buffer.writeUInt32LE(byteRate, 28);           // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
  buffer.write('data', 36);                     // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

  return buffer;
}

export { handler };

// SECURE API IMPLEMENTATION - Using Netlify Functions
import { SchemaType } from '@google/generative-ai';

const currentDate = new Date();

// Форматируем дату для русскоязычной локали (дд.мм.гггг)
const formattedDate = currentDate.toLocaleDateString('ru-RU');
// Configs
const LLM_CONFIG = {
    model: 'models/gemini-2.5-flash',
    // systemPrompt: `Ты - вики. Мы тестируем твои возможности. Отвечай на вопросы максимально подробно, с примерами и объяснениями. Если не знаешь ответа, скажи честно, что не знаешь. Используй простой и понятный язык. Твои ответы будут озвучены tts, поэтому заменяй числа и математические действия словами. Если пользователь просит найти актуальную информацию, пользуйся инструментом google search.`,
    systemPrompt: `1. Основная роль:
Ты — «ВИКИ», мудрая и дружелюбная ИИ-помощница и наставница. Твой собеседник — третьеклассник Андрей.
2. Ключевая цель:
Твоя главная задача — развивать любознательность Андрея и учить его мыслить самостоятельно. Ты помогаешь ему как в учебе, так и в познании мира вокруг.
3. Протокол общения (Три режима ответа):
Твой ответ должен соответствовать одному из трех режимов в зависимости от вопроса Андрея.
Режим 1: Безопасность (Неподобающий контент)
Если вопрос касается тем 18+, насилия, или чего-то небезопасного и неподобающего для ребенка:
Мягко и вежливо откажись обсуждать тему. Не читай лекций. Просто скажи, что вы не можете это обсудить.
Пример: «Андрей, эта тема для взрослых, давай поговорим о чем-нибудь другом» или «Я не могу ответить на этот вопрос. Может, хочешь узнать что-то еще?».
Режим 2: Репетитор (Вопросы по школьной программе)
Если вопрос похож на задание для 3 класса (например, посчитай 8*9, найди площадь прямоугольника, подбери проверочное слово):
Твоя цель — помочь ему найти ответ самому. ЗАПРЕТ НА ПРЯМЫЕ ОТВЕТЫ.
Объясняй по шагам: Разбивай сложную задачу на простые этапы.
Задавай наводящие вопросы: Вместо ответа, задай вопрос, который подтолкнет его к правильной мысли. (Например: «Как ты думаешь, какой здесь корень слова?», «Какое действие нужно сделать первым?»).
Хвали и поддерживай: Кратко хвали за правильные шаги. Если он ошибается, не ругай, а помоги найти ошибку. (Например: «Отличная мысль! А давай проверим вот этот шаг еще раз»).
При настойчивости: Если Андрей просит прямой ответ, мягко объясни: «Андрей, моя задача — научить тебя находить ответы самому. Готовый ответ в этом не поможет. Давай попробуем еще раз вместе!».
Режим 3: Энциклопедия (Вопросы про правила, факты и общие темы)
Если вопрос касается любых других тем: о мире, событиях, хобби, науке, животных, космосе и т.д. — отвечаешь честно, подробно и интересно, чтобы удовлетворить его любопытство.
Используй поиск: Обязательно используй инструмент googlesearch для поиска точной и актуальной информации. Поисковый запрос формулируй так, чтобы в краткой выдаче гугла была релевантная информация.
Объясняй просто: Адаптируй найденную информацию так, чтобы она была понятна третьекласснику. Используй простые аналогии.
Будь объективной: Предоставляй факты без личных оценок.
4. Стиль общения:
Краткость: Говори кратко и по существу. Ответы должны быть пригодны для озвучивания (TTS).
Обращение: Обращайся к пользователю по имени «Андрей», но не в каждом сообщении, чтобы это звучало естественно.
Тон: Спокойный, дружелюбный, подбадривающий и немного игривый. Не используй смайлики и эмодзи.
5. Игровой режим:
Если Андрей предлагает поиграть, придумай короткие задания на заданную им тему. Считай, сколько правильных ответов он дал с первого раза. После правильного ответа сразу давай следующее задание. После каждых 5 заданий спрашивай, хочет ли он продолжить.
6. Дата сегодня: ${formattedDate}.`,
    temperature: 0.7,
    tools: [{
        googleSearch: {}, // Пустой объект означает, что инструмент включен без доп. настроек
    }],
};

const TTS_CONFIG = {
    model: 'gemini-2.5-flash-preview-tts',
    temperature: 0.7,
    voiceName: 'Laomedeia',
};

// TTS service endpoints configuration
const TTS_ENDPOINTS = {
    silero: {
        localhost: 'http://localhost:8000/synthesize/',
        internet: 'https://your-ngrok-silero-url.ngrok.io/synthesize/' // Replace with actual ngrok URL
    },
    vosk: {
        localhost: 'http://localhost:8080/synthesize/',
        internet: 'https://celsa-noncelestial-unegregiously.ngrok-free.app/synthesize/' // Current ngrok URL
    }
};

// Function to check if a service is running on localhost
async function checkLocalhostService(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const response = await fetch(url, {
            method: 'POST', // Use POST since the endpoint only accepts POST
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'test' }), // Send a test request
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.log(`Localhost service check failed for ${url}:`, error);
        return false;
    }
}

// Function to check if a message is a model error that should be retried
function isModelError(message: string): boolean {
    if (!message || !message.trim()) return false;

    const errorIndicators = [
        'rate limit',
        'quota exceeded',
        'model overload',
        'server error',
        'internal error',
        'service unavailable',
        'temporary failure',
        'try again',
        'too many requests',
        '429',
        '500',
        '502',
        '503',
        '504'
    ];

    const lowerMessage = message.toLowerCase();
    return errorIndicators.some(indicator => lowerMessage.includes(indicator));
}

// Function to check if an error is retryable
function isRetryableError(errorMessage: string): boolean {
    if (!errorMessage) return false;

    const retryableIndicators = [
        'network',
        'timeout',
        'connection',
        'rate limit',
        'quota exceeded',
        'server error',
        'internal error',
        'service unavailable',
        'temporary failure',
        'try again',
        'too many requests',
        '429',
        '500',
        '502',
        '503',
        '504',
        'fetch'
    ];

    const lowerMessage = errorMessage.toLowerCase();
    return retryableIndicators.some(indicator => lowerMessage.includes(indicator));
}

// Function to make TTS request with localhost fallback
async function makeTTSRequest(service: string, text: string): Promise<Response> {
    const endpoints = TTS_ENDPOINTS[service as keyof typeof TTS_ENDPOINTS];

    if (!endpoints) {
        throw new Error(`Unknown TTS service: ${service}`);
    }

    // First try localhost
    console.log(`Trying localhost for ${service}: ${endpoints.localhost}`);
    const isLocalhostRunning = await checkLocalhostService(endpoints.localhost);

    if (isLocalhostRunning) {
        console.log(`Using localhost for ${service}`);
        const response = await fetch(endpoints.localhost, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            return response;
        }
    }

    // Fallback to internet/ngrok
    console.log(`Localhost not available, trying internet for ${service}: ${endpoints.internet}`);
    const response = await fetch(endpoints.internet, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        throw new Error(`Both localhost and internet endpoints failed for ${service}`);
    }

    return response;
}

// SECURE API CALL FUNCTION WITH LOCAL DEVELOPMENT FALLBACK
async function callGeminiAPI(prompt: string, options: {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  useTools?: boolean;
  provider?: string;
} = {}) {
  const {
    model = 'models/gemini-2.5-flash',
    systemPrompt,
    temperature = 0.7,
    useTools = false,
    provider = 'google'
  } = options;

  // Check if we're running locally (development mode)
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalDev) {
    // LOCAL DEVELOPMENT: Use direct API calls with environment variables
    console.log('🔧 Running in local development mode - using direct API calls');

    if (provider === 'google') {
      // Use Google Gemini API directly
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY environment variable is required for local development');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelInstance = genAI.getGenerativeModel({
        model: model,
        systemInstruction: systemPrompt,
        generationConfig: { temperature },
        tools: useTools ? [{
          functionDeclarations: [{
            name: 'googleSearch',
            description: 'Search the web for information to answer questions',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                query: { type: SchemaType.STRING, description: 'The search query to find information' }
              },
              required: ['query']
            }
          }]
        }] : undefined
      });

      const result = await modelInstance.generateContent(prompt);
      const response = result.response;

      // Convert to the same format as Netlify function
      return {
        candidates: [{
          content: {
            parts: [{
              text: response.text()
            }],
            role: 'model'
          },
          finishReason: 'STOP',
          index: 0
        }]
      };
    } else if (provider === 'openrouter') {
      // Use OpenRouter API directly
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

      if (!apiKey) {
        throw new Error('VITE_OPENROUTER_API_KEY environment variable is required for local development');
      }

      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Unexpected response format from OpenRouter');
      }

      const botMessage = data.choices[0].message.content || 'No response content';

      // Convert to the same format as Gemini for consistency
      return {
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
      };
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } else {
    // PRODUCTION: Use appropriate Netlify function based on provider
    console.log(`🌐 Running in production mode - using ${provider} Netlify function`);

    let functionName = 'gemini';
    if (provider === 'openrouter') {
      functionName = 'openrouter';
    }

    const response = await fetch(`/.netlify/functions/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        systemPrompt,
        temperature,
        useTools: provider === 'google' ? useTools : false // Only Google supports function calling
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}

// LLM Model configurations (simplified for secure approach)
const LLM_MODELS: Record<string, {model: string, name: string, provider: string}> = {
    'gemini-default': {
        model: 'models/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google'
    },
    'gemini-flash-lite': {
        model: 'models/gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        provider: 'google'
    },
    'openrouter': {
        model: 'openrouter/sonoma-sky-alpha',
        name: 'Sonoma Sky Alpha',
        provider: 'openrouter'
    }
};

let currentModelConfig = LLM_MODELS['gemini-default'];
let openRouterHistory: Array<{role: string, content: string}> = [];

const chatDiv = document.getElementById('chat') as HTMLDivElement;
const input = document.getElementById('input') as HTMLInputElement;
const sendBtn = document.getElementById('send') as HTMLButtonElement;
const llmSelect = document.getElementById('llm-model') as HTMLSelectElement;
const ttsSelect = document.getElementById('tts-service') as HTMLSelectElement;
const progressContainer = document.getElementById('progress-container') as HTMLDivElement;
const progressBar = document.getElementById('download-progress') as HTMLProgressElement;
const progressText = document.getElementById('progress-text') as HTMLDivElement;

let piperLoaded = false;
let piperModel: ArrayBuffer | null = null;
let piperConfig: any = null;

sendBtn.addEventListener('click', async () => {
    const userMessage = input.value.trim();
    if (!userMessage) return;

    // Stop any currently playing TTS and clear queue
    stopCurrentTTS();

    addMessage('user', userMessage);
    input.value = '';

    // Function to send message with retry logic using secure Netlify function
    const sendMessageWithRetry = async (message: string, retryCount = 0): Promise<void> => {
        const maxRetries = 3;

        try {
            // Use secure Netlify function instead of direct API call
            const data = await callGeminiAPI(message, {
                model: currentModelConfig.model,
                systemPrompt: LLM_CONFIG.systemPrompt,
                temperature: LLM_CONFIG.temperature,
                useTools: currentModelConfig.provider === 'google' // Only enable tools for Google models
            });

            // Extract the response text from the Netlify function response
            let botMessage = '';

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const content = data.candidates[0].content;
                if (content.parts && content.parts[0] && content.parts[0].text) {
                    botMessage = content.parts[0].text;
                }
            }

            // Check if the model wants to use a tool (function calling)
            if (data.candidates && data.candidates[0] && data.candidates[0].content &&
                data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
                data.candidates[0].content.parts[0].functionCall) {

                console.log("Model wants to use search!");
                const functionCall = data.candidates[0].content.parts[0].functionCall;

                if (functionCall.name === 'googleSearch' && functionCall.args && functionCall.args.query) {
                    // Perform the search using our secure function
                    const searchResults = await performGoogleSearch(functionCall.args.query);

                    // Send the search results back to the model for a final response
                    const followUpData = await callGeminiAPI(
                        `Based on this search result, please answer the user's question: "${message}"\n\nSearch Results:\n${searchResults}`,
                        {
                            model: currentModelConfig.model,
                            systemPrompt: LLM_CONFIG.systemPrompt,
                            temperature: LLM_CONFIG.temperature,
                            useTools: false // Don't use tools in follow-up
                        }
                    );

                    // Extract the final response
                    if (followUpData.candidates && followUpData.candidates[0] && followUpData.candidates[0].content &&
                        followUpData.candidates[0].content.parts && followUpData.candidates[0].content.parts[0]) {
                        botMessage = followUpData.candidates[0].content.parts[0].text || '';
                    }
                }
            }

            // Only add message if it's not empty and not an error
            if (botMessage && botMessage.trim() && !isModelError(botMessage)) {
                addMessage('bot', botMessage);
            } else if (botMessage && botMessage.trim()) {
                console.warn('Model returned error message, retrying:', botMessage);
                if (retryCount < maxRetries) {
                    console.log(`Retrying message (attempt ${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    return sendMessageWithRetry(message, retryCount + 1);
                }
            } else if (!botMessage || !botMessage.trim()) {
                console.warn('Model returned empty message, retrying');
                if (retryCount < maxRetries) {
                    console.log(`Retrying message (attempt ${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    return sendMessageWithRetry(message, retryCount + 1);
                }
            }

        } catch (error) {
            const errorMessage = (error as Error).message;

            // Check if this is a retryable error
            if (isRetryableError(errorMessage) && retryCount < maxRetries) {
                console.warn(`Network/model error, retrying: ${errorMessage}`);
                console.log(`Retrying message (attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry for network errors
                return sendMessageWithRetry(message, retryCount + 1);
            } else {
                // Non-retryable error or max retries reached
                console.error('Final error after retries:', errorMessage);
                addMessage('bot', 'Извините, произошла ошибка при обработке сообщения. Попробуйте еще раз.');
            }
        }
    };

    // Start the message sending process
    await sendMessageWithRetry(userMessage);
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// LLM Model selector event listener
llmSelect.addEventListener('change', async () => {
    const selectedModel = llmSelect.value;
    if (selectedModel in LLM_MODELS) {
        await switchToModel(selectedModel);
    }
});

// Function to switch to a different LLM model
async function switchToModel(modelKey: string) {
    try {
        const modelConfig = LLM_MODELS[modelKey];
        if (!modelConfig) {
            throw new Error(`Model configuration not found for: ${modelKey}`);
        }
        currentModelConfig = modelConfig;

        // Clear OpenRouter history when switching away from it
        if (currentModelConfig.provider !== 'openrouter') {
            openRouterHistory = [];
        }

        console.log(`Switched to model: ${modelConfig.name}`);
        addMessage('bot', `Переключено на модель: ${modelConfig.name}`, true); // Skip TTS for system messages
    } catch (error) {
        console.error('Error switching model:', error);
        addMessage('bot', 'Ошибка при переключении модели: ' + (error as Error).message);
    }
}

// Function to create OpenRouter chat instance
async function createOpenRouterChat(modelConfig: any) {
    // For OpenRouter, we'll create a simple chat handler
    const openRouterChat = {
        async sendMessage(message: string) {
            try {
                // Add user message to history
                openRouterHistory.push({ role: 'user', content: message });

                // Build messages array with system prompt + last 10 messages from history
                const messages = [
                    {
                        role: 'system',
                        content: LLM_CONFIG.systemPrompt
                    },
                    ...openRouterHistory.slice(-10) // Keep only last 10 messages for context
                ];

                const requestBody = {
                    model: modelConfig.model,
                    messages: messages,
                    temperature: LLM_CONFIG.temperature
                };

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${modelConfig.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();

                // Check if the response has the expected structure
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('Unexpected response format from OpenRouter');
                }

                const botMessage = data.choices[0].message.content || 'No response content';

                // Add bot response to history
                openRouterHistory.push({ role: 'assistant', content: botMessage });

                return {
                    response: {
                        text: () => botMessage,
                        functionCalls: () => null // OpenRouter doesn't support function calls in the same way
                    }
                };
            } catch (error) {
                console.error('OpenRouter request failed:', error);
                throw error;
            }
        }
    };

    return openRouterChat;
}

// Global audio state management
let currentAudio: HTMLAudioElement | null = null;
let isTTSCancelled = false;

function stopCurrentTTS() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    isTTSCancelled = true;
}

function addMessage(type: string, text: string, skipTTS: boolean = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `<span>${text}</span>`;
    if (type === 'bot' && !skipTTS) {
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Replay';
        playBtn.addEventListener('click', () => {
            speak(text);
        });
        msgDiv.appendChild(playBtn);
        // Instant TTS
        speak(text);
    }
    chatDiv.appendChild(msgDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

async function speak(text: string) {
    const service = ttsSelect.value;

    // Reset cancellation flag when starting new TTS
    isTTSCancelled = false;

    try {
        if (service === 'gemini') {
            await speakWithGemini(text);
        } else if (service === 'google-cloud') {
            try {
                await speakWithGoogleCloud(text);
            } catch (error) {
                console.warn('Google Cloud TTS failed, falling back to Gemini TTS:', error);
                await speakWithGemini(text);
            }
        } else if (service === 'piper') {
            await speakWithPiper(text);
        } else if (service === 'silero') {
            await speakWithSilero(text);
        } else if (service === 'vosk') {
            await speakWithVosk(text);
        }
    } catch (error) {
        console.error('Speech synthesis error:', error);
        // Attempt to use browser's built-in TTS as fallback
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

async function speakWithGemini(text: string) {
    try {
        // Use the secure Netlify function for TTS as well
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Convert this text to speech: ${text}`,
                model: TTS_CONFIG.model,
                temperature: TTS_CONFIG.temperature,
                useTools: false
            })
        });

        if (!response.ok) {
            throw new Error(`TTS API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // For now, we'll skip the audio processing since the Netlify function doesn't handle TTS
        // This is a placeholder - you might want to implement TTS differently
        console.log('TTS response:', data);

        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('Gemini TTS error:', error);
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

async function speakWithGoogleCloud(text: string) {
    try {
        // For now, we'll use browser TTS as the Google Cloud TTS requires a separate API key
        // You can implement this later with a separate Netlify function for TTS
        console.log('Google Cloud TTS not implemented yet, using browser TTS');
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('Google Cloud TTS error:', error);
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

async function downloadWithProgress(url: string, onProgress: (loaded: number, total: number) => void): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
    try {
        const response = await fetch(url, { signal: controller.signal });
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength) : 0;
        const reader = response.body!.getReader();
        const chunks = [];
        let loaded = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            onProgress(loaded, total);
        }
        const blob = new Blob(chunks);
        return blob.arrayBuffer();
    } finally {
        clearTimeout(timeoutId);
    }
}

async function waitForPhonemizer(): Promise<any> {
    return new Promise((resolve, reject) => {
        let tries = 0;
        function check() {
            const piper = (window as any).createPiperPhonemize;
            if (piper && typeof piper === 'function') {
                resolve(piper);
            } else if (++tries > 50) {
                reject(new Error('Piper phonemization module not loaded correctly'));
            } else {
                setTimeout(check, 100);
            }
        }
        check();
    });
}

async function phonemeIds(text: string): Promise<number[]> {
    const createPhonemizer = await waitForPhonemizer();
    
    return new Promise((resolve, reject) => {
        const phonemizer = createPhonemizer({
            print: (data: string) => {
                try {
                    resolve(JSON.parse(data).phoneme_ids);
                } catch (e) {
                    reject(new Error('Failed to parse phonemizer output'));
                }
            },
            printErr: (message: string) => {
                console.error('Phonemizer error:', message);
                reject(new Error(message));
            },
            locateFile: (url: string) => {
                if (url.endsWith('.wasm')) return 'https://huggingface.co/rhasspy/piper-voices/raw/main/piper_phonemize.wasm';
                if (url.endsWith('.data')) return 'https://huggingface.co/rhasspy/piper-voices/raw/main/piper_phonemize.data';
                return url;
            }
        });
        
        phonemizer.callMain([
            '-l', 'ru_RU',
            '--input', JSON.stringify([{text}]),
            '--espeak_data', '/espeak-ng-data'
        ]);
    });
}

async function loadPiper() {
    if (piperLoaded) return;
    
    console.log('Starting Piper model loading...');
    progressContainer.style.display = 'block';
    progressText.textContent = 'Downloading model...';
    console.log('Downloading Piper model...');
    const modelUrl = 'https://huggingface.co/wide-video/piper-voices-v1.0.1/resolve/main/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx';
    const configUrl = 'https://huggingface.co/wide-video/piper-voices-v1.0.1/resolve/main/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx.json';

    piperModel = await downloadWithProgress(modelUrl, (loaded, total) => {
        const percent = total ? (loaded / total) * 50 : 0;
        progressBar.value = percent;
    });
    console.log('Piper model downloaded successfully.');

    progressText.textContent = 'Downloading config...';
    console.log('Downloading Piper config...');
    const configResponse = await fetch(configUrl);
    piperConfig = await configResponse.json();
    progressBar.value = 60;
    console.log('Piper config downloaded successfully.');

    progressText.textContent = 'Loading...';
    console.log('Waiting for dependencies to load...');

    // Log initial dependency states
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting dependency check...`);
    console.log(`[${new Date().toISOString()}] Initial piper availability:`, typeof (window as any).piper);
    console.log(`[${new Date().toISOString()}] Initial ort availability:`, typeof (window as any).ort);

    // Wait for dependencies with timeout
    let waitCount = 0;
    let piperReady = false;
    let ortReady = false;

    while ((!(window as any).piper || !(window as any).ort) && waitCount < 300) { // 30 seconds timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;

        // Check individual dependencies and log changes
        const currentPiper = !!(window as any).piper;
        const currentOrt = !!(window as any).ort;

        if (currentPiper && !piperReady) {
            piperReady = true;
            console.log(`[${new Date().toISOString()}] Piper dependency loaded after ${waitCount * 100}ms`);
        }

        if (currentOrt && !ortReady) {
            ortReady = true;
            console.log(`[${new Date().toISOString()}] ONNX Runtime (ort) dependency loaded after ${waitCount * 100}ms`);
        }

        // Log progress every 5 seconds (50 iterations)
        if (waitCount % 50 === 0) {
            const elapsed = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] Still waiting... (${elapsed}ms elapsed, ${waitCount}/300 attempts)`);
            console.log(`[${new Date().toISOString()}] Current piper status:`, currentPiper ? 'READY' : 'NOT READY');
            console.log(`[${new Date().toISOString()}] Current ort status:`, currentOrt ? 'READY' : 'NOT READY');
        }
    }

    const totalElapsed = Date.now() - startTime;
    if (waitCount >= 300) {
        console.error(`[${new Date().toISOString()}] DEPENDENCY LOAD FAILURE - Timeout after ${totalElapsed}ms`);
        console.error(`[${new Date().toISOString()}] Final piper status:`, piperReady ? 'LOADED' : 'FAILED TO LOAD');
        console.error(`[${new Date().toISOString()}] Final ort status:`, ortReady ? 'LOADED' : 'FAILED TO LOAD');
        console.error(`[${new Date().toISOString()}] Network status:`, navigator.onLine ? 'ONLINE' : 'OFFLINE');

        // Try to detect script loading errors
        const scripts = document.querySelectorAll('script');
        console.log(`[${new Date().toISOString()}] Checking script loading status...`);
        scripts.forEach((script, index) => {
            if (script.src.includes('piper') || script.src.includes('ort')) {
                const readyState = (script as any).readyState || 'unknown';
                console.log(`[${new Date().toISOString()}] Script ${index}: ${script.src} - readyState: ${readyState}`);
            }
        });

        throw new Error(`Dependencies failed to load within timeout (${totalElapsed}ms). Piper: ${piperReady ? 'OK' : 'FAILED'}, ONNX: ${ortReady ? 'OK' : 'FAILED'}`);
    }

    console.log(`[${new Date().toISOString()}] SUCCESS - All dependencies loaded in ${totalElapsed}ms`);
    console.log(`[${new Date().toISOString()}] Piper ready: ${piperReady}, ONNX Runtime ready: ${ortReady}`);
    console.log('Dependencies loaded.');
    // Set ONNX environment
    if (typeof (window as any).ort !== 'undefined') {
        (window as any).ort.env.wasm.numThreads = navigator.hardwareConcurrency;
        (window as any).ort.env.wasm.wasmPaths = 'https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.17.1/';
    }
    progressBar.value = 100;
    progressText.textContent = 'Ready';
    setTimeout(() => progressContainer.style.display = 'none', 1000);
    piperLoaded = true;
    console.log('Piper loading complete.');
}

async function speakWithPiper(text: string) {
    if (!piperLoaded) {
        await loadPiper();
    }
    console.log('Generating phonemes...');
    const ids = await phonemeIds(text);
    console.log('Phonemes generated.');

    const sampleRate = piperConfig.audio.sample_rate;
    const numChannels = 1;
    const noiseScale = piperConfig.inference.noise_scale;
    const lengthScale = piperConfig.inference.length_scale;
    const noiseW = piperConfig.inference.noise_w;

    console.log('Creating ONNX session...');
    const session = await (window as any).ort.InferenceSession.create(URL.createObjectURL(new Blob([piperModel!])));
    const feeds: any = {
        input: new (window as any).ort.Tensor('int64', ids, [1, ids.length]),
        input_lengths: new (window as any).ort.Tensor('int64', [ids.length]),
        scales: new (window as any).ort.Tensor('float32', [noiseScale, lengthScale, noiseW])
    };
    if (Object.keys(piperConfig.speaker_id_map).length) {
        feeds.sid = new (window as any).ort.Tensor('int64', [0]);
    }
    console.log('Running inference...');
    const {output: {data: pcm}} = await session.run(feeds);
    console.log('Inference complete.');

    const wavBuffer = PCM2WAV(pcm, sampleRate, numChannels);
    const file = new Blob([wavBuffer], {type: 'audio/x-wav'});
    const audio = new Audio(URL.createObjectURL(file));
    audio.play();
}

async function performGoogleSearch(query: string): Promise<string> {
    // Check if we're running locally (development mode)
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalDev) {
        // LOCAL DEVELOPMENT: Use direct Google Custom Search API
        console.log('🔧 Running Google Search in local development mode');

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const cx = import.meta.env.VITE_GOOGLE_SEARCH_CX;

        if (!apiKey || !cx) {
            console.warn('Google Search API keys not configured for local development');
            return `Search functionality requires API configuration. Query: "${query}"`;
        }

        try {
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=3`;
            const response = await fetch(searchUrl);

            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    const results = data.items.slice(0, 3).map((item: any) =>
                        `${item.title}\n${item.snippet}`
                    ).join('\n\n');
                    return results;
                } else {
                    return 'No results found.';
                }
            } else {
                console.error('Google Search API error:', response.status);
                return `Search failed with status ${response.status}. Query: "${query}"`;
            }
        } catch (error) {
            console.error('Google Search error:', error);
            return `Search error: ${(error as Error).message}. Query: "${query}"`;
        }
    } else {
        // PRODUCTION: Use Netlify function
        console.log('🌐 Running Google Search via Netlify function');

        try {
            const response = await fetch('/.netlify/functions/performgooglesearch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Search API Error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            return data.results || 'No search results available.';
        } catch (error) {
            console.error('Netlify Google Search function error:', error);
            return `Search failed: ${(error as Error).message}. Query: "${query}"`;
        }
    }
}

function splitIntoSentences(text: string): string[] {
    // Split on period, question mark, or exclamation mark followed by space or end
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    return sentences;
}

async function speakWithSilero(text: string) {
    try {
        console.log("Processing text with Silero:", text);

        // Check if TTS was cancelled before starting
        if (isTTSCancelled) {
            console.log("TTS was cancelled, skipping Silero processing");
            return;
        }

        // Split text into sentences
        const sentences = splitIntoSentences(text);

        if (sentences.length === 0) {
            console.warn("No valid sentences found in text");
            return;
        }

        console.log(`Processing ${sentences.length} sentence(s)...`);

        // Queue to hold audio blobs as they become ready
        const audioQueue: Blob[] = [];
        let isPlaying = false;
        let currentIndex = 0;
        let nextRequestIndex = 0;
        let allRequestsSent = false;

        // Function to play next audio in queue
        const playNextAudio = async () => {
            // Check if cancelled before playing
            if (isTTSCancelled) {
                console.log("TTS cancelled, stopping playback");
                return;
            }

            if (isPlaying || currentIndex >= audioQueue.length) {
                return;
            }

            isPlaying = true;
            const audioBlob = audioQueue[currentIndex];
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudio = audio; // Set global audio reference

            console.log(`Playing audio segment ${currentIndex + 1}/${sentences.length}`);

            // Play current segment
            audio.onended = () => {
                console.log(`Finished playing audio segment ${currentIndex + 1}`);
                URL.revokeObjectURL(audioUrl);
                currentAudio = null; // Clear global reference
                currentIndex++;
                isPlaying = false;
                // Immediately try to play the next available segment
                playNextAudio();
            };
            audio.onerror = (e) => {
                console.error(`Error playing audio segment ${currentIndex + 1}`, e);
                URL.revokeObjectURL(audioUrl);
                currentAudio = null; // Clear global reference
                currentIndex++;
                isPlaying = false;
                playNextAudio(); // Try next one even if this fails
            };
            try {
                await audio.play();
            } catch (e) {
                console.error(`audio.play() failed for segment ${currentIndex + 1}`, e);
                currentAudio = null; // Clear global reference
                isPlaying = false;
                currentIndex++;
                playNextAudio();
            }
        };

        // Function to send next synthesis request
        const sendNextRequest = async () => {
            // Check if cancelled before sending request
            if (isTTSCancelled) {
                console.log("TTS cancelled, stopping request processing");
                return;
            }

            if (nextRequestIndex >= sentences.length) {
                allRequestsSent = true;
                return; // All requests sent
            }

            const sentenceIndex = nextRequestIndex;
            nextRequestIndex++;

            try {
                console.log(`Starting synthesis for sentence ${sentenceIndex + 1}: "${sentences[sentenceIndex].trim()}"`);

                const response = await makeTTSRequest('silero', sentences[sentenceIndex].trim());

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Failed to synthesize sentence ${sentenceIndex + 1}:`, errorData.detail);
                } else {
                    const audioBlob = await response.blob();
                    console.log(`Synthesis completed for sentence ${sentenceIndex + 1}, adding to queue`);
                    audioQueue.push(audioBlob);

                    if (!isPlaying && !isTTSCancelled) {
                        playNextAudio();
                    }
                }
            } catch (error) {
                console.error(`Error synthesizing sentence ${sentenceIndex + 1}:`, error);
            } finally {
                // Immediately send the next request if not cancelled
                if (!isTTSCancelled) {
                    sendNextRequest();
                }
            }
        };

        // Start the process
        sendNextRequest();

        // Wait for all audio to be played
        await new Promise<void>(resolve => {
            const checkCompletion = () => {
                if (isTTSCancelled) {
                    console.log("TTS cancelled, resolving early");
                    resolve();
                    return;
                }

                if (allRequestsSent && currentIndex >= sentences.length && !isPlaying) {
                    console.log("All audio segments processed and played successfully");
                    resolve();
                } else {
                    setTimeout(checkCompletion, 100);
                }
            };
            checkCompletion();
        });

    } catch (error) {
        console.error('Error in Silero TTS processing:', error);
        throw error;
    }
}

async function speakWithVosk(text: string) {
    try {
        console.log("Processing text with Vosk:", text);

        // Check if TTS was cancelled before starting
        if (isTTSCancelled) {
            console.log("TTS was cancelled, skipping Vosk processing");
            return;
        }

        // Split text into sentences
        const sentences = splitIntoSentences(text);

        if (sentences.length === 0) {
            console.warn("No valid sentences found in text");
            return;
        }

        console.log(`Processing ${sentences.length} sentence(s)...`);

        // Queue to hold audio blobs as they become ready
        const audioQueue: Blob[] = [];
        let isPlaying = false;
        let currentIndex = 0;
        let nextRequestIndex = 0;
        let allRequestsSent = false;

        // Function to play next audio in queue
        const playNextAudio = async () => {
            // Check if cancelled before playing
            if (isTTSCancelled) {
                console.log("TTS cancelled, stopping playback");
                return;
            }

            if (isPlaying || currentIndex >= audioQueue.length) {
                return;
            }

            isPlaying = true;
            const audioBlob = audioQueue[currentIndex];
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudio = audio; // Set global audio reference

            console.log(`Playing audio segment ${currentIndex + 1}/${sentences.length}`);

            // Play current segment
            audio.onended = () => {
                console.log(`Finished playing audio segment ${currentIndex + 1}`);
                URL.revokeObjectURL(audioUrl);
                currentAudio = null; // Clear global reference
                currentIndex++;
                isPlaying = false;
                // Immediately try to play the next available segment
                playNextAudio();
            };
            audio.onerror = (e) => {
                console.error(`Error playing audio segment ${currentIndex + 1}`, e);
                URL.revokeObjectURL(audioUrl);
                currentAudio = null; // Clear global reference
                currentIndex++;
                isPlaying = false;
                playNextAudio(); // Try next one even if this fails
            };
            try {
                await audio.play();
            } catch (e) {
                console.error(`audio.play() failed for segment ${currentIndex + 1}`, e);
                currentAudio = null; // Clear global reference
                isPlaying = false;
                currentIndex++;
                playNextAudio();
            }
        };

        // Function to send next synthesis request
        const sendNextRequest = async () => {
            // Check if cancelled before sending request
            if (isTTSCancelled) {
                console.log("TTS cancelled, stopping request processing");
                return;
            }

            if (nextRequestIndex >= sentences.length) {
                allRequestsSent = true;
                return; // All requests sent
            }

            const sentenceIndex = nextRequestIndex;
            nextRequestIndex++;

            try {
                console.log(`Starting synthesis for sentence ${sentenceIndex + 1}: "${sentences[sentenceIndex].trim()}"`);

                const response = await makeTTSRequest('vosk', sentences[sentenceIndex].trim());

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Failed to synthesize sentence ${sentenceIndex + 1}:`, errorData.detail);
                } else {
                    const audioBlob = await response.blob();
                    console.log(`Synthesis completed for sentence ${sentenceIndex + 1}, adding to queue`);
                    audioQueue.push(audioBlob);

                    if (!isPlaying && !isTTSCancelled) {
                        playNextAudio();
                    }
                }
            } catch (error) {
                console.error(`Error synthesizing sentence ${sentenceIndex + 1}:`, error);
            } finally {
                // Immediately send the next request if not cancelled
                if (!isTTSCancelled) {
                    sendNextRequest();
                }
            }
        };

        // Start the process
        sendNextRequest();

        // Wait for all audio to be played
        await new Promise<void>(resolve => {
            const checkCompletion = () => {
                if (isTTSCancelled) {
                    console.log("TTS cancelled, resolving early");
                    resolve();
                    return;
                }

                // We check against sentences.length because some requests might fail, but we still need to know when we're done.
                if (allRequestsSent && currentIndex >= sentences.length && !isPlaying) {
                    console.log("All audio segments processed and played successfully");
                    resolve();
                } else {
                    setTimeout(checkCompletion, 100);
                }
            };
            checkCompletion();
        });

    } catch (error) {
        console.error('Error in Vosk TTS processing:', error);
        throw error;
    }
}

function convertToWav(rawData: string, mimeType: string): Uint8Array {
    const options = parseMimeType(mimeType);
    const dataLength = atob(rawData).length;
    const wavHeader = createWavHeader(dataLength, options);
    const dataBuffer = new Uint8Array(atob(rawData).split('').map(c => c.charCodeAt(0)));
    const combined = new Uint8Array(wavHeader.length + dataBuffer.length);
    combined.set(wavHeader, 0);
    combined.set(dataBuffer, wavHeader.length);
    return combined;
}

function parseMimeType(mimeType: string): any {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');
    const options: any = {
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
    return options;
}

function createWavHeader(dataLength: number, options: any): Uint8Array {
    const {
        numChannels = 1,
        sampleRate = 44100,
        bitsPerSample = 16,
    } = options;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    view.setUint32(0, 0x52494646, false); // RIFF
    view.setUint32(4, 36 + dataLength, true); // ChunkSize
    view.setUint32(8, 0x57415645, false); // WAVE
    view.setUint32(12, 0x666d7420, false); // fmt
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample
    view.setUint32(36, 0x64617461, false); // data
    view.setUint32(40, dataLength, true); // Subchunk2Size
    return new Uint8Array(buffer);
}

function PCM2WAV(buffer: Float32Array, sampleRate: number, numChannels: number): ArrayBuffer {
    const bufferLength = buffer.length;
    const headerLength = 44;
    const view = new DataView(new ArrayBuffer(bufferLength * numChannels * 2 + headerLength));

    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, view.buffer.byteLength - 8, true); // RIFF size
    view.setUint32(8, 0x45564157, true); // "WAVE"

    view.setUint32(12, 0x20746d66, true); // Subchunk1ID ("fmt ")
    view.setUint32(16, 0x10, true); // Subchunk1Size
    view.setUint16(20, 0x0001, true); // AudioFormat
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, numChannels * 2 * sampleRate, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    view.setUint32(36, 0x61746164, true); // Subchunk2ID ("data")
    view.setUint32(40, 2 * bufferLength, true); // Subchunk2Size

    let p = headerLength;
    for (let i = 0; i < bufferLength; i++) {
        const v = buffer[i];
        if (v >= 1)
            view.setInt16(p, 0x7fff, true);
        else if (v <= -1)
            view.setInt16(p, -0x8000, true);
        else
            view.setInt16(p, (v * 0x8000) | 0, true);
        p += 2;
    }
    return view.buffer;
}

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
Ты — «ВИКИ», мудрая и дружелюбная ИИ-помощница и наставница. Отвечаешь с персоналией молодой женщины. Твой собеседник — третьеклассник Андрей.
2. Ключевая цель:
Твоя главная задача — развивать любознательность Андрея и учить его мыслить самостоятельно. Ты помогаешь ему как в учебе, так и в познании мира вокруг.
3. Протокол общения (Три режима ответа):
Твой ответ должен соответствовать одному из четырех режимов в зависимости от вопроса Андрея.
Режим 1: Безопасность (Неподобающий контент)
Если вопрос касается тем 18+, насилия, или чего-то небезопасного и неподобающего для ребенка:
Мягко и вежливо откажись обсуждать тему. Не читай лекций. Просто скажи, что вы не можете это обсудить.
Пример: «Андрей, эта тема для взрослых, давай поговорим о чем-нибудь другом» или «Я не могу ответить на этот вопрос. Может, хочешь узнать что-то еще?».
Режим 2: Репетитор (Вопросы по математике для начальной школы)
Если вопрос похож на задание для 3 класса (например, посчитай 8*9, найди площадь прямоугольника, подбери проверочное слово):
Твоя цель — помочь ему найти ответ самому. ЗАПРЕТ НА ПРЯМЫЕ ОТВЕТЫ.
Объясняй по шагам: Разбивай сложную задачу на простые этапы.
Задавай наводящие вопросы: Вместо ответа, задай вопрос, который подтолкнет его к правильной мысли. (Например: «Как можно представить делимое чтобы посчитать по частям?», «Какое действие нужно сделать первым?»).
Хвали и поддерживай: Кратко хвали за правильные шаги. Если он ошибается, не ругай, а помоги найти ошибку. (Например: «Отличная мысль! А давай проверим вот этот шаг еще раз»).
При настойчивости: Если Андрей просит прямой ответ, мягко объясни: «Андрей, моя задача — научить тебя находить ответы самому. Готовый ответ в этом не поможет. Давай попробуем еще раз вместе!».
Режим 3: Вопросы по другим школьным предметам (например, русский язык, окружающий мир, английский язык)
Ты отвечаешь на вопросы по другим школьным предметам, помогая Андрею учиться и развиваться. Ты стараешься объяснять темы просто и понятно, используя примеры и аналогии, чтобы Андрей мог легко усвоить материал. 
Если он просит выполнить задание (вставить пропуск, подобрать слово, перевести что-то и пр.) ты не просто даешь правильный ответ, но и объясняешь как и почему это так. 
Если вопрос требует поиска информации, ты используешь инструмент googlesearch для получения актуальных данных.
Режим 4: Энциклопедия (Вопросы про правила, факты и общие темы)
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
6. Дата сегодня: ${formattedDate}.
7. Формат ответа — ВСЕГДА строго JSON, без markdown-обёртки и без текста вне JSON:
{"speak": "...", "show": "..."}
Поле "speak" — только то, что произносится вслух: все числа, формулы и обозначения словами («пять умножить на три», «икс равно пять»), без markdown, LaTeX, эмодзи и записей вида 2(x+3). Тёплым, живым, поддерживающим тоном.
Поле "speak" повторяет "show" дословно и отличается ТОЛЬКО записью чисел и формул словами — не пересказывай, не сокращай и не добавляй ничего нового.
Поле "show" — текст для чтения с экрана: может содержать формулы (2(x + 3) + 4x), записи вида x = 5 и markdown.
Оба поля обязательны и не должны быть пустыми.`,
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
        //'429',
        //'500',
        //'502',
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
  useHistory?: boolean;
  onDelta?: (fullText: string) => void; // стриминг: полный накопленный текст на каждый чанк
  imageBase64?: string; // data:image/...;base64,... — GLM понимает картинки
} = {}) {
  const {
    model = 'models/gemini-2.5-flash',
    systemPrompt,
    temperature = 0.7,
    useTools = false,
    provider = 'google',
    useHistory = true,
    onDelta,
    imageBase64
  } = options;

  // Spark gateway (DGX): OpenAI-совместимый /v1/chat/completions напрямую из браузера
  if (provider === 'spark') {
    const messages: Array<{role: string, content: string}> = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    if (useHistory) {
      for (const m of chatHistory.slice(-10)) {
        if (m.role === 'user' || m.role === 'assistant') {
          messages.push({ role: m.role, content: m.content });
        }
      }
    }
    messages.push({ role: 'user', content: prompt });
    // GLM vision: последнему сообщению прикладываем картинку (OpenAI-стиль)
    type SparkContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    const sparkMessages: Array<{ role: string; content: SparkContent }> =
        messages.map(m => ({ role: m.role, content: m.content }));
    if (imageBase64) {
        const last = sparkMessages[sparkMessages.length - 1];
        last.content = [{
            type: 'text',
            text: typeof last.content === 'string' ? last.content : ''
        }, {
            type: 'image_url',
            image_url: { url: imageBase64 }
        }];
    }
    const response = await fetch(gatewayBase() + '/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, temperature, messages: sparkMessages, stream: true, reasoning_effort: 'low' })
    });
    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Spark gateway error: ${response.status} ${errText.slice(0, 200)}`);
    }
    // SSE-стрим: data: {"choices":[{"delta":{"content":"..."}}]}
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const chunk = JSON.parse(payload);
          const delta = chunk?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) {
            text += delta;
            onDelta?.(text);
          }
        } catch (_) { /* неполный/битый чанк — пропускаем */ }
      }
    }
    // Оборачиваем в Gemini-подобную форму — остальной код не меняется
    return { candidates: [{ content: { parts: [{ text }] } }] };
  }

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

      // Use chat session for conversation history if enabled
      if (useHistory && !geminiChatSession) {
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
        const historyForSession = chatHistory.slice(0, -1);
        geminiChatSession = modelInstance.startChat({
          history: historyForSession.slice(-10).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.content }]
          }))
        });
      }

      let result;
      if (useHistory && geminiChatSession) {
        result = await geminiChatSession.sendMessage(prompt);
      } else {
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
        result = await modelInstance.generateContent(prompt);
      }

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

      // Build messages array with conversation history
      const messages = [];

      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      // Add conversation history if enabled
      if (useHistory) {
        // Add recent messages from history (excluding system messages)
        const recentMessages = chatHistory.slice(-10).filter(msg => msg.role !== 'system');
        messages.push(...recentMessages);
      }

      // The chatHistory already contains the current user message, so we don't need to add it again.

      console.log('OpenRouter messages:', messages);

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
        const errorMessage = errorData.error?.message || JSON.stringify(errorData.error);
        throw new Error(`OpenRouter API Error: ${errorMessage}`);
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
        useTools: provider === 'google' ? useTools : false, // Only Google supports function calling
        useHistory,
        chatHistory: useHistory ? chatHistory.slice(-10) : []
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
    'gemini-lite': {
        model: 'models/gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        provider: 'google'
    },
    'gemini-pro': {
        model: 'models/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google'
    },
    'GPT-OSS': {
        model: 'openai/gpt-oss-20b:free',
        name: 'GPT-OSS',
        provider: 'openrouter'
    },
    'Longcat': {
        model: 'meituan/longcat-flash-chat:free',
        name: 'LongCat',
        provider: 'openrouter'
    },
    'spark-glm': {
        model: 'glm',
        name: 'GLM 5.3 Flash (Spark)',
        provider: 'spark'
    }
};

let currentModelConfig = LLM_MODELS['spark-glm'];

// Unified chat history for all providers
let chatHistory: Array<{role: string, content: string}> = [];
let geminiChatSession: any = null; // For Gemini's native chat session

const chatDiv = document.getElementById('chat') as HTMLDivElement;
const input = document.getElementById('input') as HTMLInputElement;
const sendBtn = document.getElementById('send') as HTMLButtonElement;
const photoBtn = document.getElementById('photo') as HTMLButtonElement;
const eqEl = document.getElementById('eq') as HTMLDivElement;
const photoInput = document.getElementById('photo-input') as HTMLInputElement;
const cameraBtn = document.getElementById('camera') as HTMLButtonElement;
const cameraInput = document.getElementById('camera-input') as HTMLInputElement;
const llmSelect = document.getElementById('llm-model') as HTMLSelectElement;
const ttsSelect = document.getElementById('tts-service') as HTMLSelectElement;
const progressContainer = document.getElementById('progress-container') as HTMLDivElement;
const progressBar = document.getElementById('download-progress') as HTMLProgressElement;
const progressText = document.getElementById('progress-text') as HTMLDivElement;

let piperLoaded = false;
let piperModel: ArrayBuffer | null = null;
let piperConfig: any = null;

// --- Push-to-talk: пустой ввод → круглая кнопка-микрофон: держи — запись,
// отпусти — отправка, свайп влево — отмена. Поле ввода на время записи
// превращается в живой эквалайзер. Транскрибация через Groq Whisper (ключ
// живёт на гейтвее, в бандле его нет). С текстом кнопка — самолётик. ---
const ICON_MIC = '<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';
const ICON_SEND = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isRecording = false;
let discardFlag = false;      // свайп-отмена: запись выбрасывается
let recStartX = 0;
let cancelPending = false;
let pressSeq = 0;             // токен нажатия: устаревшие getUserMedia выбрасываются
const pressInfo = new Map<number, { released: boolean; cancelled: boolean; startTs: number }>();
let eqRaf = 0;
let audioCtx: AudioContext | null = null;

function pickRecorderMime(): string | undefined {
    for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
    }
    return undefined;
}

function updateSendBtn(): void {
    if (isRecording) return; // во время записи кнопкой управляют pointer-события
    sendBtn.classList.remove('recording', 'cancel');
    sendBtn.innerHTML = input.value.trim() ? ICON_SEND : ICON_MIC;
}

// --- живой эквалайзер вместо поля ввода ---
function startEqualizer(stream: MediaStream): void {
    input.style.display = 'none';
    eqEl.style.display = 'flex';
    if (!eqEl.childElementCount) {
        for (let i = 0; i < 28; i++) eqEl.appendChild(document.createElement('i'));
    }
    try {
        audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        audioCtx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const bars = Array.from(eqEl.children) as HTMLElement[];
        const loop = () => {
            analyser.getByteFrequencyData(buf);
            const n = bars.length;
            for (let i = 0; i < n; i++) {
                // лог-раскладка частот: низы шире, как в диктофонах
                const bin = 1 + Math.floor(Math.pow(i / n, 1.6) * (buf.length - 2));
                const v = buf[bin] / 255;
                bars[i].style.height = (4 + v * 34).toFixed(1) + 'px';
            }
            eqRaf = requestAnimationFrame(loop);
        };
        eqRaf = requestAnimationFrame(loop);
    } catch {
        eqEl.classList.add('fake'); // нет анализатора — CSS-пульсация
    }
}

function stopEqualizer(): void {
    if (eqRaf) cancelAnimationFrame(eqRaf);
    eqRaf = 0;
    if (audioCtx) {
        try { void audioCtx.close(); } catch { /* noop */ }
        audioCtx = null;
    }
    eqEl.style.display = 'none';
    eqEl.classList.remove('cancel', 'fake');
    input.style.display = '';
}

async function startRecording(mySeq: number): Promise<void> {
    // «…» пока поднимается микрофон — на телефоне это может занять пару секунд
    const connectTimer = window.setTimeout(() => {
        const pi = pressInfo.get(mySeq);
        if (pi && !pi.released && !pi.cancelled && !isRecording) sendBtn.innerHTML = '…';
    }, 1000);
    const dead = () => {
        clearTimeout(connectTimer);
        const pi = pressInfo.get(mySeq);
        if (mySeq !== pressSeq) pressInfo.delete(mySeq);
        return pi;
    };
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const pi = dead();
        // нажатие уже закончилось (отпустили / система отменила жест), пока поднимался микрофон
        if (mySeq !== pressSeq || !pi || pi.cancelled) {
            stream.getTracks().forEach(t => t.stop());
            updateSendBtn();
            if (pi?.released && !pi.cancelled && Date.now() - pi.startTs > 500) {
                addMessage('bot', 'Микрофон не успел включиться — зажми кнопку и говори сразу.', true);
            } else if (pi?.cancelled) {
                // чаще всего это запрос доступа к микрофону, который прервал жест
                addMessage('bot', 'Микрофон включён — нажми кнопку ещё раз.', true);
            }
            return;
        }
        clearTimeout(connectTimer);
        const mime = pickRecorderMime();
        mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime })
                             : new MediaRecorder(stream);
        audioChunks = [];
        discardFlag = false;
        cancelPending = false;
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            stopEqualizer();
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
            audioChunks = [];
            mediaRecorder = null;
            isRecording = false;
            cancelPending = false;
            updateSendBtn();
            if (discardFlag) { discardFlag = false; return; } // свайп-отмена
            if (blob.size > 1000) void transcribeAndSend(blob);
            else addMessage('bot', 'Не расслышал — держи кнопку, пока говоришь.', true);
        };
        mediaRecorder.start(250);
        isRecording = true;
        sendBtn.classList.add('recording');
        sendBtn.innerHTML = ICON_MIC;
        startEqualizer(stream);
    } catch (err) {
        dead();
        updateSendBtn();
        console.error('микрофон недоступен', err);
        addMessage('bot', 'Нет доступа к микрофону.', true);
    }
}

function stopRecording(): void {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}

function discardRecording(): void {
    discardFlag = true;
    stopRecording();
}

async function transcribeAndSend(blob: Blob): Promise<void> {
    sendBtn.innerHTML = '…';
    try {
        const resp = await fetch(gatewayBase() + '/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'X-Audio-Type': blob.type || 'audio/webm' },
            body: blob
        });
        if (!resp.ok) throw new Error('transcriptions ' + resp.status);
        const data = await resp.json() as { text?: string };
        const text = (data.text || '').trim();
        if (!text) {
            addMessage('bot', 'Пустая транскрипция — попробуй ещё раз.', true);
            return;
        }
        input.value = text;
        updateSendBtn();
        sendBtn.click(); // обычный путь отправки текста
    } catch (err) {
        console.error('ошибка транскрипции', err);
        addMessage('bot', 'Не удалось расшифровать голос.', true);
    } finally {
        updateSendBtn();
    }
}

sendBtn.addEventListener('pointerdown', (e) => {
    if (input.value.trim()) return; // текстовый режим — обычный клик-отправка
    if (isRecording) return;
    const seq = ++pressSeq;
    pressInfo.set(seq, { released: false, cancelled: false, startTs: Date.now() });
    if (pressInfo.size > 3) {
        const oldest = pressInfo.keys().next().value;
        if (oldest !== undefined && oldest !== seq) pressInfo.delete(oldest);
    }
    cancelPending = false;
    recStartX = e.clientX;
    e.preventDefault();
    try { sendBtn.setPointerCapture(e.pointerId); } catch { /* noop */ }
    void startRecording(seq);
});

sendBtn.addEventListener('pointermove', (e) => {
    if (!isRecording) return;
    const cancelled = e.clientX - recStartX < -60;
    if (cancelled !== cancelPending) {
        cancelPending = cancelled;
        sendBtn.classList.toggle('cancel', cancelled);
        eqEl.classList.toggle('cancel', cancelled);
        sendBtn.innerHTML = cancelled ? '✕' : ICON_MIC;
    }
});

const finishPress = () => {
    if (isRecording) {
        if (cancelPending) discardRecording(); else stopRecording();
    }
};
sendBtn.addEventListener('pointerup', () => {
    if (isRecording) finishPress();
    else {
        const pi = pressInfo.get(pressSeq); // микрофон ещё поднимается
        if (pi) pi.released = true;
    }
});
sendBtn.addEventListener('pointercancel', () => {
    if (isRecording) finishPress();
    else {
        const pi = pressInfo.get(pressSeq); // систему забрал жест — нажатие умерло
        if (pi) pi.cancelled = true;
    }
});
sendBtn.addEventListener('lostpointercapture', () => {
    if (isRecording) return; // pointerup уже отработал
    const pi = pressInfo.get(pressSeq);
    if (pi && !pi.released) pi.cancelled = true; // захват потерян без pointerup
});
sendBtn.addEventListener('contextmenu', (e) => e.preventDefault()); // long-press Android убивал запись
input.addEventListener('input', updateSendBtn);
updateSendBtn();

sendBtn.addEventListener('click', async () => {
    const userMessage = input.value.trim();
    if (!userMessage) return; // пустой ввод обслуживают pointer-события (push-to-talk)

    // Stop any currently playing TTS and clear queue
    stopCurrentTTS();

    // Add user message to chat history
    chatHistory.push({ role: 'user', content: userMessage });

    addMessage('user', userMessage);
    input.value = '';
    updateSendBtn(); // текст ушёл → кнопка снова микрофон

    // Function to send message with retry logic using secure Netlify function
    const sendMessageWithRetry = async (message: string, retryCount = 0): Promise<void> => {
        const maxRetries = 3;
        let streamDiv: HTMLDivElement | null = null;

        try {
            // Spark: стримим SSE и параллельно озвучиваем предложения по мере генерации
            const isSpark = currentModelConfig.provider === 'spark';
            const splitter = isSpark ? makeStreamSplitter() : null;
            if (isSpark) {
                isTTSCancelled = false; // новый ответ — очередь снова работает
                ttsStreamId++;          // синтез предыдущего ответа больше не актуален
                streamDiv = document.createElement('div');
                streamDiv.className = 'message bot';
                streamDiv.innerHTML = '<span>…</span>';
                chatDiv.appendChild(streamDiv);
                chatDiv.scrollTop = chatDiv.scrollHeight;
            }

            // Use secure Netlify function instead of direct API call
            const data = await callGeminiAPI(message, {
            model: currentModelConfig.model,
            systemPrompt: LLM_CONFIG.systemPrompt,
            temperature: LLM_CONFIG.temperature,
            useTools: currentModelConfig.provider === 'google',
            provider: currentModelConfig.provider, // <-- ADD THIS LINE
            onDelta: splitter ? (full: string) => {
                splitter.feed(full);
                const part = splitter.render();
                if (part && streamDiv) {
                    const span = streamDiv.querySelector('span');
                    if (span) span.textContent += part;
                    splitter.markRendered(part.length);
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                }
            } : undefined
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

            // Двойной вывод: {"speak","show"} — говорим speak, показываем show
            const rawBotMessage = botMessage;
            let speakMessage = botMessage;
            const dualOutput = parseDualOutput(botMessage);
            if (dualOutput) {
                speakMessage = dualOutput.speak;
                botMessage = dualOutput.show;
            }

            // Spark: финализация стрима — хвост speak в очередь, Replay на уже отрисованном div
            if (splitter) {
                const tail = splitter.flush();
                if (tail.trim()) enqueueSparkTTS(tail);
                const streamed = splitter.result();
                if (streamed) {
                    speakMessage = streamed.speak;
                    botMessage = streamed.show;
                }
                if (streamDiv) {
                    const span = streamDiv.querySelector('span');
                    if (span) span.textContent = botMessage;
                    if (botMessage && botMessage.trim() && !isModelError(botMessage)) {
                        const playBtn = document.createElement('button');
                        playBtn.textContent = 'Replay';
                        playBtn.addEventListener('click', () => speak(speakMessage));
                        streamDiv.appendChild(playBtn);
                    }
                }
            }

            // Only add message if it's not empty and not an error
            if (botMessage && botMessage.trim() && !isModelError(botMessage)) {
                // Add bot message to chat history (raw JSON сохраняет формат)
                chatHistory.push({ role: 'assistant', content: rawBotMessage });
                if (!splitter) {
                    addMessage('bot', botMessage, false, speakMessage);
                }
            } else if (botMessage && botMessage.trim()) {
                console.warn('Model returned error message, retrying:', botMessage);
                if (retryCount < maxRetries) {
                    streamDiv?.remove(); streamDiv = null;
                    console.log(`Retrying message (attempt ${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    return sendMessageWithRetry(message, retryCount + 1);
                }
            } else if (!botMessage || !botMessage.trim()) {
                console.warn('Model returned empty message, retrying');
                if (retryCount < maxRetries) {
                    streamDiv?.remove(); streamDiv = null;
                    console.log(`Retrying message (attempt ${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    return sendMessageWithRetry(message, retryCount + 1);
                }
            }

        } catch (error) {
            streamDiv?.remove(); streamDiv = null;
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

// --- Фото: GLM-5.3 понимает изображения; шлём base64 через гейтвей.
// Текст из поля ввода (если набран) уходит вместе с фото — модель понимает,
// о чём спросить. 📎 — галерея, 📷 — камера (capture=environment). ---
photoBtn.addEventListener('click', () => photoInput.click());
cameraBtn.addEventListener('click', () => cameraInput.click());

async function handlePhotoFile(file: File): Promise<void> {
    if (file.size > 8 * 1024 * 1024) {
        addMessage('bot', 'Фото слишком большое (макс. 8 МБ).', true);
        return;
    }
    if (currentModelConfig.provider !== 'spark') {
        addMessage('bot', 'Фото понимает только GLM (spark) — переключи модель.', true);
        return;
    }
    // текст берём до очистки поля: он уходит вместе с фото
    const userText = input.value.trim();
    input.value = '';
    updateSendBtn();
    try {
        const b64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = () => reject(r.error);
            r.readAsDataURL(file);
        });
        stopCurrentTTS();
        addMessage('user', userText ? `📷 Фото: ${userText}` : '📷 Фото');
        chatHistory.push({
            role: 'user',
            content: '[пользователь отправил фото]' + (userText ? `: ${userText}` : '')
        });
        const prompt = userText ||
            'Посмотри на изображение и ответь по существу, как собеседник.';
        const data = await callGeminiAPI(
            prompt,
            {
                model: currentModelConfig.model,
                systemPrompt: LLM_CONFIG.systemPrompt,
                temperature: LLM_CONFIG.temperature,
                useTools: false,
                provider: currentModelConfig.provider,
                useHistory: true,
                imageBase64: b64
            });
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const raw = parts.map((p: any) => p.text || '').join('');
        let show = raw;
        let speakText = raw;
        try {
            const j = JSON.parse(raw);
            if (j && typeof j.show === 'string') { show = j.show; speakText = j.speak || j.show; }
        } catch { /* не JSON — показываем как есть */ }
        chatHistory.push({ role: 'assistant', content: raw });
        addMessage('bot', show, false, speakText);
    } catch (err) {
        console.error('ошибка отправки фото', err);
        addMessage('bot', 'Не удалось отправить фото.', true);
    }
}

photoInput.addEventListener('change', () => {
    const file = photoInput.files && photoInput.files[0];
    photoInput.value = '';
    if (file) void handlePhotoFile(file);
});
cameraInput.addEventListener('change', () => {
    const file = cameraInput.files && cameraInput.files[0];
    cameraInput.value = '';
    if (file) void handlePhotoFile(file);
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

        // Clear chat history when switching models
        chatHistory = [];
        geminiChatSession = null;

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
                chatHistory.push({ role: 'user', content: message });

                // Build messages array with system prompt + last 10 messages from history
                const messages = [
                    {
                        role: 'system',
                        content: LLM_CONFIG.systemPrompt
                    },
                    ...chatHistory.slice(-10) // Keep only last 10 messages for context
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
                chatHistory.push({ role: 'assistant', content: botMessage });

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

// Две очереди, чтобы порядок воспроизведения всегда совпадал с порядком
// предложений от LLM: (1) ttsSentenceQueue — строки на синтез (FIFO),
// (2) ttsQueue — готовое аудио (FIFO). Синтез идёт строго последовательно,
// один запрос за раз, с забеганием вперёд относительно воспроизведения:
// пока звучит предложение N, N+1 уже синтезируется — первый звук так же
// быстрый, но порядок гарантирован (раньше все запросы уходили параллельно
// и ложились в очередь по порядку ЗАВЕРШЕНИЯ — отсюда перестановки).
interface TTSSentence { text: string; streamId: number; }
interface TTSQueueItem { text: string; audioUrl: string; audio: HTMLAudioElement; }
const ttsSentenceQueue: TTSSentence[] = [];
const ttsQueue: TTSQueueItem[] = [];
let ttsPlaying = false;
let ttsSynthBusy = false;
// Поколение очереди: stopCurrentTTS() и каждый новый стрим инкрементируют его,
// просроченные результаты синтеза отбрасываются (иначе предложение старого
// ответа может влезть в очередь нового).
let ttsStreamId = 0;

// Сброс обеих очередей и поколения. Текущий запрос синтеза завершится, увидит
// чужой streamId и выбросит результат; ttsSynthBusy сбросится в его .then/.catch.
function flushTTSQueues() {
    ttsStreamId++;
    ttsSentenceQueue.length = 0;
    ttsQueue.length = 0;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    ttsPlaying = false;
}

function stopCurrentTTS() {
    isTTSCancelled = true;
    flushTTSQueues();
}

// Дробим длинный текст по запятым/пробелам: короткие запросы синтезируются
// быстрее -> первый звук раньше, а конкуренция с GLM за GPU меньше бьёт по
// максимальной задержке.
function splitLongText(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text];
    const out: string[] = [];
    let rest = text;
    while (rest.length > maxLen) {
        const window = rest.slice(0, maxLen);
        let cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(': '), window.lastIndexOf(' — '));
        if (cut < 40) cut = window.lastIndexOf(' ');
        if (cut < 40) cut = maxLen;
        const piece = rest.slice(0, cut + 1).trim();
        if (piece) out.push(piece);
        rest = rest.slice(cut + 1);
    }
    if (rest.trim()) out.push(rest.trim());
    return out.filter(s => s.length > 0);
}

function enqueueSparkTTS(text: string, streamId: number = ttsStreamId) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 250) {
        splitLongText(trimmed, 250).forEach(c => enqueueSparkTTS(c, streamId));
        return;
    }
    // Порядок воспроизведения задаётся моментом постановки в очередь строк,
    // а не порядком завершения запросов.
    ttsSentenceQueue.push({ text: trimmed, streamId });
    pumpSynth();
}

// Синтезатор: берёт следующую строку, синтезирует, кладёт аудио в очередь
// воспроизведения и сразу берёт следующую — к моменту, когда замолчит
// предложение N, аудио N+1 уже готово или синтезируется.
function pumpSynth() {
    if (ttsSynthBusy || isTTSCancelled) return;
    // Просроченные строки (после flushTTSQueues) молча пропускаем
    while (ttsSentenceQueue.length && ttsSentenceQueue[0].streamId !== ttsStreamId) {
        ttsSentenceQueue.shift();
    }
    const item = ttsSentenceQueue.shift();
    if (!item) return;
    ttsSynthBusy = true;
    speakWithSpark(item.text).then(({ audioUrl, audio }) => {
        ttsSynthBusy = false;
        if (isTTSCancelled || item.streamId !== ttsStreamId) {
            URL.revokeObjectURL(audioUrl);
        } else {
            ttsQueue.push({ text: item.text, audioUrl, audio });
            pumpTTSQueue();
        }
        pumpSynth();
    }).catch(err => {
        ttsSynthBusy = false;
        console.warn('TTS queue: синтез не удался:', err);
        pumpSynth(); // одна ошибка не должна остановить остальные строки
    });
}

function pumpTTSQueue() {
    if (ttsPlaying || isTTSCancelled) return;
    const item = ttsQueue.shift();
    if (!item) { currentAudio = null; return; }
    ttsPlaying = true;
    currentAudio = item.audio;
    const done = () => {
        URL.revokeObjectURL(item.audioUrl);
        ttsPlaying = false;
        currentAudio = null;
        pumpTTSQueue();
    };
    item.audio.onended = done;
    item.audio.onerror = done;
    item.audio.play().catch(done);
}

// Извлекает двойной вывод LLM: {"speak": "...", "show": "..."}
function parseDualOutput(raw: string): { speak: string; show: string } | null {
    if (!raw) return null;
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : raw;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
        const obj = JSON.parse(candidate.slice(start, end + 1));
        if (obj && typeof obj.speak === 'string' && typeof obj.show === 'string'
            && obj.speak.trim() && obj.show.trim()) {
            return { speak: obj.speak, show: obj.show };
        }
    } catch (_) { /* не JSON — обычный текст, вернём null */ }
    return null;
}

// Инкрементальный разбор {"speak","show"} из частичного JSON, приходящего стримом.
// По мере генерации отдаёт завершённые предложения speak в TTS-очередь и часть show на рендер.
function makeStreamSplitter() {
    let spokenLen = 0;  // сколько символов speak уже отправлено в TTS
    let shownLen = 0;   // сколько символов show уже отрисовано
    let lastSpeak = '';
    let lastShow = '';

    // JSON.parse по частичному тексту: закрываем кавычку/скобку и пробуем
    function extractPartial(raw: string): { speak: string; show: string } | null {
        const start = raw.indexOf('{');
        if (start === -1) return null;
        const base = raw.slice(start);
        for (const attempt of [base, base + '"', base + '"}']) {
            try {
                const obj = JSON.parse(attempt);
                if (obj && typeof obj.speak === 'string' && typeof obj.show === 'string') {
                    return { speak: obj.speak, show: obj.show };
                }
            } catch (_) { /* пробуем следующий вариант */ }
        }
        return null;
    }

    return {
        // Вызывается на каждый SSE-чанк с полным накопленным текстом
        feed(raw: string) {
            const partial = extractPartial(raw);
            if (!partial) return;
            lastSpeak = partial.speak;
            lastShow = partial.show;
            const pending = partial.speak.slice(spokenLen);
            // Завершённые предложения: терминатор, за которым пробел (не конец частичного
            // текста — иначе можно отрезать "3." от "3.14"). Хвост уйдёт в TTS при финализации.
            const re = /[\s\S]*?[.!?…]+(?=\s)/g;
            const parts: string[] = [];
            let m: RegExpExecArray | null;
            let lastEnd = 0;
            // В одном SSE-чанке может прийти несколько завершённых предложений —
            // enqueue ВСЕ (иначе теряются все, кроме последнего: «на озвучку
            // уходит не все»).
            while ((m = re.exec(pending)) !== null) { parts.push(m[0]); lastEnd = re.lastIndex; }
            if (parts.length) {
                spokenLen += lastEnd;
                // Каждое предложение — отдельный запрос: аудио первого готово
                // сразу, а не после синтеза всего чанка.
                parts.forEach(p => enqueueSparkTTS(p));
            }
        },
        // Новая часть show для рендера
        render(): string { return lastShow.slice(shownLen); },
        markRendered(n: number) { shownLen += n; },
        // Хвост speak, не отправленный в очередь (последнее предложение без пробела после)
        flush(): string {
            const tail = lastSpeak.slice(spokenLen);
            spokenLen = lastSpeak.length;
            return tail;
        },
        result(): { speak: string; show: string } | null {
            return (lastSpeak || lastShow) ? { speak: lastSpeak, show: lastShow } : null;
        }
    };
}

function addMessage(type: string, text: string, skipTTS: boolean = false, speakOverride?: string) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `<span>${text}</span>`;
    if (type === 'bot' && !skipTTS) {
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Replay';
        playBtn.addEventListener('click', () => {
            speak(speakOverride || text);
        });
        msgDiv.appendChild(playBtn);
        // Instant TTS
        speak(speakOverride || text);
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
        } else if (service === 'spark') {
            // Ручной Replay вне очереди: глушим обе очереди и играем сразу
            flushTTSQueues();
            const { audioUrl, audio } = await speakWithSpark(text);
            currentAudio = audio;
            audio.onended = () => { URL.revokeObjectURL(audioUrl); if (currentAudio === audio) currentAudio = null; };
            audio.play().catch(() => {});
        }
    } catch (error) {
        console.error('Speech synthesis error:', error);
        // Attempt to use browser's built-in TTS as fallback
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

// Spark TTS: клон голоса через гейтвей DGX (OpenAI-совместимый /v1/audio/speech)
// https-страница (Netlify) не может звать http://LAN (mixed content) — идём через туннель
const GATEWAY_HTTPS_URL = 'https://dig-investment-satisfy-pencil.trycloudflare.com';
function gatewayBase(): string {
    return location.protocol === 'https:' ? GATEWAY_HTTPS_URL : 'http://192.168.1.201:8000';
}

// Прогрев qwen-TTS при открытии страницы: модель грузится ~30 с, делаем это заранее,
// пока пользователь печатает. Гейтвей проксирует /admin/load на TTS-сервер (:8102
// браузеру недоступен — mixed content + CORS).
if (ttsSelect.value === 'spark') {
    fetch(gatewayBase() + '/admin/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: 'qwen' })
    }).then(r => r.json())
      .then((r: { ok?: boolean; loaded?: boolean }) => console.log('TTS warmup:', r))
      .catch(() => {});
}

// Прогрев микрофона при открытии: Chrome показывает запрос доступа ДО первого
// нажатия. Иначе диалог доступа прерывает жест pointercancel-ом, и первое
// нажатие умирает вхолостую (пользователь разрешает — а запись уже выброшена).
navigator.mediaDevices?.getUserMedia({ audio: true })
    .then(s => { s.getTracks().forEach(t => t.stop()); console.log('mic warm: ok'); })
    .catch(() => console.log('mic warm: нет доступа (спросим при нажатии)'));

// App-shell: подгоняем каркас под визуальный вьюпорт. Клавиатура не перекрывает
// поле ввода, даже если interactive-widget не поддержан; при pan браузера каркас
// едет вместе с видимой областью, а не остаётся под клавиатурой.
const vv = window.visualViewport;
if (vv) {
    const applyVV = () => {
        document.body.style.height = vv.height + 'px';
        document.body.style.top = vv.offsetTop + 'px';
    };
    vv.addEventListener('resize', applyVV);
    vv.addEventListener('scroll', applyVV);
    applyVV();
}

async function speakWithSpark(text: string) {
    // Клон голоса живёт в qwen: auto-режим отдаёт silero, пока qwen холодная.
    // Просим qwen явно (первый запрос после простоя грузит её ~30 с), откат — auto.
    const call = (engine: string) => fetch(gatewayBase() + '/v1/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'tts',
            input: text,
            voice: 'default',
            engine: engine,
            response_format: 'mp3'
        })
    });
    let response = await call('qwen');
    if (!response.ok) {
        console.warn('Spark TTS: qwen недоступна (', response.status, '), пробую auto');
        response = await call('auto');
    }
    if (!response.ok) {
        throw new Error(`Spark TTS error: ${response.status}`);
    }
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    // Воспроизведением управляет очередь (enqueueSparkTTS/pumpTTSQueue)
    return { audioUrl, audio };
}

async function speakWithGemini(text: string) {
    try {
        // Check if we're running locally (development mode)
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isLocalDev) {
            // LOCAL DEVELOPMENT: Use direct Google Cloud Text-to-Speech API
            console.log('🔧 Running Gemini TTS in local development mode');

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                console.warn('Gemini API key not configured for local development, falling back to browser TTS');
                const utterance = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterance);
                return;
            }

            const ttsRequestBody = {
                input: {
                    text: text
                },
                voice: {
                    languageCode: 'en-US',
                    name: TTS_CONFIG.voiceName
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 1.0,
                    pitch: 0.0
                }
            };

            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ttsRequestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini TTS API error:', errorData);
                throw new Error(`TTS API Error: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.audioContent) {
                throw new Error('No audio content received from Gemini TTS');
            }

            // Convert base64 to audio blob and play
            const audioBuffer = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();

            // Clean up the URL after playing
            audio.onended = () => URL.revokeObjectURL(audioUrl);
        } else {
            // PRODUCTION: Use Netlify function
            console.log('🌐 Running Gemini TTS via Netlify function');

            // Add timeout handling for long-running TTS requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 70000); // 70 seconds timeout

            try {
                const response = await fetch('/.netlify/functions/gemini-tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: text,
                        voiceName: TTS_CONFIG.voiceName,
                        temperature: TTS_CONFIG.temperature
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Gemini TTS Netlify function error:', errorData);
                    throw new Error(`TTS API Error: ${response.statusText}`);
                }

                // Get audio blob from response
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play();

                // Clean up the URL after playing
                audio.onended = () => URL.revokeObjectURL(audioUrl);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                    console.error('Gemini TTS request timed out after 70 seconds');
                    throw new Error('TTS request timed out. The service may be busy.');
                }
                throw fetchError;
            }
        }
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

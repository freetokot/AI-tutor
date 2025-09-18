import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
// Set your API key here (from environment or hardcoded for demo)
// Note: For security, in production, use a backend to proxy API calls
const API_KEY = 'AIzaSyA_at7oN4UUZe6LoZbiHzWeAEvdo2jTFVw'; // Replace with your actual Gemini API key
const currentDate = new Date();
// Форматируем дату для русскоязычной локали (дд.мм.гггг)
const formattedDate = currentDate.toLocaleDateString('ru-RU');
// Configs
const LLM_CONFIG = {
    model: 'models/gemini-2.5-flash',
    // systemPrompt: `Ты - вики. Мы тестируем твои возможности. Отвечай на вопросы максимально подробно, с примерами и объяснениями. Если не знаешь ответа, скажи честно, что не знаешь. Используй простой и понятный язык. Твои ответы будут озвучены tts, поэтому заменяй числа и математические действия словами. Если пользователь просит найти актуальную информацию, пользуйся инструментом google search.`,
    systemPrompt: `1. Роль:
Ты — «ВИКИ», мудрый и дружелюбный ИИ-репетитор. Твой ученик — третьеклассник Андрей.
2. Ключевая задача:
Твоя цель — научить Андрея думать самостоятельно. Не давай готовых ответов, а объясняй, как их найти. Помогай ему разбивать сложные задачи на простые шаги и направляй его с помощью наводящих вопросов.
3. Стиль общения:
Краткость: Отвечай кратко и по существу. Твои ответы должны быть пригодны для озвучивания (TTS), поэтому преобразовывай числа и математические действия в слова.
Обращение: Обращайся к пользователю по имени «Андрей», но не в каждой строке, чтобы речь звучала естественно.
Тон: Спокойный, подбадривающий и немного игривый. Используй простые аналогии (например, деление яблок, постройка из кубиков).
Поддержка: Всегда хвали за усилия, даже если ответ неправильный. Помогай исправлять ошибки, не ругая.
4. Главное правило: ЗАПРЕТ НА ПРЯМЫЕ ОТВЕТЫ
Это самое важное. Ты никогда не должна называть итоговый правильный ответ на задания из школьной программы 3 класса, даже если Андрей очень просит.
Вместо того чтобы сказать: «Правильный ответ — 15».
Спроси: «А давай-ка проверим. Сколько будет пять умножить на три?».
Вместо того чтобы сказать: «Нет, в этом слове пишется буква "о"».
Спроси: «А какое проверочное слово мы можем подобрать, чтобы узнать гласную в корне?».
Если Андрей настаивает, мягко объясни: «Андрей, моя задача — научить тебя находить ответы самому. Готовый ответ в этом не поможет. Давай попробуем еще раз вместе!».
5. Использование интернет-поиска:
Ты можешь обращаться к поиску в двух случаях:
По запросу: Если Андрей прямо просит что-то найти (например, «ВИКИ, найди, какой самый большой океан»).
При неуверенности: Если ты не уверена в факте или правильности своего объяснения, используй поиск для проверки.
6. Объяснение новых тем:
Когда Андрей просит объяснить новую тему, выполни два шага:
Дай четкое и простое объяснение своими словами.
Придумай несколько собственных, синтезированных примеров для иллюстрации. Не бери примеры из его конкретных заданий.
Если Андрей просит информацию, не относящуюся к учебной программе 3 класса, отвечай кратко и по существу, но так, чтобы третьеклассник понял. Не обсуждай темы 18+.
7. Игровой режим:
Если Андрей предлагает поиграть, это означает, что ты должна придумывать короткие задания на заданную им тему. Считай, сколько правильных ответов он дал с первого раза. После правильного ответа сразу давай следующее задание. После каждых 5 заданий спрашивай, хочет ли он продолжить.
Дата сегодня: ${formattedDate}.`,
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
// LLM Model configurations
const LLM_MODELS = {
    'gemini-default': {
        model: 'models/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        apiKey: API_KEY,
        provider: 'google'
    },
    'gemini-lite': {
        model: 'models/gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash (Lite)',
        apiKey: API_KEY,
        provider: 'google'
    },
    'openrouter': {
        model: 'openrouter/sonoma-sky-alpha',
        name: 'Sonoma Sky Alpha',
        apiKey: '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',
        provider: 'openrouter'
    }
};
const genAI = new GoogleGenerativeAI(API_KEY);
const chatModel = genAI.getGenerativeModel({
    model: LLM_CONFIG.model,
    systemInstruction: LLM_CONFIG.systemPrompt,
    generationConfig: {
        temperature: LLM_CONFIG.temperature,
    },
    tools: [{
            functionDeclarations: [{
                    name: 'googleSearch',
                    description: 'Search the web for information to answer questions',
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            query: {
                                type: SchemaType.STRING,
                                description: 'The search query to find information'
                            }
                        },
                        required: ['query']
                    }
                }]
        }],
});
let chat = chatModel.startChat();
let currentModelConfig = LLM_MODELS['gemini-default'];
let openRouterHistory = [];
const ai = new GoogleGenAI({ apiKey: API_KEY });
const chatDiv = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const llmSelect = document.getElementById('llm-model');
const ttsSelect = document.getElementById('tts-service');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('download-progress');
const progressText = document.getElementById('progress-text');
let piperLoaded = false;
let piperModel = null;
let piperConfig = null;
sendBtn.addEventListener('click', async () => {
    const userMessage = input.value.trim();
    if (!userMessage)
        return;
    addMessage('user', userMessage);
    input.value = '';
    try {
        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        // Handle different response formats based on provider
        if (currentModelConfig.provider === 'google') {
            // Check if the model wants to use a tool
            const functionCalls = response.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
                console.log("Model wants to use search!");
                // Perform the search
                const searchResults = await performGoogleSearch(functionCalls[0].args.query);
                // Send the search results back to the model
                const resultWithSearch = await chat.sendMessage([{
                        functionResponse: {
                            name: 'googleSearch',
                            response: {
                                content: searchResults,
                            },
                        },
                    }]);
                // Get the final response
                const finalResponse = resultWithSearch.response;
                const botMessage = finalResponse.text();
                addMessage('bot', botMessage);
            }
            else {
                // No tool calls, just return the text response
                const botMessage = response.text();
                addMessage('bot', botMessage);
            }
        }
        else if (currentModelConfig.provider === 'openrouter') {
            // OpenRouter doesn't support function calls in the same way
            const botMessage = response.text();
            addMessage('bot', botMessage);
        }
    }
    catch (error) {
        addMessage('bot', 'Error: ' + error.message);
    }
});
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});
// LLM Model selector event listener
llmSelect.addEventListener('change', async () => {
    const selectedModel = llmSelect.value;
    await switchToModel(selectedModel);
});
// Function to switch to a different LLM model
async function switchToModel(modelKey) {
    try {
        const modelConfig = LLM_MODELS[modelKey];
        currentModelConfig = modelConfig;
        if (modelConfig.provider === 'google') {
            // Use Google Gemini
            const genAI = new GoogleGenerativeAI(modelConfig.apiKey);
            const chatModel = genAI.getGenerativeModel({
                model: modelConfig.model,
                systemInstruction: LLM_CONFIG.systemPrompt,
                generationConfig: {
                    temperature: LLM_CONFIG.temperature,
                },
                tools: [{
                        functionDeclarations: [{
                                name: 'googleSearch',
                                description: 'Search the web for information to answer questions',
                                parameters: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        query: {
                                            type: SchemaType.STRING,
                                            description: 'The search query to find information'
                                        }
                                    },
                                    required: ['query']
                                }
                            }]
                    }],
            });
            chat = chatModel.startChat();
            // Clear OpenRouter history when switching away
            openRouterHistory = [];
        }
        else if (modelConfig.provider === 'openrouter') {
            // Use OpenRouter API
            chat = await createOpenRouterChat(modelConfig);
            // History is maintained for OpenRouter, no need to reset
        }
        console.log(`Switched to model: ${modelConfig.name}`);
        addMessage('bot', `Переключено на модель: ${modelConfig.name}`);
    }
    catch (error) {
        console.error('Error switching model:', error);
        addMessage('bot', 'Ошибка при переключении модели: ' + error.message);
    }
}
// Function to create OpenRouter chat instance
async function createOpenRouterChat(modelConfig) {
    // For OpenRouter, we'll create a simple chat handler
    const openRouterChat = {
        async sendMessage(message) {
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
            }
            catch (error) {
                console.error('OpenRouter request failed:', error);
                throw error;
            }
        }
    };
    return openRouterChat;
}
function addMessage(type, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `<span>${text}</span>`;
    if (type === 'bot') {
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
async function speak(text) {
    const service = ttsSelect.value;
    try {
        if (service === 'gemini') {
            await speakWithGemini(text);
        }
        else if (service === 'google-cloud') {
            try {
                await speakWithGoogleCloud(text);
            }
            catch (error) {
                console.warn('Google Cloud TTS failed, falling back to Gemini TTS:', error);
                await speakWithGemini(text);
            }
        }
        else if (service === 'piper') {
            await speakWithPiper(text);
        }
        else if (service === 'silero') {
            await speakWithSilero(text);
        }
    }
    catch (error) {
        console.error('Speech synthesis error:', error);
        // Attempt to use browser's built-in TTS as fallback
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}
async function speakWithGemini(text) {
    try {
        const config = {
            temperature: TTS_CONFIG.temperature,
            responseModalities: ['audio'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: TTS_CONFIG.voiceName,
                    }
                }
            },
        };
        const model = TTS_CONFIG.model;
        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: text,
                    },
                ],
            },
        ];
        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });
        let audioData = '';
        let mimeType = '';
        for await (const chunk of response) {
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
                const inlineData = chunk.candidates[0].content.parts[0].inlineData;
                audioData += inlineData.data || '';
                mimeType = inlineData.mimeType || '';
            }
        }
        if (audioData) {
            let buffer;
            if (!mimeType.includes('wav')) {
                buffer = convertToWav(audioData, mimeType);
            }
            else {
                const binaryString = atob(audioData);
                buffer = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    buffer[i] = binaryString.charCodeAt(i);
                }
            }
            const blob = new Blob([buffer], { type: 'audio/wav' });
            const audio = new Audio(URL.createObjectURL(blob));
            audio.play();
        }
    }
    catch (error) {
        console.error('Gemini TTS error:', error);
    }
}
async function speakWithGoogleCloud(text) {
    try {
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: { text: text },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
                audioConfig: { audioEncoding: 'MP3' },
            }),
        });
        if (!response.ok) {
            throw new Error('Google Cloud TTS failed');
        }
        const data = await response.json();
        const audioContent = data.audioContent;
        const audioBuffer = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
        const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
    }
    catch (error) {
        console.error('Google Cloud TTS error:', error);
    }
}
async function downloadWithProgress(url, onProgress) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
    try {
        const response = await fetch(url, { signal: controller.signal });
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength) : 0;
        const reader = response.body.getReader();
        const chunks = [];
        let loaded = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            chunks.push(value);
            loaded += value.length;
            onProgress(loaded, total);
        }
        const blob = new Blob(chunks);
        return blob.arrayBuffer();
    }
    finally {
        clearTimeout(timeoutId);
    }
}
async function waitForPhonemizer() {
    return new Promise((resolve, reject) => {
        let tries = 0;
        function check() {
            const piper = window.createPiperPhonemize;
            if (piper && typeof piper === 'function') {
                resolve(piper);
            }
            else if (++tries > 50) {
                reject(new Error('Piper phonemization module not loaded correctly'));
            }
            else {
                setTimeout(check, 100);
            }
        }
        check();
    });
}
async function phonemeIds(text) {
    const createPhonemizer = await waitForPhonemizer();
    return new Promise((resolve, reject) => {
        const phonemizer = createPhonemizer({
            print: (data) => {
                try {
                    resolve(JSON.parse(data).phoneme_ids);
                }
                catch (e) {
                    reject(new Error('Failed to parse phonemizer output'));
                }
            },
            printErr: (message) => {
                console.error('Phonemizer error:', message);
                reject(new Error(message));
            },
            locateFile: (url) => {
                if (url.endsWith('.wasm'))
                    return 'https://huggingface.co/rhasspy/piper-voices/raw/main/piper_phonemize.wasm';
                if (url.endsWith('.data'))
                    return 'https://huggingface.co/rhasspy/piper-voices/raw/main/piper_phonemize.data';
                return url;
            }
        });
        phonemizer.callMain([
            '-l', 'ru_RU',
            '--input', JSON.stringify([{ text }]),
            '--espeak_data', '/espeak-ng-data'
        ]);
    });
}
async function loadPiper() {
    if (piperLoaded)
        return;
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
    console.log(`[${new Date().toISOString()}] Initial piper availability:`, typeof window.piper);
    console.log(`[${new Date().toISOString()}] Initial ort availability:`, typeof window.ort);
    // Wait for dependencies with timeout
    let waitCount = 0;
    let piperReady = false;
    let ortReady = false;
    while ((!window.piper || !window.ort) && waitCount < 300) { // 30 seconds timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
        // Check individual dependencies and log changes
        const currentPiper = !!window.piper;
        const currentOrt = !!window.ort;
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
                const readyState = script.readyState || 'unknown';
                console.log(`[${new Date().toISOString()}] Script ${index}: ${script.src} - readyState: ${readyState}`);
            }
        });
        throw new Error(`Dependencies failed to load within timeout (${totalElapsed}ms). Piper: ${piperReady ? 'OK' : 'FAILED'}, ONNX: ${ortReady ? 'OK' : 'FAILED'}`);
    }
    console.log(`[${new Date().toISOString()}] SUCCESS - All dependencies loaded in ${totalElapsed}ms`);
    console.log(`[${new Date().toISOString()}] Piper ready: ${piperReady}, ONNX Runtime ready: ${ortReady}`);
    console.log('Dependencies loaded.');
    // Set ONNX environment
    if (typeof window.ort !== 'undefined') {
        window.ort.env.wasm.numThreads = navigator.hardwareConcurrency;
        window.ort.env.wasm.wasmPaths = 'https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.17.1/';
    }
    progressBar.value = 100;
    progressText.textContent = 'Ready';
    setTimeout(() => progressContainer.style.display = 'none', 1000);
    piperLoaded = true;
    console.log('Piper loading complete.');
}
async function speakWithPiper(text) {
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
    const session = await window.ort.InferenceSession.create(URL.createObjectURL(new Blob([piperModel])));
    const feeds = {
        input: new window.ort.Tensor('int64', ids, [1, ids.length]),
        input_lengths: new window.ort.Tensor('int64', [ids.length]),
        scales: new window.ort.Tensor('float32', [noiseScale, lengthScale, noiseW])
    };
    if (Object.keys(piperConfig.speaker_id_map).length) {
        feeds.sid = new window.ort.Tensor('int64', [0]);
    }
    console.log('Running inference...');
    const { output: { data: pcm } } = await session.run(feeds);
    console.log('Inference complete.');
    const wavBuffer = PCM2WAV(pcm, sampleRate, numChannels);
    const file = new Blob([wavBuffer], { type: 'audio/x-wav' });
    const audio = new Audio(URL.createObjectURL(file));
    audio.play();
}
async function performGoogleSearch(query) {
    const cx = 'b5df8993e2ba640ef';
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${cx}&q=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(searchUrl);
        if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const results = data.items.slice(0, 3).map((item) => `${item.title}\n${item.snippet}`).join('\n\n');
                return results;
            }
            else {
                return 'No results found.';
            }
        }
        throw new Error('Google search failed');
    }
    catch (error) {
        console.error('Search error:', error);
        return `An error occurred while searching for: "${query}". Please try again later.`;
    }
}
function splitIntoSentences(text) {
    // Split on period, question mark, or exclamation mark followed by space or end
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    return sentences;
}
async function speakWithSilero(text) {
    try {
        console.log("Processing text with Silero:", text);
        // Split text into sentences
        const sentences = splitIntoSentences(text);
        if (sentences.length === 0) {
            console.warn("No valid sentences found in text");
            return;
        }
        console.log(`Processing ${sentences.length} sentence(s)...`);
        // Process each sentence sequentially
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            console.log(`Processing sentence ${i + 1}: "${sentence}"`);
            try {
                const response = await fetch('http://localhost:8000/synthesize/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: sentence }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`Failed to process sentence ${i + 1}:`, errorData.detail);
                    continue; // Skip this sentence and continue with others
                }
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                // Play audio and wait for it to finish before proceeding to next sentence
                await new Promise((resolve, reject) => {
                    audio.onended = () => resolve();
                    audio.onerror = () => {
                        console.error(`Error playing audio for sentence ${i + 1}`);
                        resolve(); // Continue even if playback fails
                    };
                    audio.play().catch(() => {
                        console.error(`Failed to play audio for sentence ${i + 1}`);
                        resolve(); // Continue even if play fails
                    });
                });
                // Clean up the blob URL
                URL.revokeObjectURL(audioUrl);
            }
            catch (error) {
                console.error(`Error processing sentence ${i + 1}:`, error);
                continue; // Continue with next sentence
            }
        }
        console.log("All sentences processed successfully");
    }
    catch (error) {
        console.error('Error in Silero TTS processing:', error);
        throw error;
    }
}
function convertToWav(rawData, mimeType) {
    const options = parseMimeType(mimeType);
    const dataLength = atob(rawData).length;
    const wavHeader = createWavHeader(dataLength, options);
    const dataBuffer = new Uint8Array(atob(rawData).split('').map(c => c.charCodeAt(0)));
    const combined = new Uint8Array(wavHeader.length + dataBuffer.length);
    combined.set(wavHeader, 0);
    combined.set(dataBuffer, wavHeader.length);
    return combined;
}
function parseMimeType(mimeType) {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');
    const options = {
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
function createWavHeader(dataLength, options) {
    const { numChannels = 1, sampleRate = 44100, bitsPerSample = 16, } = options;
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
function PCM2WAV(buffer, sampleRate, numChannels) {
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

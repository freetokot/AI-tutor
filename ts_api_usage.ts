// Function to synthesize text to speech
async function synthesizeSpeech(text: string): Promise<Blob> {
    const response = await fetch('http://localhost:8000/synthesize/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
}

// Example usage
async function playGeneratedSpeech(text: string) {
    try {
        const audioBlob = await synthesizeSpeech(text);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
    } catch (error) {
        console.error('Error generating speech:', error);
    }
}

// Example call
playGeneratedSpeech('Привет, как дела?');
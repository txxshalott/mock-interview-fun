
export interface LlmConfig {
    name: string;
    id: string;
}

export const providerConfigs = {
    retell: {
        name: 'Retell',
        llms: {
            gpt41: { name: 'GPT 4.1', id: 'RETELL_GPT41' },
            gpt4ort: { name: 'GPT 4o realtime', id: 'RETELL_GPTREALTIME' },
            gpt4ominirt: { name: 'GPT 4o mini realtime', id: 'RETELL_GPTMINIREALTIME' },
            claude37sonnet: { name: 'Claude 3.7 Sonnet', id: 'RETELL_SONNET37' },
            claude35haiku: { name: 'Claude 3.5 Haiku', id: 'RETELL_HAIKU35' },
            gemini20flash: { name: 'Gemini 2.0 Flash', id: 'RETELL_GEMINI20FLASH' },
        }
    },
    eleven: {
        name: 'ElevenLabs',
        llms: {
            claude37sonnet: { name: 'Claude 3.7 Sonnet', id: 'ELEVEN_SONNET37' },
            claudesonnet4: { name: 'Claude Sonnet 4', id: 'ELEVEN_SONNET4' },
            gemini20flash: { name: 'Gemini 2.0 Flash', id: 'ELEVEN_GEMINI20FLASH' },
            gemini25flash: { name: 'Gemini 2.5 Flash', id: 'ELEVEN_GEMINI25FLASH' },
            gemini20flashlite: { name: 'Gemini 2.0 Flash Lite', id: 'ELEVEN_GEMINI20FLASHLITE' },
            claude35haiku: { name: 'Claude 3.5 Haiku', id: 'ELEVEN_CLAUDE35HAIKU' },
        }
    }
};
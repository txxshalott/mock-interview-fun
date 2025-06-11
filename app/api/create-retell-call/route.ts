import { Retell } from 'retell-sdk';
import { providerConfigs } from '../../../config/LlmConfig'

// lol retell-sdk is for backend retell-js-sdk is for frontedn


export async function POST(request: Request) {
    try {

        console.log("api key check:", {
            RETELL_API_KEY: process.env.RETELL_API_KEY ? "✓ Present" : "✗ Missing",
        });

        console.log("Available Retell LLMs:", Object.keys(providerConfigs.retell.llms));

        const requestData = await request.json();
        const llmChoice = requestData.llm || 'gpt41';

        // get id based on choice
        const llmConfig = providerConfigs.retell.llms[llmChoice as keyof typeof providerConfigs.retell.llms];
        const agentId = process.env[llmConfig.id as keyof typeof process.env];

        console.log('retell agent id used: ', agentId, 'for llm: ', llmChoice);
        if (!agentId) {
            console.error(`Missing Retell agent ID. Environment variable ${llmChoice} id not set.`);
            return Response.json({ error: `Missing agent ID (${llmConfig.id} not set)` }, { status: 500 });
        }

        const client = new Retell({
            apiKey: process.env.RETELL_API_KEY || '',
        });

        // create call
        console.log('[${requestId}] call initiated with id: ', agentId); // what is response format
        const response = await client.call.createWebCall({ agent_id: agentId });
        console.log("retell api response:", JSON.stringify(response, null, 2));

        return Response.json(response);

    } catch (error) {
        console.error('Error making call:', error);
        return Response.json(error);
    }

}
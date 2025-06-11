import { providerConfigs } from '../../../config/LlmConfig'

export async function GET(request: Request) {
    try {

        const requestHeaders: HeadersInit = new Headers();
        requestHeaders.set("xi-api-key", process.env.ELEVEN_API_KEY || '');

        const { searchParams } = new URL(request.url);
        const llmChoice = searchParams.get('llm') || 'gemini20flash';
        console.log('selected choice: ', llmChoice);
        console.log('available choices: ', Object.keys(providerConfigs.eleven.llms))

        // find id
        const llmConfig = providerConfigs.eleven.llms[llmChoice as keyof typeof providerConfigs.eleven.llms];
        if (!llmConfig) {
            console.error('Invalid LLM choice for 11labs:', llmChoice);
            return Response.json({ error: 'Invalid LLM configuration' }, { status: 400 });
        }

        // get id from env variables
        const agentId = process.env[llmConfig.id];
        console.log('11labs agent id used: ', agentId);

        if (!agentId) {
            console.error('Missing 11labs agent id');
            return Response.json({ error: 'Missing agent ID configuration' }, { status: 500 });
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
            {
                method: "GET",
                headers: requestHeaders,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.log('Failed to get signed URL', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            return Response.json({ error: `Failed to get signed URL: ${response.statusText}` }, { status: response.status });
        }
        const body = await response.json();
        console.log("Successfully received 11labs signed url")
        return Response.json({ signed_url: body.signed_url });

    } catch (err) {
        console.log('Error in 11labs api route: ', err);
        return new Response(`\nInternal server error: ${err instanceof Error ? err.message : 'Unknown error'}`, { status: 500 });
    }
}
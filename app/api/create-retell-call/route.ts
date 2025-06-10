import { Retell } from 'retell-sdk';

// lol retell-sdk is for backend retell-js-sdk is for frontedn


export async function POST(request: Request) {
    try {
        const client = new Retell({
            apiKey: process.env.RETELL_API_KEY || '',
        });

        // create call
        const response = await client.call.createWebCall({ agent_id: process.env.RETELL_AGENT_ID || '' });

        console.log('[${requestId}] Call initiated:', response); // what is response format
        return Response.json(response);

    } catch (error) {
        console.error('Error making call:', error);
        return Response.json(error);
    }

}
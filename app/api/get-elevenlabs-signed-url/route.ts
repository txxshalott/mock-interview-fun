export async function GET() {
    
    const requestHeaders: HeadersInit = new Headers();
    
    requestHeaders.set("xi-api-key", process.env.ELEVENLABS_API_KEY || '');
    const AGENT_ID = process.env.AGENT_ID || '';

    const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
        {
            method: "GET",
            headers: requestHeaders,
        }
    );

    if (!response.ok) {
        return new Response('Failed to get signed URL', { status: 500 });
    }
    const body = await response.json();
    return Response.json({ signed_url: body.signed_url });
}
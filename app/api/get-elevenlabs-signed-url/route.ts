export async function GET() {
    try {

        const requestHeaders: HeadersInit = new Headers();
        requestHeaders.set("xi-api-key", process.env.ELEVEN_API_KEY || '');

        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.ELEVEN_AGENT_ID || ''}`,
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
            return Response.json(`Failed to get signed URL ${response.statusText}, { status: response.status }`);
        }
        const body = await response.json();
        console.log("Successfully received 11labs signed url")
        return Response.json({ signed_url: body.signed_url });

    } catch (err) {
        console.log('Error in 11labs api route: ', err);
        return new Response(`Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}`, { status: 500 });
    }
}
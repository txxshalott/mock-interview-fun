import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const callId = searchParams.get('callId');
        const download = searchParams.get('download');

        const client = new Retell({
            apiKey: process.env.RETELL_API_KEY || '',
        });
        let data;
        if (callId && download) {
            data = await client.call.retrieve(callId);
            if (download == 'transcript' && data.transcript) {
                console.log('transcript exists')
                return new Response(data.transcript, {
                    headers: {
                        'Content-Type': 'text/plain',
                        'Content-Disposition': `attachment; filename="retell-transcript-${callId}.txt"`,
                    },
                });
            }
            if (download === 'recording_url' && data.recording_url) {
                const recordingResponse = await fetch(data.recording_url);
                const recordingData = await recordingResponse.arrayBuffer();

                return new Response(recordingData, {
                    headers: {
                        'Content-Type': 'audio/mpeg',
                        'Content-Disposition': `attachment; filename="recording-${callId}.mp3"`,
                    },
                });
            }
        }
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: `error.message` }, { status: 500 });
    }
}
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { xml } = await request.json();

    if (!xml) {
        return NextResponse.json({ error: 'Missing XML content' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('ids_file', new Blob([xml], { type: 'application/xml' }), 'audit.ids');

    const apiUrl = process.env.IFCTESTER_API_URL;
    const apiKey = process.env.IFCTESTER_API_KEY;

    if (!apiUrl) {
        return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(`${apiUrl}/ids-audit?include_report=true&report_format=json`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('IDS audit result:', JSON.stringify(result, null, 2));
        return NextResponse.json(result);
    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json({ error: 'Failed to validate IDS' }, { status: 500 });
    }
}

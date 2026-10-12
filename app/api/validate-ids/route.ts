import { NextResponse } from 'next/server';
import { auditIDSDocument } from '@ifc-lite/ids';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    let xml: unknown;
    try {
        ({ xml } = await request.json());
    } catch {
        return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
    }
    if (typeof xml !== 'string' || !xml.trim()) {
        return NextResponse.json({ error: 'Missing XML content' }, { status: 400 });
    }

    try {
        // Audit the IDS document itself. IFC model validation is a separate step.
        const { status, issues } = await auditIDSDocument(xml);
        return NextResponse.json({ status, issues });
    } catch (error) {
        console.error('IDS document audit failed:', error);
        return NextResponse.json({ error: 'IDS validation failed. Please retry. You can still download the generated IDS XML.' }, { status: 500 });
    }
}

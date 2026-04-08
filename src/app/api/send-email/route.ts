import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Security: Check allowed hosts (uncomment to enable in production)
    // const host = request.headers.get('host') || '';
    // const allowedHosts = ['smb.comply.me', 'comply.me', 'localhost:3000'];
    // if (!allowedHosts.includes(host)) {
    //   return NextResponse.json(
    //     { error: 'Invalid origin' },
    //     { status: 403 }
    //   );
    // }

    // Parse request body
    const body = await request.json();
    const { email, templateId, params } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Receiver email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Read BREVO settings from environment variables
    const apiKey = (process.env.BREVO_API_KEY ?? '').trim();
    const envTemplateIdRaw = (process.env.BREVO_REGISTRATION_TEMPLATE_ID ?? '1').trim();
    const resolvedTemplateId = Number(templateId ?? envTemplateIdRaw);

    // Debug-safe diagnostics (no secret value logging).
    console.log('BREVO config check:', {
      apiKeyPresent: Boolean(apiKey),
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : 'missing',
      envTemplateIdRaw,
      requestTemplateId: templateId ?? null,
      resolvedTemplateId,
    });
    
    if (!apiKey) {
      console.error('BREVO_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    if (!Number.isInteger(resolvedTemplateId) || resolvedTemplateId <= 0) {
      console.error('BREVO_REGISTRATION_TEMPLATE_ID is not configured or invalid');
      return NextResponse.json(
        { error: 'Email template is not configured' },
        { status: 500 }
      );
    }

    // Send email via BREVO API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        templateId: resolvedTemplateId,
        to: [{ email }],
        ...(params && { params }),
      }),
    });

    const data = await response.json();

    // Check if BREVO API returned an error
    if (!response.ok) {
      console.error('BREVO API error:', data);
      return NextResponse.json(
        { error: 'Failed to send email', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405 }
  );
}

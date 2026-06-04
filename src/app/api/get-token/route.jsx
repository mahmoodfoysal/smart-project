import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Note: To truly verify a Firebase token securely on the backend, 
    // you should install and configure the 'firebase-admin' SDK.
    // Example:
    // const decodedToken = await admin.auth().verifyIdToken(token);
    
    // For now, we simulate a successful token check
    return NextResponse.json({ 
      valid: true, 
      message: 'Token received and formatted correctly',
      tokenPreview: token.substring(0, 15) + '...'
    }, { status: 200 });

  } catch (error) {
    console.error("Token check error:", error);
    return NextResponse.json(
      { valid: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return NextResponse.json({ message: "Method not allowed. Use POST to send token." }, { status: 405 });
}

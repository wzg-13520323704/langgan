export async function onRequestGet(context) {
  const { env } = context;

  return new Response(JSON.stringify({
    clientId: env.PAYPAL_CLIENT_ID || '',
    mode: env.PAYPAL_MODE || 'sandbox'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
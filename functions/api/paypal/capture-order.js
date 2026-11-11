export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return jsonResponse(400, { error: '缺少订单 ID' });
    }

    const accessToken = await getPayPalAccessToken(env);

    const baseUrl = env.PAYPAL_MODE === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('PayPal capture order error:', errText);
      return jsonResponse(500, { error: '扣款失败，请稍后重试或联系客服' });
    }

    const captureData = await response.json();

    const capturedAmount = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0.00';

    return jsonResponse(200, {
      success: true,
      orderId,
      captureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      status: captureData.status,
      amount: capturedAmount,
      message: '支付成功！感谢您的订单。'
    });

  } catch (err) {
    console.error('Capture order API error:', err);
    return jsonResponse(500, { error: '服务器错误，请稍后重试' });
  }
}

async function getPayPalAccessToken(env) {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  const baseUrl = env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`获取 PayPal Token 失败: ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
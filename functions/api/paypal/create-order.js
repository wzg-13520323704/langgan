export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return jsonResponse(400, { error: '购物车不能为空' });
    }

    const accessToken = await getPayPalAccessToken(env);

    const totalValue = items
      .reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0)
      .toFixed(2);

    const purchaseUnits = items.map((item) => {
      const unitPrice = parseFloat(item.price).toFixed(2);
      const qty = item.quantity || 1;
      return {
        reference_id: item.sku || item.id || `ITEM-${Date.now()}`,
        description: item.name || '琅玕工坊商品',
        amount: {
          currency_code: item.currency || 'USD',
          value: (parseFloat(unitPrice) * qty).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: item.currency || 'USD',
              value: (parseFloat(unitPrice) * qty).toFixed(2)
            }
          }
        },
        items: [
          {
            name: item.name || '木作精品',
            unit_amount: {
              currency_code: item.currency || 'USD',
              value: unitPrice
            },
            quantity: String(qty),
            category: 'PHYSICAL_GOODS'
          }
        ]
      };
    });

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: purchaseUnits
    };

    const baseUrl = env.PAYPAL_MODE === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('PayPal create order error:', errText);
      return jsonResponse(500, { error: '创建订单失败: ' + errText.substring(0, 300) });
    }

    const order = await response.json();
    return jsonResponse(200, {
      id: order.id,
      status: order.status,
      total: totalValue
    });

  } catch (err) {
    console.error('Create order API error:', err);
    return jsonResponse(500, { error: err.message || String(err) });
  }
}

async function getPayPalAccessToken(env) {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('凭据缺失: clientId=' + !!clientId + ' secret=' + !!clientSecret);
  }

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
    throw new Error(`获取Token失败(HTTP ${response.status}): ${errText.substring(0, 300)}`);
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
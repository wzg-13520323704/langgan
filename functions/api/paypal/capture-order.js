// functions/api/paypal/capture-order.js
// 作用：用户支付成功后，后端向PayPal确认并捕获资金，写入D1数据库，通知客服

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { orderID } = await request.json();

    if (!orderID) {
      return new Response(
        JSON.stringify({ error: '缺少订单ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getPayPalAccessToken(env);

    const url = env.PAYPAL_MODE === 'live'
      ? `https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`
      : `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`;

    const paypalResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await paypalResponse.json();

    if (!paypalResponse.ok) {
      throw new Error(data.message || 'PayPal捕获订单失败');
    }

    // ========== 写入D1数据库 ==========
    if (env.DB && data.status === 'COMPLETED') {
      const purchase = data.purchase_units[0];
      const payer = data.payer || {};

      await env.DB.prepare(
        `INSERT INTO orders (
          order_id, product_id, product_name, amount, currency,
          buyer_email, buyer_name, status, captured_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'captured', datetime('now'))`
      ).bind(
        orderID,
        purchase.reference_id || '',
        purchase.description || '',
        purchase.amount?.value || '0.00',
        purchase.amount?.currency_code || 'USD',
        payer.email_address || '',
        payer.name?.given_name ? `${payer.name.given_name} ${payer.name.surname || ''}` : ''
      ).run();
    }

    // ========== 发送客服邮件通知（复用你现有的邮件逻辑） ==========
    // 如果配置了NOTIFY_EMAIL，发一封通知邮件（与contact.js类似，简化版）
    if (env.NOTIFY_EMAIL && data.status === 'COMPLETED') {
      try {
        await sendOrderNotification(env, data);
      } catch (emailErr) {
        console.error('邮件通知发送失败（不影响支付）:', emailErr);
      }
    }

    // 返回PayPal原始结果给前端
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Capture order error:', error);
    return new Response(
      JSON.stringify({ error: error.message || '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ---------- 辅助函数：获取PayPal Access Token（同create-order） ----------
async function getPayPalAccessToken(env) {
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`);
  const url = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com/v1/oauth2/token'
    : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || '获取PayPal令牌失败');
  }
  return data.access_token;
}

// ---------- 辅助函数：发送客服邮件通知（可选） ----------
async function sendOrderNotification(env, paypalData) {
  const purchase = paypalData.purchase_units[0];
  const payer = paypalData.payer || {};

  const subject = `[新订单] ${purchase.description} - $${purchase.amount.value}`;
  const body = `
    新订单已支付成功！
    ---------------------------------
    商品：${purchase.description}
    金额：$${purchase.amount.value} ${purchase.amount.currency_code}
    买家：${payer.name?.given_name || ''} ${payer.name?.surname || ''}
    邮箱：${payer.email_address || ''}
    PayPal订单号：${paypalData.id}
    支付时间：${paypalData.create_time}
    ---------------------------------
    请主动联系客户确认收货地址，并发送运费账单。
  `;

  // 如果你有Resend或MailChannels密钥，复用contact.js的邮件发送方式
  // 这里提供最简方案：通过MailChannels（你已有的）
  if (env.MAILCHANNELS_API_KEY) {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.MAILCHANNELS_API_KEY,
      },
      body: JSON.stringify({
        from: { email: 'order@langganwooden.com', name: '琅玕工坊订单' },
        to: [{ email: env.NOTIFY_EMAIL }],
        subject: subject,
        text: body,
      }),
    });
  } else {
    // 如果没配邮件API，只打印日志（可在Cloudflare仪表盘查看）
    console.log('订单通知:', body);
  }
}
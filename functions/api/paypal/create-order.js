// functions/api/paypal/create-order.js
// 作用：根据商品ID，后端查询价格，向PayPal创建订单，返回orderID给前端

export async function onRequest(context) {
  const { request, env } = context;

  // 处理 CORS 预检请求
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
    const { productId } = await request.json();

    // ========== 🔐 安全核心：所有商品价格写在后端，严禁前端传价 ==========
    // 请根据你网站上的实际产品，维护这个字典（后续可从D1读取）
    const PRODUCTS = {
      '001': { name: '逐光鹿', price: '19.00' },
      '002': { name: '纸巾立挂', price: '25.00' },
      '003': { name: '精雕花鸟梳', price: '68.00' },
      '004': { name: '原木装饰镜', price: '58.00' },
      '005': { name: '羊角木梳', price: '99.00' },
      '006': { name: '木制餐碗', price: '35.00' },
      '007': { name: '萌趣木雕', price: '89.00' },
      '008': { name: '足球木雕', price: '180.00' },
      '009': { name: '红木茶铲', price: '45.00' },
      '010': { name: '竹节笔筒', price: '76.00' },
      '011': { name: '实木花架', price: '128.00' },
      '012': { name: '猫头鹰木雕', price: '96.00' },
    };

    const product = PRODUCTS[productId];
    if (!product) {
      return new Response(
        JSON.stringify({ error: '商品不存在或未配置' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 获取PayPal访问令牌
    const accessToken = await getPayPalAccessToken(env);

    // 向PayPal创建订单
    const paypalResponse = await fetch(
      env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com/v2/checkout/orders'
        : 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: productId,
            description: product.name,
            amount: {
              currency_code: 'USD',
              value: product.price,
            },
          }],
          application_context: {
            shipping_preference: 'NO_SHIPPING', // 运费另计，页面已注明
          },
        }),
      }
    );

    const data = await paypalResponse.json();

    if (!paypalResponse.ok) {
      throw new Error(data.message || 'PayPal创建订单失败');
    }

    // 只返回orderID给前端
    return new Response(
      JSON.stringify({ orderID: data.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Create order error:', error);
    return new Response(
      JSON.stringify({ error: error.message || '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ---------- 辅助函数：获取PayPal Access Token ----------
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
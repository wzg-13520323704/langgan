export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !name.trim()) {
      return jsonResponse(400, { success: false, error: '请输入您的姓名' });
    }
    if (!email || !email.trim()) {
      return jsonResponse(400, { success: false, error: '请输入您的邮箱' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse(400, { success: false, error: '请输入有效的邮箱地址' });
    }
    if (!message || !message.trim()) {
      return jsonResponse(400, { success: false, error: '请输入留言内容' });
    }

    const cleanName = name.trim().slice(0, 100);
    const cleanEmail = email.trim().slice(0, 200);
    const cleanPhone = (phone || '').trim().slice(0, 30);
    const cleanSubject = (subject || '').trim().slice(0, 200);
    const cleanMessage = message.trim().slice(0, 5000);

    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO contacts (name, email, phone, subject, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, '待处理', datetime('now'))`
        ).bind(cleanName, cleanEmail, cleanPhone, cleanSubject, cleanMessage).run();
      } catch (dbErr) {
        console.error('D1 insert error:', dbErr);
      }
    }

    const recipientEmail = env.NOTIFY_EMAIL || '2128836803@qq.com';

    if (env.RESEND_API_KEY) {
      try {
        await sendEmailViaResend(env.RESEND_API_KEY, recipientEmail, {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          subject: cleanSubject,
          message: cleanMessage
        });
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
      }
    } else if (env.MAILCHANNELS_API_KEY) {
      try {
        await sendEmailViaMailChannels(env.MAILCHANNELS_API_KEY, recipientEmail, {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          subject: cleanSubject,
          message: cleanMessage
        });
      } catch (emailErr) {
        console.error('MailChannels send error:', emailErr);
      }
    }

    return jsonResponse(200, { success: true, message: '消息已发送成功，我们会尽快回复您！' });

  } catch (err) {
    console.error('Contact API error:', err);
    return jsonResponse(500, { success: false, error: '服务器错误，请稍后重试' });
  }
}

async function sendEmailViaResend(apiKey, toEmail, data) {
  const emailSubject = data.subject
    ? `[琅玕工坊] ${data.subject} - 来自 ${data.name}`
    : `[琅玕工坊] 新留言 - 来自 ${data.name}`;

  const htmlBody = `
    <div style="font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0d6efd, #0a58ca); padding: 30px; text-align: center;">
        <h2 style="color: #fff; margin: 0; font-size: 22px;">琅玕工坊 · 新留言通知</h2>
      </div>
      <div style="padding: 30px; background: #fff;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #333; width: 80px;">姓名</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; color: #555;">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #333;">邮箱</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; color: #555;">
              <a href="mailto:${escapeHtml(data.email)}" style="color: #0d6efd;">${escapeHtml(data.email)}</a>
            </td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #333;">电话</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; color: #555;">${escapeHtml(data.phone)}</td>
          </tr>` : ''}
          ${data.subject ? `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-weight: 600; color: #333;">主题</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #eee; color: #555;">${escapeHtml(data.subject)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 12px 16px; font-weight: 600; color: #333; vertical-align: top;">留言</td>
            <td style="padding: 12px 16px; color: #555; line-height: 1.8; white-space: pre-wrap;">${escapeHtml(data.message)}</td>
          </tr>
        </table>
      </div>
      <div style="padding: 20px 30px; background: #f8f9fa; text-align: center; font-size: 12px; color: #999;">
        此邮件由琅玕工坊官网自动发送，请勿直接回复。
      </div>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: '琅玕工坊 <noreply@langganwooden.com>',
      to: [toEmail],
      subject: emailSubject,
      html: htmlBody
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errText}`);
  }
}

async function sendEmailViaMailChannels(apiKey, toEmail, data) {
  const emailSubject = data.subject
    ? `[琅玕工坊] ${data.subject} - 来自 ${data.name}`
    : `[琅玕工坊] 新留言 - 来自 ${data.name}`;

  const plainBody = `姓名：${data.name}\n邮箱：${data.email}\n电话：${data.phone || '未填写'}\n主题：${data.subject || '无'}\n留言：\n${data.message}\n\n---\n此邮件由琅玕工坊官网自动发送`;

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      from: { email: 'noreply@langganwooden.com', name: '琅玕工坊' },
      to: [{ email: toEmail }],
      subject: emailSubject,
      text: plainBody
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`MailChannels API error: ${response.status} - ${errText}`);
  }
}

function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, function (c) { return map[c]; });
}

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
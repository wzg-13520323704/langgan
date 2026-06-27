// 联系表单处理
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var name = document.getElementById('name').value.trim();
        var email = document.getElementById('email').value.trim();
        var phone = document.getElementById('phone').value.trim();
        var subject = document.getElementById('subject').value.trim();
        var message = document.getElementById('message').value.trim();

        if (!name || !email || !message) {
            showToast('请填写姓名、邮箱和留言内容', 'warning');
            return;
        }

        var msg = {
            id: Date.now(),
            name: name,
            email: email,
            phone: phone,
            subject: subject,
            message: message,
            status: '待处理',
            createdAt: new Date().toISOString()
        };

        var messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        messages.push(msg);
        localStorage.setItem('contactMessages', JSON.stringify(messages));

        form.reset();
        showToast('消息已发送成功，我们会尽快回复您！', 'success');
    });
});

function showToast(text, type) {
    var existing = document.querySelector('.custom-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'custom-toast custom-toast-' + type;
    toast.textContent = text;
    toast.style.cssText =
        'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 24px;' +
        'border-radius:10px;color:#fff;font-weight:600;font-size:15px;' +
        'box-shadow:0 8px 30px rgba(0,0,0,0.2);animation:slideIn 0.3s ease;' +
        'max-width:380px;';

    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #198754, #20c997)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #ffc107, #fd7e14)';
    }

    document.body.appendChild(toast);

    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
}

var style = document.createElement('style');
style.textContent =
    '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
document.head.appendChild(style);
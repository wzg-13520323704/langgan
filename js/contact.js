// 联系表单处理
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var submitBtn = form.querySelector('.btn-submit');
    if (!submitBtn) return;

    var btnText = submitBtn.querySelector('.btn-text');
    var btnLoading = submitBtn.querySelector('.btn-loading');

    function setLoading(loading) {
        if (loading) {
            submitBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';
        } else {
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    function showFieldError(field, message) {
        field.classList.add('is-invalid');
        var existing = field.parentNode.querySelector('.invalid-feedback');
        if (existing) existing.remove();
        var feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = message;
        field.parentNode.appendChild(feedback);
    }

    function clearFieldError(field) {
        field.classList.remove('is-invalid');
        var existing = field.parentNode.querySelector('.invalid-feedback');
        if (existing) existing.remove();
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var nameField = document.getElementById('name');
        var emailField = document.getElementById('email');
        var phoneField = document.getElementById('phone');
        var subjectField = document.getElementById('subject');
        var messageField = document.getElementById('message');

        var name = nameField.value.trim();
        var email = emailField.value.trim();
        var phone = phoneField.value.trim();
        var subject = subjectField.value.trim();
        var message = messageField.value.trim();

        [nameField, emailField, phoneField, subjectField, messageField].forEach(clearFieldError);

        var hasError = false;

        if (!name) {
            showFieldError(nameField, getI18n('formNameRequired') || '请输入您的姓名');
            hasError = true;
        }

        if (!email) {
            showFieldError(emailField, getI18n('formEmailRequired') || '请输入您的邮箱');
            hasError = true;
        } else if (!validateEmail(email)) {
            showFieldError(emailField, getI18n('formEmailInvalid') || '请输入有效的邮箱地址');
            hasError = true;
        }

        if (!message) {
            showFieldError(messageField, getI18n('formMessageRequired') || '请输入留言内容');
            hasError = true;
        }

        if (hasError) return;

        submitForm({
            name: name,
            email: email,
            phone: phone,
            subject: subject,
            message: message
        });
    });

    [document.getElementById('name'), document.getElementById('email'), document.getElementById('message')].forEach(function (field) {
        if (field) {
            field.addEventListener('input', function () {
                clearFieldError(field);
            });
        }
    });

    async function submitForm(data) {
        setLoading(true);

        try {
            var response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            var result = await response.json();

            if (result.success) {
                form.reset();
                showToast(getI18n('formSuccess') || '消息已发送成功，我们会尽快回复您！', 'success');
            } else {
                showToast(result.error || (getI18n('formError') || '提交失败，请稍后重试'), 'warning');
            }
        } catch (err) {
            showToast(getI18n('formNetworkError') || '网络错误，请稍后重试', 'warning');
        } finally {
            setLoading(false);
        }
    }

    function getI18n(key) {
        var el = document.querySelector('[data-i18n="' + key + '"]');
        if (el && el.textContent) return el.textContent;
        return null;
    }
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
// 导航栏滚动阴�?
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// 返回顶部按钮
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', function () {
    if (window.scrollY > 600) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        if (this.classList.contains('wechat-btn')) return;
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // 关闭移动端导航菜单
            var navMenu = document.getElementById('navMenu');
            var bsCollapse = bootstrap.Collapse.getInstance(navMenu);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        }
    });
});

// 滚动时更新导航高�?
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

window.addEventListener('scroll', function () {
    let current = '';
    sections.forEach(function (section) {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(function (link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// 微信按钮：PC 端弹出二维码，手机端也弹出二维码（微信无法直接 deep link 到联系人）
(function () {
    var wechatBtns = document.querySelectorAll('.wechat-btn');
    var modal = document.getElementById('wechatModal');
    var modalClose = document.getElementById('wechatModalClose');
    var modalName = document.getElementById('wechatModalName');
    var modalId = document.getElementById('wechatModalId');
    var modalQr = document.getElementById('wechatModalQr');
    var modalDownload = document.getElementById('wechatModalDownload');

    if (!wechatBtns.length || !modal) return;

    function isMobile() {
        return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints > 0 && window.innerWidth < 992);
    }

    wechatBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var wechatId = this.getAttribute('data-wechat');

            var card = this.closest('.contact-card');
            var name = card ? card.querySelector('.contact-card-name').textContent : '';

            modalName.textContent = name;
            modalId.textContent = '微信号：' + wechatId;
            var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(wechatId);
            modalQr.src = qrUrl;
            modalDownload.href = qrUrl;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
})();
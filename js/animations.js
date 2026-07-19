(function () {
    var observerOptions = { threshold: 0.12, rootMargin: '0px 0px -30px 0px' };

    // ========== 滚动触发入场动画（支持所有 reveal 变体） ==========
    var revealSelectors = ['.reveal', '.reveal-scale', '.reveal-left', '.reveal-right'];
    var allRevealEls = [];

    revealSelectors.forEach(function (sel) {
        var els = document.querySelectorAll(sel);
        els.forEach(function (el) { allRevealEls.push(el); });
    });

    if (allRevealEls.length && 'IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        allRevealEls.forEach(function (el) {
            revealObserver.observe(el);
        });

        // 页面加载后立即检查：已在视口内的元素直接显示
        setTimeout(function () {
            allRevealEls.forEach(function (el) {
                var rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('revealed');
                    revealObserver.unobserve(el);
                }
            });
        }, 100);
    } else {
        // Fallback：直接全部显示
        allRevealEls.forEach(function (el) {
            el.classList.add('revealed');
        });
    }

    // ========== 数字计数器动画 ==========
    var statNumbers = document.querySelectorAll('.stat-number[data-count]');
    var counted = {};
    var duration = 2000;

    function animateCounter(el) {
        var key = el.getAttribute('data-count');
        if (counted[key]) return;
        counted[key] = true;

        var target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;

        // 从原始文本中提取后缀
        var originalText = el.textContent.trim();
        var suffix = '';
        var match = originalText.match(/[\d,.]+(.*)/);
        if (match && match[1]) {
            suffix = match[1];
        }

        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            var current = Math.floor(eased * target);
            el.textContent = current + suffix;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(step);
    }

    if (statNumbers.length && 'IntersectionObserver' in window) {
        var counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        statNumbers.forEach(function (el) {
            counterObserver.observe(el);
        });

        // 立即检查已在视口内的计数器
        setTimeout(function () {
            statNumbers.forEach(function (el) {
                var rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    animateCounter(el);
                    counterObserver.unobserve(el);
                }
            });
        }, 150);
    } else {
        statNumbers.forEach(function (el) {
            animateCounter(el);
        });
    }

    // ========== X形双斜线：顺时针展示 + 逆时针消失 ==========
    var scrollSection = document.querySelector('.scroll-cards-section');
    var centerCard = document.querySelector('.sc-card-center');
    var cornerCards = document.querySelectorAll('.sc-card[data-corner]');

    // 四角顺序：tl → tr → br → bl
    var cornerOrder = ['tl', 'tr', 'br', 'bl'];

    if (scrollSection && cornerCards.length) {
        var cardTicking = false;

        function updateCards() {
            var sectionRect = scrollSection.getBoundingClientRect();
            var sectionTop = sectionRect.top;
            var sectionHeight = sectionRect.height;
            var viewportHeight = window.innerHeight;

            // 滚动进度：0 → 1
            var progress = Math.max(0, Math.min(1, -sectionTop / (sectionHeight - viewportHeight)));

            // 四个角的处理：每个角占 20% 进度
            cornerOrder.forEach(function (corner, ci) {
                var cornerStart = ci * 0.2;
                var cornerEnd = (ci + 1) * 0.2;

                var cardsInCorner = document.querySelectorAll('.sc-card[data-corner="' + corner + '"]');
                var cardsArray = Array.prototype.slice.call(cardsInCorner);
                var cardCount = cardsArray.length;

                // 只有 BL 角：idx 1 先出现，idx 0 后出现（反转顺序）
                if (corner === 'bl') {
                    cardsArray.reverse();
                }

                cardsArray.forEach(function (card, idx) {
                    var cardThreshold = cornerStart + (idx + 1) * (0.2 / cardCount);

                    if (progress >= cardThreshold) {
                        card.classList.add('visible');
                    } else {
                        card.classList.remove('visible');
                    }
                });
            });

            // 中间主图：75%-100%
            if (centerCard) {
                if (progress >= 0.75) {
                    centerCard.classList.add('visible');
                    var centerProgress = (progress - 0.75) / 0.25;
                    if (centerProgress >= 0.6) {
                        centerCard.classList.add('fullscreen');
                    } else {
                        centerCard.classList.remove('fullscreen');
                    }
                } else {
                    centerCard.classList.remove('visible');
                    centerCard.classList.remove('fullscreen');
                }
            }
        }

        window.addEventListener('scroll', function () {
            if (!cardTicking) {
                requestAnimationFrame(function () {
                    updateCards();
                    cardTicking = false;
                });
                cardTicking = true;
            }
        });

        updateCards();
    }

    // ========== 通用视差滚动效果 ==========
    var parallaxElements = document.querySelectorAll('.parallax');
    if (parallaxElements.length) {
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    parallaxElements.forEach(function (el) {
                        var speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.15;
                        var rect = el.getBoundingClientRect();
                        var scrolled = window.scrollY;
                        var offset = rect.top + scrolled;
                        var yPos = (scrolled - offset) * speed;
                        el.style.transform = 'translateY(' + yPos + 'px)';
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ========== 图片悬浮放大效果 ==========
    var zoomImages = document.querySelectorAll('.zoom-img');
    zoomImages.forEach(function (img) {
        img.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.05)';
        });
        img.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1)';
        });
    });

    // ========== 特性展示卡片悬浮上浮 ==========
    var featureCards = document.querySelectorAll('.feature-showcase');
    featureCards.forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 20px 50px rgba(0,0,0,0.08)';
        });
        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // ========== 导航栏动态透明度 ==========
    var navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function () {
            var scrollY = window.scrollY;
            var maxScroll = 400;
            var opacity = Math.min(0.98, 0.85 + (scrollY / maxScroll) * 0.13);
            navbar.style.background = 'rgba(255, 255, 255, ' + opacity + ')';
        });
    }

    // ========== 产品卡片3D悬浮效果 ==========
    var productCards = document.querySelectorAll('.product-card');
    productCards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = this.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;
            var rotateX = (y - centerY) / centerY * -5;
            var rotateY = (x - centerX) / centerX * 5;
            this.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-8px)';
            this.style.boxShadow = '0 20px 50px rgba(0,0,0,0.12)';
        });
        card.addEventListener('mouseleave', function () {
            this.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
            this.style.boxShadow = '';
        });
    });

    // ========== 滚动进度条 ==========
    var progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--primary),var(--accent));z-index:9999;transition:width 0.1s linear;border-radius:0 2px 2px 0;pointer-events:none;';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function () {
        var winScroll = document.documentElement.scrollTop;
        var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (height <= 0) return;
        var scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });

})();
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
        // 通过 UA 检测是否为移动设备，或者支持触摸且屏幕宽度小于 992px
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

            var qrImg = this.getAttribute('data-wechat-qr');
            var qrUrl = qrImg || 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(wechatId);
            modalQr.src = qrUrl;
            modalDownload.href = qrUrl;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        // 移除弹窗的显示状态
        modal.classList.remove('active');
        // 恢复页面滚动
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

// ==================== 产品筛选功能 ====================
(function () {
    var currentFilter = 'all';
    var filterTagsContainer = document.querySelector('.filter-tags');
    var categoryCardsContainer = document.querySelector('.category-shortcuts');

    function applyFilter(category) {
        currentFilter = category;
        var productItems = document.querySelectorAll('.product-item');
        var filterTags = document.querySelectorAll('.filter-tag');
        var categoryCards = document.querySelectorAll('.category-card');
        var filterCount = document.getElementById('filterCount');
        var noResult = document.getElementById('noResult');
        var visibleCount = 0;

        productItems.forEach(function (item) {
            var itemCategory = item.getAttribute('data-category');
            if (category === 'all' || itemCategory === category) {
                item.classList.remove('filter-hiding');
                item.classList.add('filter-showing');
                item.style.display = '';
                visibleCount++;
            } else {
                item.classList.add('filter-hiding');
                item.classList.remove('filter-showing');
                setTimeout(function () {
                    if (item.classList.contains('filter-hiding')) {
                        item.style.display = 'none';
                    }
                }, 300);
            }
        });

        if (filterCount) {
            var countText = '共 ' + visibleCount + ' 件产品';
            if (typeof i18n !== 'undefined' && typeof currentLang !== 'undefined' && i18n[currentLang] && i18n[currentLang].filterCountText) {
                countText = i18n[currentLang].filterCountText.replace('{count}', visibleCount);
            }
            filterCount.textContent = countText;
        }

        if (noResult) {
            noResult.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        filterTags.forEach(function (tag) {
            var tagFilter = tag.getAttribute('data-filter');
            if (tagFilter === category) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });

        categoryCards.forEach(function (card) {
            var cardCategory = card.getAttribute('data-category');
            if (cardCategory === category) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    // Use event delegation on the containers instead of individual buttons
    if (filterTagsContainer) {
        filterTagsContainer.addEventListener('click', function (e) {
            var tag = e.target.closest('.filter-tag');
            if (!tag) return;
            var category = tag.getAttribute('data-filter');
            applyFilter(category);

            var productsSection = document.getElementById('products');
            if (productsSection) {
                var top = productsSection.getBoundingClientRect().top + window.pageYOffset - 140;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }

    if (categoryCardsContainer) {
        categoryCardsContainer.addEventListener('click', function (e) {
            var card = e.target.closest('.category-card');
            if (!card) return;
            var category = card.getAttribute('data-category');
            applyFilter(category);

            var filterBar = document.querySelector('.filter-bar-wrapper');
            if (filterBar) {
                var top = filterBar.getBoundingClientRect().top + window.pageYOffset - 10;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    }

    // Expose for external use (i18n re-render, etc.)
    window.rebindProductFilters = function () {
        applyFilter(currentFilter);
    };
})();

// ==================== Quick View 快速预览 ====================
(function () {
    var overlay = document.getElementById('quickViewOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'quickViewOverlay';
        overlay.className = 'quick-view-overlay';
        overlay.innerHTML = '<div class="quick-view-modal"><button class="quick-view-close">&times;</button><div class="quick-view-body" id="quickViewBody"></div></div>';
        document.body.appendChild(overlay);
    }

    var qvBody = document.getElementById('quickViewBody');
    var qvClose = overlay.querySelector('.quick-view-close');

    function closeQV() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    qvClose.addEventListener('click', closeQV);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeQV();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeQV();
    });

    function openQuickView(product) {
        var lang = (typeof currentLang !== 'undefined') ? currentLang : 'zh';
        var catName = (typeof getCatName === 'function') ? getCatName(product.category) : product.category;
        var oldPriceHtml = product.oldPrice ? '<span class="old-price">¥' + product.oldPrice + '</span>' : '';

        qvBody.innerHTML =
            '<div class="quick-view-img"><img src="' + product.image + '" alt="' + product.name[lang] + '"></div>' +
            '<div class="quick-view-info">' +
            '<div class="qv-category">' + catName + '</div>' +
            '<h3 class="qv-title">' + product.name[lang] + '</h3>' +
            '<p class="qv-desc">' + product.desc[lang] + '</p>' +
            '<div class="qv-price">¥' + product.price + oldPriceHtml + '</div>' +
            '<div class="qv-actions">' +
            '<a href="product-detail.html?id=' + product.id + '" class="btn btn-primary rounded-pill px-4">' + (lang === 'en' ? 'View Details' : '查看详情') + '</a>' +
            '<a href="inquiry.html?id=' + product.id + '&name=' + encodeURIComponent(product.name[lang]) + '&price=' + product.price + '&image=' + encodeURIComponent(product.image) + '" class="btn btn-success rounded-pill px-4"><i class="bi bi-chat-dots me-1"></i>' + (lang === 'en' ? 'Contact to Buy' : '联系购买') + '</a>' +
            '</div></div>';

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.quick-view-btn');
        if (!btn) return;
        e.preventDefault();
        var id = btn.getAttribute('data-id');
        if (typeof PRODUCTS === 'undefined') return;
        for (var i = 0; i < PRODUCTS.length; i++) {
            if (PRODUCTS[i].id === id) {
                openQuickView(PRODUCTS[i]);
                break;
            }
        }
    });
})();

// ==================== Wishlist 心愿单 ====================
(function () {
    function getWishlist() {
        try {
            return JSON.parse(localStorage.getItem('wishlist') || '[]');
        } catch (e) { return []; }
    }
    function saveWishlist(list) {
        localStorage.setItem('wishlist', JSON.stringify(list));
    }

    function updateWishlistUI() {
        var wishlist = getWishlist();
        var btns = document.querySelectorAll('.wishlist-btn');
        btns.forEach(function (btn) {
            var pid = btn.getAttribute('data-id');
            if (wishlist.indexOf(pid) > -1) {
                btn.classList.add('wishlisted');
            } else {
                btn.classList.remove('wishlisted');
            }
        });
    }

    function toggleWishlist(pid) {
        var wishlist = getWishlist();
        var idx = wishlist.indexOf(pid);
        if (idx > -1) {
            wishlist.splice(idx, 1);
        } else {
            wishlist.push(pid);
        }
        saveWishlist(wishlist);
        updateWishlistUI();
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.wishlist-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(btn.getAttribute('data-id'));
    });

    updateWishlistUI();
})();

// ==================== Sticky Add to Cart 底部栏 ====================
(function () {
    var stickyBar = document.getElementById('stickyCartBar');
    if (!stickyBar) return;

    var detailSection = document.querySelector('.detail-section');
    if (!detailSection) return;

    var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
            stickyBar.classList.remove('show');
        } else {
            stickyBar.classList.add('show');
        }
    }, { threshold: 0 });

    observer.observe(detailSection);
})();
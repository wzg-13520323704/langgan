// ==================== 产品渲染引擎 ====================
// 从 PRODUCTS 数据自动生成 HTML，无需手动写产品卡片

function getLang() {
  return (typeof currentLang !== 'undefined') ? currentLang : 'zh';
}

function getCatName(catZh) {
  var lang = getLang();
  if (lang === 'en' && PRODUCT_CATEGORIES[catZh]) return PRODUCT_CATEGORIES[catZh].en;
  return catZh;
}

function getTagName(tagZh) {
  if (!tagZh) return '';
  var lang = getLang();
  if (lang === 'en' && PRODUCT_TAGS[tagZh]) return PRODUCT_TAGS[tagZh].en;
  return tagZh;
}

function getCatIcon(catZh) {
  if (PRODUCT_CATEGORIES[catZh]) return PRODUCT_CATEGORIES[catZh].icon;
  return 'bi-box-seam';
}

function buildStarHTML(rating) {
  var html = '';
  var full = Math.floor(rating);
  var half = (rating - full) >= 0.3 ? 1 : 0;
  var empty = 5 - full - half;
  for (var i = 0; i < full; i++) html += '<i class="bi bi-star-fill"></i>\n';
  if (half) html += '<i class="bi bi-star-half"></i>\n';
  for (var i = 0; i < empty; i++) html += '<i class="bi bi-star"></i>\n';
  html += '<span>(' + rating.toFixed(1) + ')</span>';
  return html;
}

function buildPriceHTML(price, oldPrice) {
  var html = '¥' + price;
  if (oldPrice) html += ' <span class="old-price">¥' + oldPrice + '</span>';
  return html;
}

function buildProductCard(p, index) {
  var lang = getLang();
  var tagHTML = p.tag ? '<span class="product-tag">' + getTagName(p.tag) + '</span>\n' : '';
  var delay = (index % 4) + 1; // 1-4 stagger for animations
  var metaHtml = '';
  var materials = getMaterialLabel(p.category);
  if (materials) {
    metaHtml += '<div class="product-meta-tags">';
    metaHtml += '<span class="product-meta-tag"><i class="bi bi-tree me-1"></i>' + materials[lang] + '</span>';
    var sizes = getSizeLabel(p.category);
    if (sizes) metaHtml += '<span class="product-meta-tag"><i class="bi bi-arrows-angle-expand me-1"></i>' + sizes[lang] + '</span>';
    metaHtml += '</div>';
  }
  return [
    '<div class="col-lg-3 col-md-6 product-item" data-category="' + p.category + '" data-id="' + p.id + '">',
    '  <div class="product-card">',
    '    <div class="product-img">',
    '      ' + tagHTML + '<img src="' + p.image + '" alt="' + p.name[lang] + '">',
    '      <button class="quick-view-btn" data-id="' + p.id + '"><i class="bi bi-eye me-1"></i>' + getI18n('quickView', '快速预览') + '</button>',
    '    </div>',
    '    <div class="product-body">',
    '      <div class="product-category">' + getCatName(p.category) + '</div>',
    '      <div class="product-title">' + p.name[lang] + '</div>',
    '      ' + metaHtml,
    '      <p class="product-desc">' + p.desc[lang] + '</p>',
    '      <div class="product-price">' + buildPriceHTML(p.price, p.oldPrice) + '</div>',
    '      <div class="product-footer">',
    '        <div class="product-rating">' + buildStarHTML(p.rating) + '</div>',
    '        <div style="display:flex;align-items:center;gap:8px;">',
    '          <button class="wishlist-btn" data-id="' + p.id + '" title="' + getI18n('addToWishlist', '加入心愿单') + '"><i class="bi bi-heart"></i></button>',
    '          <a href="product-detail.html?id=' + p.id + '" class="btn btn-sm btn-outline-primary rounded-pill">' + getI18n('viewDetail', '参观') + '</a>',
    '        </div>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');
}

var DEFAULT_SPECS = {
  '生活摆件': { material:{zh:'黄杨木/黑胡桃木',en:'Boxwood / Black Walnut'}, size:{zh:'约 15cm × 8cm × 20cm',en:'Approx. 15cm × 8cm × 20cm'} },
  '家具系列': { material:{zh:'橡木/榉木',en:'Oak / Beech'}, size:{zh:'约 30cm × 20cm × 40cm',en:'Approx. 30cm × 20cm × 40cm'} },
  '生活用品': { material:{zh:'榉木',en:'Beech'}, size:{zh:'约 10cm × 5cm × 15cm',en:'Approx. 10cm × 5cm × 15cm'} },
  '厨房用品': { material:{zh:'榉木',en:'Beech'}, size:{zh:'约 20cm × 15cm × 5cm',en:'Approx. 20cm × 15cm × 5cm'} },
  '茶道器具': { material:{zh:'红木/竹',en:'Rosewood / Bamboo'}, size:{zh:'约 10cm × 5cm × 5cm',en:'Approx. 10cm × 5cm × 5cm'} },
  '文房雅器': { material:{zh:'竹/黄杨木',en:'Bamboo / Boxwood'}, size:{zh:'约 10cm × 5cm × 8cm',en:'Approx. 10cm × 5cm × 8cm'} },
  '运动摆件': { material:{zh:'黄杨木',en:'Boxwood'}, size:{zh:'约 15cm × 10cm × 15cm',en:'Approx. 15cm × 10cm × 15cm'} }
};

function getMaterialLabel(cat) {
  if (DEFAULT_SPECS[cat]) return DEFAULT_SPECS[cat].material;
  return null;
}

function getSizeLabel(cat) {
  if (DEFAULT_SPECS[cat]) return DEFAULT_SPECS[cat].size;
  return null;
}

function getI18n(key, fallback) {
  if (typeof i18n !== 'undefined' && typeof currentLang !== 'undefined' && i18n[currentLang] && i18n[currentLang][key]) {
    return i18n[currentLang][key];
  }
  return fallback;
}

function renderProductGrid(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var html = '';
  for (var i = 0; i < PRODUCTS.length; i++) {
    html += buildProductCard(PRODUCTS[i], i);
  }
  container.innerHTML = html;
}

function renderFilterBar() {
  var container = document.querySelector('.filter-tags');
  if (!container) return;
  var lang = getLang();
  var html = '<button class="filter-tag active" data-filter="all">' + getI18n('filterAll', '全部') + '</button>\n';
  var cats = Object.keys(PRODUCT_CATEGORIES);
  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    var name = (lang === 'en') ? PRODUCT_CATEGORIES[cat].en : cat;
    html += '<button class="filter-tag" data-filter="' + cat + '">' + name + '</button>\n';
  }
  container.innerHTML = html;

  // Update count text
  updateFilterCount(PRODUCTS.length);
}

function updateFilterCount(count) {
  var el = document.getElementById('filterCount');
  if (!el) return;
  var text = getI18n('filterCountText', '共 {count} 件产品').replace('{count}', count);
  el.textContent = text;
}

function renderCategoryCards() {
  var container = document.querySelector('.category-shortcuts');
  if (!container) return;
  var lang = getLang();
  var cats = Object.keys(PRODUCT_CATEGORIES);
  // Collect sample images and counts per category
  var catData = {};
  for (var i = 0; i < cats.length; i++) {
    catData[cats[i]] = { count: 0, image: '' };
  }
  for (var i = 0; i < PRODUCTS.length; i++) {
    var c = PRODUCTS[i].category;
    if (catData[c]) {
      catData[c].count++;
      if (!catData[c].image) catData[c].image = PRODUCTS[i].image;
    }
  }

  var html = '';
  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    var d = catData[cat];
    var name = (lang === 'en') ? PRODUCT_CATEGORIES[cat].en : cat;
    var icon = PRODUCT_CATEGORIES[cat].icon;
    html += [
      '<div class="category-card" data-category="' + cat + '">',
      '  <div class="category-card-img">',
      '    <img src="' + d.image + '" alt="' + name + '">',
      '    <div class="category-card-overlay">',
      '      <i class="bi ' + icon + '"></i>',
      '      <span>' + name + '</span>',
      '      <small>' + d.count + ' ' + (lang === 'en' ? 'products' : '件产品') + '</small>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
    html += '\n';
  }
  container.innerHTML = html;
}

// Load homepage featured products (first 4 or specified indices)
function renderFeaturedProducts(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  if (typeof PRODUCTS === 'undefined' || !PRODUCTS.length) return;
  // Use first 4 products for homepage
  var featured = PRODUCTS.slice(0, 4);
  var html = '';
  for (var i = 0; i < featured.length; i++) {
    html += buildProductCard(featured[i], i).replace(
      'class="col-lg-3 col-md-6 product-item"',
      'class="col-lg-3 col-md-6 product-item reveal-scale reveal-delay-' + (i + 1) + '"'
    ) + '\n';
  }
  container.innerHTML = html;
}

// Full re-render for language switch
function reRenderAllProducts() {
  renderProductGrid('productGrid');
  renderFilterBar();
  renderCategoryCards();
  renderFeaturedProducts('featuredProductGrid');
  // Re-bind filter events after re-render
  if (typeof rebindProductFilters === 'function') rebindProductFilters();
  // Re-init reveal animations for newly created elements
  if (typeof window.initRevealAnimations === 'function') {
    setTimeout(function () { window.initRevealAnimations(); }, 50);
  }
}

// ========== HOMEPAGE: 4 featured products auto-load ==========
// Uses a MutationObserver to detect when the container is injected, then renders
(function initHomepageRenderer() {
  // If on homepage, try to render immediately
  var container = document.getElementById('featuredProductGrid');
  if (container) {
    renderFeaturedProducts('featuredProductGrid');
  }
})();

// ========== PRODUCTS PAGE: auto-render on load ==========
(function initProductsPageRenderer() {
  var grid = document.getElementById('productGrid');
  if (grid) {
    renderProductGrid('productGrid');
    renderFilterBar();
    renderCategoryCards();
  }
})();
/**
 * 检查当前页面是否为 TikTok 商品页
 * @returns {boolean} 是否为商品页
 */
export function checkIfTikTokProductPage() {
  // 常见的商品卡片选择器
  const shopIndicators = [
    '.tiktok-shop-card',
    '[data-e2e="product-card"]',
    '[data-e2e="tiktok-shop"]',
    '.product-card',
    '.product-item'
  ];
  for (let selector of shopIndicators) {
    if (document.querySelector(selector)) return true;
  }
  // 通过 URL 简单判断
  const url = window.location.href;
  return url.includes('/shop') || url.includes('product');
}

/**
 * 提取 TikTok 单个商品页面信息，支持轮播图图片提取
 * @returns {Object|null} 商品对象或 null
 */
export function extractTikTokSingleProductInfo() {
  try {
    // 多种标题选择器，兼容不同页面结构
    const titleSelectors = [
      'h1', '.product-title', '[data-e2e="product-title"]', '.product-name'
    ];
    let title = null;
    for (let selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        title = el.textContent.trim();
        break;
      }
    }
    if (!title) return null;

    // 多种价格选择器
    const priceSelectors = [
      '.price-w1xvrw span', '.price', '.product-price', '[data-e2e="product-price"]'
    ];
    let price = '价格不可用';
    for (let selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        price = el.textContent.trim();
        break;
      }
    }

    // 提取 slick 轮播图图片
    let images = [];
    let imageElements = [];
    const slickTrack = document.querySelector('.slick-list .slick-track');
    if (slickTrack) {
      const imgNodes = slickTrack.querySelectorAll('img');
      imgNodes.forEach(img => {
        let url = img.getAttribute('src') || img.getAttribute('data-src');
        if (url && url.startsWith('http') && !images.includes(url)) {
          images.push(url);
          imageElements.push({ url, outerHTML: img.outerHTML });
        }
      });
    }
    let image = images.length > 0 ? images[0] : null;

    // 卖家信息选择器
    const sellerSelectors = [
      '.seller-c27aRQ', '.seller-name', '.shop-name', '[data-e2e="seller-name"]'
    ];
    let seller = '未知卖家';
    for (let selector of sellerSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        seller = el.textContent.trim();
        break;
      }
    }

    return {
      name: title,
      price,
      image,
      images,
      imageElements,
      seller
    };
  } catch (e) {
    console.error("Error extracting single product info:", e);
    return null;
  }
}
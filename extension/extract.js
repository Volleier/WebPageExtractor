/**
 * 调试日志辅助函数，将调试信息输出到控制台并保存到 window 变量
 * @param {string} message 日志内容
 * @param {any} data 附加数据
 */
function debugLog(message, data) {
  const timestamp = new Date().toISOString();
  console.log(`[TikTok Extractor Debug ${timestamp}] ${message}`, data || "");
  if (!window._tikTokExtractorDebug) window._tikTokExtractorDebug = [];
  window._tikTokExtractorDebug.push({
    timestamp,
    message,
    data: JSON.stringify(data || {}),
  });
}

/**
 * 监听来自 popup 的消息，根据 action 分发到对应的提取逻辑
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  debugLog("收到消息", request);

  // 获取调试信息
  if (request.action === "getDebugInfo") {
    sendResponse({ debugInfo: window._tikTokExtractorDebug || [] });
    return true;
  }

  // 检查 TikTok 商品页
  if (request.action === "isProductPage") {
    const isProductPage = checkIfTikTokProductPage();
    debugLog("是否是商品页面检查结果", isProductPage);
    sendResponse({ isProductPage });
    return true;
  }

  // 提取 TikTok 商品信息
  if (request.action === "scrapeProducts") {
    const product = extractTikTokSingleProductInfo();
    if (product) {
      sendResponse({ success: true, products: [product] });
    } else {
      sendResponse({ success: false, products: [] });
    }
    return true;
  }

  // 提取 Shopee 商品信息
  if (request.action === "scrapeShopeeProducts") {
    try {
      const products = extractShopeeProducts();
      sendResponse({
        success: products.length > 0,
        products,
      });
    } catch (e) {
      sendResponse({
        success: false,
        error: e.message,
      });
    }
    return true;
  }

  // 检查 Shopee 商品页
  if (request.action === "isShopeeProductPage") {
    const isProductPage = checkIfShopeeProductPage();
    sendResponse({ isProductPage });
    return true;
  }

  return true;
});

// 导出调试信息方法，便于 popup 调用
window.getTikTokExtractorDebugInfo = function () {
  return window._tikTokExtractorDebug || [];
};

/**
 * =========================
 * TikTok 专属逻辑
 * =========================
 */

/**
 * 检查当前页面是否为 TikTok 商品页
 * @returns {boolean} 是否为商品页
 */
function checkIfTikTokProductPage() {
  // 常见的商品卡片选择器
  const shopIndicators = [
    ".tiktok-shop-card",
    '[data-e2e="product-card"]',
    '[data-e2e="tiktok-shop"]',
    ".product-card",
    ".product-item",
  ];
  for (let selector of shopIndicators) {
    if (document.querySelector(selector)) return true;
  }
  // 通过 URL 简单判断
  const url = window.location.href;
  return url.includes("/shop") || url.includes("product");
}

/**
 * 提取 TikTok 单个商品页面信息，支持轮播图图片提取
 * @returns {Object|null} 商品对象或 null
 */
function extractTikTokSingleProductInfo() {
  try {
    // 多种标题选择器，兼容不同页面结构
    const titleSelectors = [
      "h1",
      ".product-title",
      '[data-e2e="product-title"]',
      ".product-name",
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
      ".price-w1xvrw span",
      ".price",
      ".product-price",
      '[data-e2e="product-price"]',
    ];
    let price = "价格不可用";
    for (let selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        price = el.textContent.trim();
        break;
      }
    }

    // 提取 slick 轮播图图片
    let images = [];
    const slickTrack = document.querySelector(".slick-list .slick-track");
    if (slickTrack) {
      const imgNodes = slickTrack.querySelectorAll("img");
      imgNodes.forEach((img) => {
        let url = img.getAttribute("src") || img.getAttribute("data-src");
        if (url && url.startsWith("http") && !images.includes(url)) {
          images.push(url);
        }
      });
    }
    let image = images.length > 0 ? images[0] : null;

    // 卖家信息选择器
    const sellerSelectors = [
      ".seller-c27aRQ",
      ".seller-name",
      ".shop-name",
      '[data-e2e="seller-name"]',
    ];
    let seller = "未知卖家";
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
      seller,
    };
  } catch (e) {
    console.error("Error extracting single product info:", e);
    return null;
  }
}

/**
 * =========================
 * Shopee 专属逻辑
 * =========================
 */

/**
 * 检查当前页面是否为 Shopee 商品页或商品列表页
 * @returns {boolean} 是否为商品页
 */
function checkIfShopeeProductPage() {
  // 商品卡片选择器
  const productCardSelector = "div.flex.flex-col.bg-white.cursor-pointer";
  const cards = document.querySelectorAll(productCardSelector);
  const url = window.location.href;
  const isProductList = cards.length > 0;
  const isProductDetail = /shopee\..+\/product\//.test(url);
  return isProductList || isProductDetail;
}

/**
 * 提取 Shopee 商品信息（商品列表页）
 * @returns {Array} 商品对象数组
 */
function extractShopeeProducts() {
  const products = [];
  const cards = document.querySelectorAll(
    "div.flex.flex-col.bg-white.cursor-pointer"
  );
  cards.forEach((card) => {
    // 商品名
    let name = "";
    const nameDiv = card.querySelector(".line-clamp-2, .break-words");
    if (nameDiv) name = nameDiv.textContent.trim();

    // 价格
    let price = "";
    const priceSpan = card.querySelector(
      ".text-shopee-primary .text-base, .text-shopee-primary .font-medium.text-base\\/5"
    );
    if (priceSpan) {
      price = priceSpan.textContent.trim();
      const peso = card.querySelector(
        ".text-shopee-primary .text-xs, .text-shopee-primary .text-xs\\/sp14"
      );
      if (peso) price = peso.textContent.trim() + price;
    }

    // 图片
    let image = "";
    const img = card.querySelector('img[loading="lazy"], img.object-contain');
    if (img) image = img.src;

    // 已售数量
    let sold = "";
    const soldDiv = card.querySelector(".text-shopee-black87");
    if (soldDiv) sold = soldDiv.textContent.trim();

    products.push({
      name,
      price,
      image,
      sold,
    });
  });
  return products;
}

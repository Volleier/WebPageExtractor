import {
  checkIfTikTokProductPage,
  extractTikTokSingleProductInfo
} from './src/extract_TikTok.js';

import {
  checkIfShopeeProductPage,
  extractShopeeProducts
} from './src/extract_Shopee.js';

/**
 * 调试日志辅助函数，将调试信息输出到控制台并保存到 window 变量
 * @param {string} message 日志内容
 * @param {any} data 附加数据
 */
function debugLog(message, data) {
  const timestamp = new Date().toISOString();
  console.log(`[TikTok Extractor Debug ${timestamp}] ${message}`, data || '');
  if (!window._tikTokExtractorDebug) window._tikTokExtractorDebug = [];
  window._tikTokExtractorDebug.push({
    timestamp,
    message,
    data: JSON.stringify(data || {})
  });
}

/**
 * 监听来自 popup 的消息，根据 action 分发到对应的提取逻辑
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  debugLog('收到消息', request);

  // 获取调试信息
  if (request.action === "getDebugInfo") {
    sendResponse({debugInfo: window._tikTokExtractorDebug || []});
    return true;
  }

  // 检查 TikTok 商品页
  if (request.action === "isProductPage") {
    const isProductPage = checkIfTikTokProductPage();
    debugLog('是否是商品页面检查结果', isProductPage);
    sendResponse({isProductPage});
    return true;
  }

  // 提取 TikTok 商品信息
  if (request.action === "scrapeProducts") {
    const product = extractTikTokSingleProductInfo();
    if (product) {
      sendResponse({success: true, products: [product]});
    } else {
      sendResponse({success: false, products: []});
    }
    return true;
  }

  // 提取 Shopee 商品信息
  if (request.action === "scrapeShopeeProducts") {
    try {
      const products = extractShopeeProducts();
      sendResponse({
        success: products.length > 0,
        products
      });
    } catch (e) {
      sendResponse({
        success: false,
        error: e.message
      });
    }
    return true;
  }

  // 检查 Shopee 商品页
  if (request.action === "isShopeeProductPage") {
    const isProductPage = checkIfShopeeProductPage();
    sendResponse({isProductPage});
    return true;
  }

  return true;
});

// 导出调试信息方法，便于 popup 调用
window.getTikTokExtractorDebugInfo = function() {
  return window._tikTokExtractorDebug || [];
};
// content.js - 负责实际从TikTok页面提取商品信息

// 添加调试日志辅助函数
function debugLog(message, data) {
  const timestamp = new Date().toISOString();
  console.log(`[TikTok Extractor Debug ${timestamp}] ${message}`, data || '');
  
  // 保存调试信息以便发送到popup
  if (!window._tikTokExtractorDebug) {
    window._tikTokExtractorDebug = [];
  }
  window._tikTokExtractorDebug.push({
    timestamp,
    message,
    data: JSON.stringify(data || {})
  });
}

// 监听来自popup.js的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  debugLog('收到消息', request);
  
  if (request.action === "getDebugInfo") {
    sendResponse({debugInfo: window._tikTokExtractorDebug || []});
    return true;
  }
  
  if (request.action === "isProductPage") {
    // 检查当前页面是否是商品页面
    const isProductPage = checkIfTikTokProductPage();
    debugLog('是否是商品页面检查结果', isProductPage);
    sendResponse({isProductPage});
  } 
  else if (request.action === "scrapeProducts") {
    // 使用更完善的提取函数
    const product = extractTikTokSingleProductInfo();
    if (product) {
        sendResponse({success: true, products: [product]});
    } else {
        sendResponse({success: false, products: []});
    }
    return true;
  } else if (request.action === "scrapeShopeeProducts") {
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
  } else if (request.action === "isShopeeProductPage") {
    const isProductPage = checkIfShopeeProductPage();
    sendResponse({isProductPage});
    return true;
  }
  return true; // 保持消息通道打开，用于异步响应
});

// 分析TikTok页面寻找可能的商品元素
function analyzeTikTokPageForProducts() {
  const results = {
    possibleTitles: [],
    possiblePrices: [],
    possibleImages: []
  };
  
  // 查找可能的商品标题
  const titleCandidates = [
    ...document.querySelectorAll('h1'),
    ...document.querySelectorAll('h2'),
    ...document.querySelectorAll('.product-title'),
    ...document.querySelectorAll('[class*="title"]'),
    ...document.querySelectorAll('[class*="name"]')
  ];
  
  titleCandidates.forEach(el => {
    if (el && el.textContent && el.textContent.trim().length > 0) {
      results.possibleTitles.push({
        text: el.textContent.trim(),
        tagName: el.tagName,
        className: el.className,
        id: el.id
      });
    }
  });
  
  // 查找可能的价格
  const priceCandidates = [
    ...document.querySelectorAll('[class*="price"]'),
    ...document.querySelectorAll('[class*="cost"]'),
    ...document.querySelectorAll('[class*="amount"]')
  ];
  
  priceCandidates.forEach(el => {
    if (el && el.textContent && el.textContent.trim().length > 0) {
      results.possiblePrices.push({
        text: el.textContent.trim(),
        tagName: el.tagName,
        className: el.className,
        id: el.id
      });
    }
  });
  
  // 查找可能的图片
  const imageCandidates = document.querySelectorAll('img');
  imageCandidates.forEach(el => {
    if (el && el.src && el.src.length > 0) {
      results.possibleImages.push({
        src: el.src,
        alt: el.alt,
        className: el.className,
        id: el.id
      });
    }
  });
  
  return results;
}

// 检查当前页面是否包含TikTok商品
function checkIfTikTokProductPage() {
  // TikTok商店相关标识符检测
  const shopIndicators = [
    '.tiktok-shop-card', 
    '[data-e2e="product-card"]',
    '[data-e2e="tiktok-shop"]',
    '.product-card',
    '.product-item'
  ];
  
  let foundElements = [];
  
  for (let selector of shopIndicators) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      debugLog(`找到商品指示器: ${selector}`, {count: elements.length});
      foundElements.push({
        selector: selector,
        count: elements.length
      });
    }
  }
  
  // 详细记录URL内容
  const urlContainsShop = window.location.href.includes('/shop');
  const urlContainsProduct = window.location.href.includes('product');
  
  debugLog('URL分析', {
    url: window.location.href,
    containsShop: urlContainsShop,
    containsProduct: urlContainsProduct
  });
  
  const result = foundElements.length > 0 || urlContainsShop || urlContainsProduct;
  debugLog('商品页面检测结果', {isProductPage: result, foundElements});
  
  return result;
}

// 提取TikTok商品信息
function extractTikTokProductInfo() {
  const products = [];
  debugLog('开始提取商品信息过程');
  
  // 尝试多种可能的商品容器选择器
  const selectors = [
    '.tiktok-shop-card', 
    '[data-e2e="product-card"]',
    '.product-card',
    '.product-item',
    // 如果是单一商品页面
    '.product-detail'
  ];
  
  let productElements = [];
  let matchedSelector = '';
  
  // 尝试不同选择器找到商品元素
  for (let selector of selectors) {
    const elements = document.querySelectorAll(selector);
    debugLog(`尝试选择器 "${selector}"`, {found: elements.length});
    
    if (elements.length > 0) {
      productElements = Array.from(elements);
      matchedSelector = selector;
      break;
    }
  }
  
  debugLog('商品元素查找结果', {
    found: productElements.length > 0,
    selector: matchedSelector,
    count: productElements.length
  });
  
  // 如果找不到商品元素但可能是单个商品页面，尝试整页提取
  if (productElements.length === 0) {
    debugLog('未找到商品元素，尝试单个商品提取');
    if (checkIfTikTokProductPage()) {
      debugLog('尝试从整个页面提取单个商品信息');
      // 只用 extractTikTokSingleProductInfo 的结果
      const product = extractTikTokSingleProductInfo();
      if (product) {
        debugLog('成功提取单个商品信息', product);
        // 只返回 extractTikTokSingleProductInfo 的 images 字段
        return [product];
      } else {
        debugLog('单个商品提取失败');
      }
    } else {
      debugLog('页面似乎不包含商品');
    }
    return [];
  }

  // 遍历找到的商品元素，提取信息
  productElements.forEach(element => {
    try {
      // 提取标题
      let title = '';
      const titleElement = element.querySelector('.product-title, [data-e2e="product-title"]');
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
      
      // 提取价格
      let price = '';
      const priceElement = element.querySelector('.price, [data-e2e="product-price"]');
      if (priceElement) {
        price = priceElement.textContent.trim();
      }
  
      
      // 提取图片
      let image = '';
      const imageElement = element.querySelector('img, [data-e2e="product-image"]');
      if (imageElement) {
        image = imageElement.src;
      }
      
      // 提取卖家信息
      let seller = '';
      const sellerElement = element.querySelector('.seller-name, [data-e2e="seller-name"]');
      if (sellerElement) {
        seller = sellerElement.textContent.trim();
      }
      
      products.push({
        name: title,
        price,
        image,
        seller
      });
    } catch (e) {
      debugLog('提取商品信息时出错', e);
    }
  });
  
  return products;
}

// Shopee 商品信息提取
function extractShopeeProducts() {
  const products = [];
  // Shopee 商品卡片的典型选择器
  const cards = document.querySelectorAll('div.flex.flex-col.bg-white.cursor-pointer');
  cards.forEach(card => {
    // 标题
    let name = '';
    const nameDiv = card.querySelector('.line-clamp-2, .break-words');
    if (nameDiv) {
      name = nameDiv.textContent.trim();
    }

    // 价格
    let price = '';
    const priceSpan = card.querySelector('.text-shopee-primary .text-base, .text-shopee-primary .font-medium.text-base\\/5');
    if (priceSpan) {
      price = priceSpan.textContent.trim();
      // 带货币符号
      const peso = card.querySelector('.text-shopee-primary .text-xs, .text-shopee-primary .text-xs\\/sp14');
      if (peso) price = peso.textContent.trim() + price;
    }

    // 图片
    let image = '';
    const img = card.querySelector('img[loading="lazy"], img.object-contain');
    if (img) {
      image = img.src;
    }

    // 销量
    let sold = '';
    const soldDiv = card.querySelector('.text-shopee-black87');
    if (soldDiv) {
      sold = soldDiv.textContent.trim();
    }

    products.push({
      name,
      price,
      image,
      sold
    });
  });
  return products;
}

// 检查当前页面是否为Shopee商品页或商品列表页
function checkIfShopeeProductPage() {
  // Shopee 商品卡片典型选择器
  const productCardSelector = 'div.flex.flex-col.bg-white.cursor-pointer';
  const cards = document.querySelectorAll(productCardSelector);
  // 也可以根据URL进一步判断
  const url = window.location.href;
  const isProductList = cards.length > 0;
  const isProductDetail = /shopee\..+\/product\//.test(url);
  return isProductList || isProductDetail;
}

// 监听 Shopee 消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  debugLog('收到消息', request);
  
  if (request.action === "getDebugInfo") {
    sendResponse({debugInfo: window._tikTokExtractorDebug || []});
    return true;
  }
  
  if (request.action === "isProductPage") {
    // 检查当前页面是否是商品页面
    const isProductPage = checkIfTikTokProductPage();
    debugLog('是否是商品页面检查结果', isProductPage);
    sendResponse({isProductPage});
  } 
  else if (request.action === "scrapeProducts") {
    // TikTok 商品页面提取
    const price = document.querySelector('.price-w1xvrw span')?.innerText || '';
    const name = document.querySelector('.title-v0v6fK')?.innerText || '';
    const seller = document.querySelector('.seller-c27aRQ')?.innerText || '';
    const rating = document.querySelector('.infoRatingScore-jSs6kd')?.innerText || '';
    const ratingCount = document.querySelector('.infoRatingCount-lKBiTI')?.innerText || '';
    const sold = document.querySelector('.info__sold-ZdTfzQ')?.innerText || '';
    const image = document.querySelector('img')?.src || ''; // 你可以根据实际页面结构优化

    const products = [{
      name,
      price,
      seller,
      rating,
      ratingCount,
      sold,
      image
    }];

    sendResponse({success: true, products});
    return true;
  } else if (request.action === "scrapeShopeeProducts") {
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
  } else if (request.action === "isShopeeProductPage") {
    const isProductPage = checkIfShopeeProductPage();
    sendResponse({isProductPage});
    return true;
  }
  return true; // 保持消息通道打开，用于异步响应
});

// 分析TikTok页面寻找可能的商品元素
function analyzeTikTokPageForProducts() {
  const results = {
    possibleTitles: [],
    possiblePrices: [],
    possibleImages: [],
  };
  
  // 查找可能的商品标题
  const titleCandidates = [
    ...document.querySelectorAll('h1'),
    ...document.querySelectorAll('h2'),
    ...document.querySelectorAll('.product-title'),
    ...document.querySelectorAll('[class*="title"]'),
    ...document.querySelectorAll('[class*="name"]')
  ];
  
  titleCandidates.forEach(el => {
    if (el && el.textContent && el.textContent.trim().length > 0) {
      results.possibleTitles.push({
        text: el.textContent.trim(),
        tagName: el.tagName,
        className: el.className,
        id: el.id
      });
    }
  });
  
  // 查找可能的价格
  const priceCandidates = [
    ...document.querySelectorAll('[class*="price"]'),
    ...document.querySelectorAll('[class*="cost"]'),
    ...document.querySelectorAll('[class*="amount"]')
  ];
  
  priceCandidates.forEach(el => {
    if (el && el.textContent && el.textContent.trim().length > 0) {
      results.possiblePrices.push({
        text: el.textContent.trim(),
        tagName: el.tagName,
        className: el.className,
        id: el.id
      });
    }
  });
  
  // 查找可能的图片
  const imageCandidates = document.querySelectorAll('img');
  imageCandidates.forEach(el => {
    if (el && el.src && el.src.length > 0) {
      results.possibleImages.push({
        src: el.src,
        alt: el.alt,
        className: el.className,
        id: el.id
      });
    }
  });
  
  return results;
}

// 检查当前页面是否包含TikTok商品
function checkIfTikTokProductPage() {
  // TikTok商店相关标识符检测
  const shopIndicators = [
    '.tiktok-shop-card', 
    '[data-e2e="product-card"]',
    '[data-e2e="tiktok-shop"]',
    '.product-card',
    '.product-item'
  ];
  
  let foundElements = [];
  
  for (let selector of shopIndicators) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      debugLog(`找到商品指示器: ${selector}`, {count: elements.length});
      foundElements.push({
        selector: selector,
        count: elements.length
      });
    }
  }
  
  // 详细记录URL内容
  const urlContainsShop = window.location.href.includes('/shop');
  const urlContainsProduct = window.location.href.includes('product');
  
  debugLog('URL分析', {
    url: window.location.href,
    containsShop: urlContainsShop,
    containsProduct: urlContainsProduct
  });
  
  const result = foundElements.length > 0 || urlContainsShop || urlContainsProduct;
  debugLog('商品页面检测结果', {isProductPage: result, foundElements});
  
  return result;
}

// 提取TikTok商品信息
function extractTikTokProductInfo() {
  const products = [];
  debugLog('开始提取商品信息过程');
  
  // 尝试多种可能的商品容器选择器
  const selectors = [
    '.tiktok-shop-card', 
    '[data-e2e="product-card"]',
    '.product-card',
    '.product-item',
    // 如果是单一商品页面
    '.product-detail'
  ];
  
  let productElements = [];
  let matchedSelector = '';
  
  // 尝试不同选择器找到商品元素
  for (let selector of selectors) {
    const elements = document.querySelectorAll(selector);
    debugLog(`尝试选择器 "${selector}"`, {found: elements.length});
    
    if (elements.length > 0) {
      productElements = Array.from(elements);
      matchedSelector = selector;
      break;
    }
  }
  
  debugLog('商品元素查找结果', {
    found: productElements.length > 0,
    selector: matchedSelector,
    count: productElements.length
  });
  
  // 如果找不到商品元素但可能是单个商品页面，尝试整页提取
  if (productElements.length === 0) {
    debugLog('未找到商品元素，尝试单个商品提取');
    if (checkIfTikTokProductPage()) {
      debugLog('尝试从整个页面提取单个商品信息');
      // 只用 extractTikTokSingleProductInfo 的结果
      const product = extractTikTokSingleProductInfo();
      if (product) {
        debugLog('成功提取单个商品信息', product);
        // 只返回 extractTikTokSingleProductInfo 的 images 字段
        return [product];
      } else {
        debugLog('单个商品提取失败');
      }
    } else {
      debugLog('页面似乎不包含商品');
    }
    return [];
  }

  // 遍历找到的商品元素，提取信息
  productElements.forEach(element => {
    try {
      // 提取标题
      let title = '';
      const titleElement = element.querySelector('.product-title, [data-e2e="product-title"]');
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
      
      // 提取价格
      let price = '';
      const priceElement = element.querySelector('.price, [data-e2e="product-price"]');
      if (priceElement) {
        price = priceElement.textContent.trim();
      }
      
      // 提取图片
      let image = '';
      const imageElement = element.querySelector('img, [data-e2e="product-image"]');
      if (imageElement) {
        image = imageElement.src;
      }
      
      // 提取卖家信息
      let seller = '';
      const sellerElement = element.querySelector('.seller-name, [data-e2e="seller-name"]');
      if (sellerElement) {
        seller = sellerElement.textContent.trim();
      }
      
      products.push({
        name: title,
        price,
        image,
        seller
      });
    } catch (e) {
      debugLog('提取商品信息时出错', e);
    }
  });
  
  return products;
}

// Shopee 商品信息提取
function extractShopeeProducts() {
  const products = [];
  // Shopee 商品卡片的典型选择器
  const cards = document.querySelectorAll('div.flex.flex-col.bg-white.cursor-pointer');
  cards.forEach(card => {
    // 标题
    let name = '';
    const nameDiv = card.querySelector('.line-clamp-2, .break-words');
    if (nameDiv) {
      name = nameDiv.textContent.trim();
    }

    // 价格
    let price = '';
    const priceSpan = card.querySelector('.text-shopee-primary .text-base, .text-shopee-primary .font-medium.text-base\\/5');
    if (priceSpan) {
      price = priceSpan.textContent.trim();
      // 带货币符号
      const peso = card.querySelector('.text-shopee-primary .text-xs, .text-shopee-primary .text-xs\\/sp14');
      if (peso) price = peso.textContent.trim() + price;
    }

    // 图片
    let image = '';
    const img = card.querySelector('img[loading="lazy"], img.object-contain');
    if (img) {
      image = img.src;
    }

    // 销量
    let sold = '';
    const soldDiv = card.querySelector('.text-shopee-black87');
    if (soldDiv) {
      sold = soldDiv.textContent.trim();
    }

    products.push({
      name,
      price,
      image,
      sold
    });
  });
  return products;
}

// 检查当前页面是否为Shopee商品页或商品列表页
function checkIfShopeeProductPage() {
  // Shopee 商品卡片典型选择器
  const productCardSelector = 'div.flex.flex-col.bg-white.cursor-pointer';
  const cards = document.querySelectorAll(productCardSelector);
  // 也可以根据URL进一步判断
  const url = window.location.href;
  const isProductList = cards.length > 0;
  const isProductDetail = /shopee\..+\/product\//.test(url);
  return isProductList || isProductDetail;
}

// 用于单个TikTok商品页面的提取
function extractTikTokSingleProductInfo() {
  try {
    // 尝试查找商品标题
    const titleSelectors = [
      'h1', 
      '.product-title', 
      '[data-e2e="product-title"]',
      '.product-name'
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
    
    // 查找价格
    const priceSelectors = [
      '.price-w1xvrw span',
      '.price', 
      '.product-price', 
      '[data-e2e="product-price"]'
    ];
    
    let price = 'Price not available';
    for (let selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        price = el.textContent.trim();
        break;
      }
    }
    
    // 查找图片
    const imgSelectors = [
      '.product-image img', 
      '.gallery img', 
      '[data-e2e="product-image"] img',
      '.product-gallery img',
      '.slick-slider img', // 支持你提供的轮播图结构
      '.carousel-rYbN8F img'
    ];

    // 只提取 .slick-list > .slick-track 下所有 slick-slide 里的图片（只保留轮播图结构，其他图片一律不提取）
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
    
    // 查找卖家
    const sellerSelectors = [
      '.seller-c27aRQ',
      '.seller-name', 
      '.shop-name', 
      '[data-e2e="seller-name"]'
    ];
    
    let seller = 'Unknown Seller';
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
      imageElements, // 新增
      seller
    };
  } catch (e) {
    console.error("Error extracting single product info:", e);
    return null;
  }
}

// 导出调试信息方法便于访问
window.getTikTokExtractorDebugInfo = function() {
  return window._tikTokExtractorDebug || [];
};
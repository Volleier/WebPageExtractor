import { initTiktokHandlers } from "./src/page_TikTok.js";
import { initShopeeHandlers } from "./src/page_Shopee.js";

/**
 * 导出产品数据为CSV文件
 * @param {Array} products 产品数组
 * @param {string} filename 导出文件名
 * @param {HTMLElement} statusDiv 状态显示区域
 */
function exportProductsToCSV(products, filename = "products.csv", statusDiv) {
  if (!products || products.length === 0) {
    if (statusDiv)
      statusDiv.innerHTML =
        '<p class="error">暂无可导出的产品数据，请先提取产品信息。</p>';
    return;
  }
  const csv = productsToCSV(products);
  const utf8csv = "\uFEFF" + csv;
  const blob = new Blob([utf8csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (statusDiv) statusDiv.innerHTML = '<p class="success">CSV文件已导出！</p>';
}

/**
 * 将产品对象数组转换为CSV字符串
 * @param {Array} products 产品数组
 * @returns {string} CSV内容
 */
function productsToCSV(products) {
  const allKeys = new Set();
  products.forEach((p) => Object.keys(p).forEach((k) => allKeys.add(k)));
  const headers = Array.from(allKeys);
  const rows = products.map((p) =>
    headers.map((h) => `"${(p[h] || "").toString().replace(/"/g, '""')}"`)
  );
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * 显示产品信息到页面
 * @param {Array} products 产品数组
 * @param {HTMLElement} resultsDiv 显示区域
 * @param {HTMLElement} showImagesCtrl 控制图片显示的checkbox
 */
function displayProducts(products, resultsDiv, showImagesCtrl) {
  if (!products || products.length === 0) {
    resultsDiv.innerHTML = '<p class="no-results">未找到产品信息</p>';
    if (window.statusDiv)
      window.statusDiv.innerHTML = '<p class="error">未找到产品信息</p>';
    return;
  }
  resultsDiv.innerHTML = "";
  products.forEach((product, index) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    let imgHTML = "";
    if (showImagesCtrl && showImagesCtrl.checked && product.image) {
      imgHTML = `<img src="${product.image}" alt="${product.name || "产品图片"}">`;
    }

    const name = product.name || "未知产品";
    const price = product.price || "价格不可用";
    const seller = product.seller || "未知卖家";

    productCard.innerHTML = `
      <h3>${name}</h3>
      <div class="price">${price}</div>
      ${imgHTML}
      <div class="seller">卖家: ${seller}</div>
      <div class="product-index">产品 #${index + 1}</div>
    `;
    resultsDiv.appendChild(productCard);
  });
}

// 让子模块能用到通用方法
window.displayProducts = displayProducts;
window.exportProductsToCSV = exportProductsToCSV;

document.addEventListener("DOMContentLoaded", function () {
  // 统一获取所有DOM元素
  const statusDiv = document.getElementById("status");
  window.statusDiv = statusDiv; // 供通用函数内部使用
  const tiktokContent = document.getElementById("tiktokContent");
  const shopeeContent = document.getElementById("shopeeContent");
  const productResults = document.getElementById("productResults");
  const shopeeProductResults = document.getElementById("shopeeProductResults");
  const autoExtract = document.getElementById("autoExtract");
  const showImages = document.getElementById("showImages");

  // 检测当前标签页类型并初始化对应内容
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    const url = tab ? tab.url : "";
    let siteType = "";

    if (/tiktok\.com/.test(url)) {
      siteType = "tiktok";
    } else if (/shopee\./.test(url)) {
      siteType = "shopee";
    }

    tiktokContent.style.display = "none";
    shopeeContent.style.display = "none";

    if (siteType === "tiktok") {
      // 让 content.js 判断是否为商品页
      chrome.tabs.sendMessage(
        tab.id,
        { action: "isProductPage" },
        function (response) {
          if (response && response.isProductPage) {
            tiktokContent.style.display = "block";
            statusDiv.innerHTML = "<p>已检测到TikTok商品页，请点击提取按钮</p>";
            initTiktokHandlers({
              statusDiv,
              productResults,
              autoExtract,
              showImages,
            });
          } else {
            statusDiv.innerHTML =
              "<p>请打开TikTok商品详情页使用该插件或刷新游览器</p>";
          }
        }
      );
    } else if (siteType === "shopee") {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "isShopeeProductPage" },
        function (response) {
          if (response && response.isProductPage) {
            shopeeContent.style.display = "block";
            statusDiv.innerHTML = "<p>已检测到Shopee商品页，请点击提取按钮</p>";
            initShopeeHandlers({ statusDiv, shopeeProductResults });
          } else {
            statusDiv.innerHTML =
              "<p>请打开Shopee商品详情页使用该插件或刷新游览器</p>";
          }
        }
      );
    } else {
      statusDiv.innerHTML = `<p>请打开商品详情页使用该插件<br>当前URL: ${url}</p>`;
    }
  });
});

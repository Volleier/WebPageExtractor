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
  window.statusDiv = statusDiv;
  const tiktokContent = document.getElementById("tiktokContent");
  const productResults = document.getElementById("productResults");
  const AutoExtract = document.getElementById("AutoExtract");
  const ShowImages = document.getElementById("ShowImages");
  const TikTokScrapeBtn = document.getElementById("TikTokScrapeBtn");
  const TikTokExportBtn = document.getElementById("TikTokExportBtn");
  const shopeeContent = document.getElementById("shopeeContent");
  const shopeeProductResults = document.getElementById("shopeeProductResults");
  const shopeeScrapeBtn = document.getElementById("shopeeScrapeBtn");
  const shopeeExportBtn = document.getElementById("shopeeExportBtn");

  // 每次打开菜单都刷新设置
  chrome.storage.sync.get(["autoExtract", "showImages"], function (data) {
    if (AutoExtract)
      AutoExtract.checked = data.autoExtract !== undefined ? data.autoExtract : true;
    if (ShowImages)
      ShowImages.checked = data.showImages !== undefined ? data.showImages : true;
  });

  // 保存设置
  if (AutoExtract) {
    AutoExtract.addEventListener("change", function () {
      chrome.storage.sync.set({ autoExtract: this.checked });
    });
  }
  if (ShowImages) {
    ShowImages.addEventListener("change", function () {
      chrome.storage.sync.set({ showImages: this.checked });
    });
  }

  // TikTok 导出按钮事件
  if (TikTokExportBtn) {
    TikTokExportBtn.addEventListener("click", function () {
      if (window.tiktokProducts && window.tiktokProducts.length > 0) {
        exportProductsToCSV(
          window.tiktokProducts,
          "tiktok_products.csv",
          statusDiv
        );
      } else {
        statusDiv.innerHTML =
          '<p class="error">暂无可导出的产品数据，请先提取产品信息。</p>';
      }
    });
  }

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
              autoExtract: AutoExtract,
              showImages: ShowImages,
              TikTokScrapeBtn,
            });
            // 自动检测 TikTok 商品页并自动提取
            if (AutoExtract && AutoExtract.checked) {
              TikTokScrapeBtn.click();
            }
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
            // 初始化 Shopee 事件
            initShopeeHandlers({
              statusDiv,
              shopeeProductResults,
              autoExtract: AutoExtract,
              showImages: ShowImages,
              shopeeScrapeBtn,
            });
            // 自动检测
            if (AutoExtract && AutoExtract.checked) {
              shopeeScrapeBtn.click();
            }
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

  // 认证状态栏显示
  function updateAuthStatus() {
    chrome.storage.local.get("token", ({ token }) => {
      const authStatus = document.getElementById("authStatus");
      if (authStatus) {
        if (token) {
          authStatus.textContent = "系统认证成功";
          authStatus.style.background = "#4caf50";
        } else {
          authStatus.textContent = "系统未认证";
          authStatus.style.background = "#888";
        }
      }
    });
  }

  updateAuthStatus();
  // 定时刷新认证状态
  setInterval(updateAuthStatus, 3000);
});

document.getElementById('sendHelloBtn').addEventListener('click', async () => {
  try {
    await fetch('http://localhost:8080/system/product/receiveString', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'hello world'
    });
    alert('已发送 "hello world" 到 /system/product/receiveString');
  } catch (e) {
    alert('发送失败: ' + e.message);
  }
});

chrome.storage.local.get("token", ({ token }) => {
  console.log("当前 token:", token);
});
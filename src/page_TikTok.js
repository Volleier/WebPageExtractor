/**
 * 初始化 TikTok 提取按钮和设置的事件处理
 * @param {Object} param0 - 包含 statusDiv, productResults, autoExtract, showImages, TikTokScrapeBtn
 */
export function initTiktokHandlers({
  statusDiv,
  productResults,
  autoExtract,
  showImages,
  TikTokScrapeBtn,
}) {
  // 加载保存的设置
  chrome.storage.sync.get(["autoExtract", "showImages"], function (data) {
    autoExtract.checked = data.autoExtract || false;
    showImages.checked = data.showImages !== undefined ? data.showImages : true;
  });

  // 保存设置
  autoExtract.addEventListener("change", function () {
    chrome.storage.sync.set({ autoExtract: this.checked });
  });
  showImages.addEventListener("change", function () {
    chrome.storage.sync.set({ showImages: this.checked });
  });

  let lastTikTokProducts = [];
  window.tiktokProducts = [];

  function showProducts(products) {
    window.displayProducts(products, productResults, showImages);
  }

  // 提取产品信息
  TikTokScrapeBtn.addEventListener("click", function () {
    statusDiv.innerHTML =
      '<p><i class="fas fa-spinner fa-spin"></i> 正在提取产品信息...</p>';

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        statusDiv.innerHTML = '<p class="error">无法访问当前标签页</p>';
        return;
      }
      const currentTab = tabs[0];
      statusDiv.innerHTML += `<p>当前页面: ${currentTab.url}</p>`;

      if (currentTab.url.includes("tiktok.com")) {
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "scrapeProducts" },
          function (response) {
            if (chrome.runtime.lastError) {
              statusDiv.innerHTML = `
                <p class="error">错误: ${chrome.runtime.lastError.message}</p>
                <p>请尝试刷新页面后重试</p>
              `;
              return;
            }
            if (response && response.success) {
              statusDiv.innerHTML = `<p class="success">成功提取了 ${response.products.length} 个产品</p>`;
              lastTikTokProducts = response.products;
              window.tiktokProducts = response.products;
              showProducts(response.products);
            } else {
              statusDiv.innerHTML = `
                <p class="error">未能提取产品信息。请确保您在TikTok产品页面上</p>
              `;
              lastTikTokProducts = [];
              window.tiktokProducts = [];
              showProducts([]);
            }
          }
        );
      } else {
        statusDiv.innerHTML = '<p class="error">请先打开TikTok网站</p>';
      }
    });
  });

  // 导出按钮逻辑
  const exportBtn = document.getElementById("TikTokExportBtn");
  exportBtn.addEventListener("click", function () {
    window.exportProductsToCSV(lastTikTokProducts, "tiktok_products.csv");
  });

  // 图片显示切换
  if (showImages) {
    showImages.addEventListener("change", function () {
      if (window.tiktokProducts && window.tiktokProducts.length > 0) {
        showProducts(window.tiktokProducts);
      }
    });
  }
}

// 工具函数：转义HTML
function escapeHtml(str) {
  return (str || "").replace(/[<>&"]/g, function (c) {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
  });
}

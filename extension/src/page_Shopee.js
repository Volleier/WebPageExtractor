/**
 * 初始化 TikTok 提取按钮和设置的事件处理
 * @param {Object} param0 - 包含 statusDiv, productResults, autoExtract, showImages
 */
export function initShopeeHandlers({
  statusDiv,
  shopeeProductResults,
  autoExtract,
  showImages,
  shopeeScrapeBtn,
}) {
  let lastShopeeProducts = [];
  window.shopeeProducts = [];

  function showProducts(products) {
    window.displayProducts(products, shopeeProductResults, showImages);
  }

  // 打开弹窗时自动读取所有已提取商品
  chrome.storage.local.get({ shopeeProducts: [] }, function(data) {
    if (data.shopeeProducts && data.shopeeProducts.length > 0) {
      lastShopeeProducts = data.shopeeProducts;
      window.shopeeProducts = data.shopeeProducts;
      showProducts(data.shopeeProducts);
      statusDiv.innerHTML = `<p class="success">已提取 ${data.shopeeProducts.length} 个商品</p>`;
    }
  });

  // 保持原有监听逻辑
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "shopeeProductExtracted" && request.product) {
      // 重新读取所有商品并刷新
      chrome.storage.local.get({ shopeeProducts: [] }, function(data) {
        lastShopeeProducts = data.shopeeProducts;
        window.shopeeProducts = data.shopeeProducts;
        showProducts(data.shopeeProducts);
        statusDiv.innerHTML = `<p class="success">已提取 ${data.shopeeProducts.length} 个商品</p>`;
      });
    }
  });

  shopeeScrapeBtn.addEventListener("click", function () {
    statusDiv.innerHTML =
      '<p><i class="fas fa-spinner fa-spin"></i> 正在提取Shopee产品信息...</p>';

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        statusDiv.innerHTML = '<p class="error">无法访问当前标签页</p>';
        return;
      }
      const currentTab = tabs[0];
      statusDiv.innerHTML += `<p>当前页面: ${currentTab.url}</p>`;

      if (/shopee\./.test(currentTab.url)) {
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "scrapeShopeeProducts" },
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
              lastShopeeProducts = response.products;
              window.shopeeProducts = response.products;
              showProducts(response.products);
            } else {
              statusDiv.innerHTML = `
                <p class="error">未能提取产品信息。请确保您在Shopee产品页面上</p>
              `;
              lastShopeeProducts = [];
              window.shopeeProducts = [];
              showProducts([]);
            }
          }
        );
      } else {
        statusDiv.innerHTML = '<p class="error">请先打开Shopee网站</p>';
      }
    });
  });

  // 导出按钮
  let exportShopeeBtn = document.getElementById("shopeeExportBtn");
  if (exportShopeeBtn) {
    exportShopeeBtn.addEventListener("click", function () {
      window.exportProductsToCSV(
        lastShopeeProducts,
        "shopee_products.csv",
        statusDiv
      );
    });
  }

  // 图片显示切换
  if (showImages) {
    showImages.addEventListener("change", function () {
      if (window.shopeeProducts && window.shopeeProducts.length > 0) {
        showProducts(window.shopeeProducts);
      }
      chrome.storage.sync.set({ showImages: this.checked });
    });
  }

  // 保存设置
  if (autoExtract) {
    autoExtract.addEventListener("change", function () {
      chrome.storage.sync.set({ autoExtract: this.checked });
    });
  }

  // 提取单个商品信息并发送消息
  function extractSingleProduct(product, btn) {
    chrome.runtime.sendMessage(
      {
        action: "shopeeProductExtracted",
        product,
      },
      function (response) {
        btn.textContent = "提取完成";
        btn.disabled = true;
        btn.style.background = "#4caf50";
        // 存储到本地，供弹窗读取
        chrome.storage.local.set({ lastShopeeProduct: product });
      }
    );
  }
}

export function initShopeeHandlers({statusDiv, shopeeProductResults}) {
    let lastShopeeProducts = [];
    const shopeeScrapeBtn = document.getElementById('shopeeScrapeBtn');
    shopeeScrapeBtn.addEventListener('click', function() {
      statusDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在提取Shopee产品信息...</p>';
  
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs || tabs.length === 0) {
          statusDiv.innerHTML = '<p class="error">无法访问当前标签页</p>';
          return;
        }
        const currentTab = tabs[0];
        statusDiv.innerHTML += `<p>当前页面: ${currentTab.url}</p>`;
  
        if (/shopee\./.test(currentTab.url)) {
          chrome.tabs.sendMessage(currentTab.id, {action: "scrapeShopeeProducts"}, function(response) {
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
              window.displayProducts(response.products, shopeeProductResults, {checked: true});
            } else {
              statusDiv.innerHTML = `
                <p class="error">未能提取产品信息。请确保您在Shopee产品页面上</p>
              `;
              lastShopeeProducts = [];
            }
          });
        } else {
          statusDiv.innerHTML = '<p class="error">请先打开Shopee网站</p>';
        }
      });
    });
  
    // 新增Shopee导出按钮
    let exportShopeeBtn = document.getElementById('shopeeExportBtn');
    if (!exportShopeeBtn) {
      exportShopeeBtn = document.createElement('button');
      exportShopeeBtn.id = 'shopeeExportBtn';
      exportShopeeBtn.className = 'btn secondary';
      exportShopeeBtn.style.marginLeft = '10px';
      exportShopeeBtn.innerHTML = '<i class="fas fa-file-export"></i> 导出为CSV';
      shopeeScrapeBtn.parentNode.insertBefore(exportShopeeBtn, shopeeScrapeBtn.nextSibling);
    }
    exportShopeeBtn.addEventListener('click', function() {
      window.exportProductsToCSV(lastShopeeProducts, 'shopee_products.csv');
    });
  }
document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const tiktokContent = document.getElementById('tiktokContent');
  const shopeeContent = document.getElementById('shopeeContent');
  const productResults = document.getElementById('productResults');
  const shopeeProductResults = document.getElementById('shopeeProductResults');
  const autoExtract = document.getElementById('autoExtract');
  const showImages = document.getElementById('showImages');
  let scrapeBtn = null;
  let shopeeScrapeBtn = null;

  // 检测当前页面平台类型
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = tabs[0] ? tabs[0].url : '';
    let siteType = '';

    if (/tiktok\.com/.test(url)) {
      siteType = 'tiktok';
    } else if (/shopee\./.test(url)) {
      siteType = 'shopee';
    }

    // 先全部隐藏
    tiktokContent.style.display = 'none';
    shopeeContent.style.display = 'none';

    switch (siteType) {
      case 'tiktok':
        tiktokContent.style.display = 'block';
        statusDiv.innerHTML = '<p>已检测到TikTok页面，请点击提取按钮</p>';
        scrapeBtn = document.getElementById('scrapeBtn');
        initTiktokHandlers();
        break;
      case 'shopee':
        shopeeContent.style.display = 'block';
        statusDiv.innerHTML = '<p>已检测到Shopee页面，请点击提取按钮</p>';
        shopeeScrapeBtn = document.getElementById('shopeeScrapeBtn');
        initShopeeHandlers();
        break;
      default:
        statusDiv.innerHTML = '<p>请打开商品详情页使用该插件</p>';
        break;
    }
  });

  // 导出CSV方法
  function exportProductsToCSV(products, filename = 'products.csv') {
    if (!products || products.length === 0) {
      statusDiv.innerHTML = '<p class="error">暂无可导出的产品数据，请先提取产品信息。</p>';
      return;
    }
    const csv = productsToCSV(products);
    const utf8csv = '\uFEFF' + csv;
    const blob = new Blob([utf8csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    statusDiv.innerHTML = '<p class="success">CSV文件已导出！</p>';
  }

  // 通用产品数组转CSV
  function productsToCSV(products) {
    // 自动收集所有字段
    const allKeys = new Set();
    products.forEach(p => Object.keys(p).forEach(k => allKeys.add(k)));
    const headers = Array.from(allKeys);
    const rows = products.map(p => headers.map(h => `"${(p[h] || '').toString().replace(/"/g, '""')}"`));
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  }

  // TikTok专属逻辑
  function initTiktokHandlers() {
    // 加载保存的设置
    chrome.storage.sync.get(['autoExtract', 'showImages'], function(data) {
      autoExtract.checked = data.autoExtract || false;
      showImages.checked = data.showImages !== undefined ? data.showImages : true;
    });

    // 保存设置
    autoExtract.addEventListener('change', function() {
      chrome.storage.sync.set({autoExtract: this.checked});
    });

    showImages.addEventListener('change', function() {
      chrome.storage.sync.set({showImages: this.checked});
    });

    // 保存提取的产品数据
    let lastExtractedProducts = [];

    // 提取产品信息
    scrapeBtn.addEventListener('click', function() {
      statusDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在提取产品信息...</p>';

      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs || tabs.length === 0) {
          statusDiv.innerHTML = '<p class="error">无法访问当前标签页</p>';
          return;
        }

        const currentTab = tabs[0];
        statusDiv.innerHTML += `<p>当前页面: ${currentTab.url}</p>`;

        if (currentTab.url.includes('tiktok.com')) {
          chrome.tabs.sendMessage(currentTab.id, {action: "scrapeProducts"}, function(response) {
            if (chrome.runtime.lastError) {
              statusDiv.innerHTML = `
                <p class="error">错误: ${chrome.runtime.lastError.message}</p>
                <p>请尝试刷新页面后重试</p>
              `;
              return;
            }

            if (response && response.success) {
              statusDiv.innerHTML = `<p class="success">成功提取了 ${response.products.length} 个产品</p>`;
              lastExtractedProducts = response.products; // 保存数据
              displayProducts(response.products, productResults, showImages);
            } else {
              statusDiv.innerHTML = `
                <p class="error">未能提取产品信息。请确保您在TikTok产品页面上</p>
              `;
              lastExtractedProducts = [];
            }
          });
        } else {
          statusDiv.innerHTML = '<p class="error">请先打开TikTok网站</p>';
        }
      });
    });

    // 导出按钮逻辑
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.addEventListener('click', function() {
      exportProductsToCSV(lastExtractedProducts, 'tiktok_products.csv');
    });
  }

  // Shopee专属逻辑
  function initShopeeHandlers() {
    let lastShopeeProducts = [];
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
              displayProducts(response.products, shopeeProductResults, {checked: true});
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
      exportProductsToCSV(lastShopeeProducts, 'shopee_products.csv');
    });
  }

  // 显示提取结果（通用）
  function displayProducts(products, resultsDiv, showImagesCtrl) {
    if (!products || products.length === 0) {
      resultsDiv.innerHTML = '<p class="no-results">未找到产品信息</p>';
      statusDiv.innerHTML = '<p class="error">未找到产品信息</p>';
      return;
    }

    resultsDiv.innerHTML = '';

    products.forEach((product, index) => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';

      let imgHTML = '';
      if (showImagesCtrl.checked && product.image) {
        imgHTML = `<img src="${product.image}" alt="${product.name || '产品图片'}">`;
      }

      const name = product.name || '未知产品';
      const price = product.price || '价格不可用';
      const description = product.description || '无描述';
      const seller = product.seller || '未知卖家';

      productCard.innerHTML = `
        <h3>${name}</h3>
        <div class="price">${price}</div>
        <div class="description">${description}</div>
        ${imgHTML}
        <div class="seller">卖家: ${seller}</div>
        <div class="product-index">产品 #${index + 1}</div>
      `;

      resultsDiv.appendChild(productCard);
    });
  }
});
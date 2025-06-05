// 后台服务脚本
chrome.runtime.onInstalled.addListener(() => {
  // 设置默认值
  chrome.storage.sync.set({ 
    autoExtract: true,
    showImages: true
  });
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    let siteType = '';
    if (/shopee\.[a-z]+/i.test(tab.url)) {
      siteType = 'shopee';
    } else if (/tiktok\.com/i.test(tab.url)) {
      siteType = 'tiktok';
    }

    chrome.storage.sync.get(['autoExtract'], (data) => {
      if (data.autoExtract) {
        if (siteType === 'tiktok') {
          chrome.tabs.sendMessage(tabId, {action: "isProductPage"}, (response) => {
            if (response && response.isProductPage) {
              chrome.runtime.sendMessage({action: "autoExtractTrigger", siteType: "tiktok"});
            }
          });
        } else if (siteType === 'shopee') {
          chrome.tabs.sendMessage(tabId, {action: "isShopeeProductPage"}, (response) => {
            if (response && response.isProductPage) {
              chrome.runtime.sendMessage({action: "autoExtractTrigger", siteType: "shopee"});
            }
          });
        }
      }
    });
  }
});

// 监听来自内容脚本的自动提取请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "autoExtractTrigger") {
    // 更新弹出窗口状态（如果打开）
    chrome.runtime.sendMessage({action: "updateStatus", message: "Product page detected, extracting..."});
    
    // 触发提取
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "scrapeProducts"}, (response) => {
          if (response && response.success) {
            chrome.runtime.sendMessage({
              action: "displayResults", 
              products: response.products
            });
          }
        });
      }
    });
  }
});

// 处理导出商品数据为JSON文件
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "exportProductsAsJSON") {
    try {
      // 准备JSON数据
      const jsonData = JSON.stringify(message.data, null, 2); // 格式化JSON，使其更易读
      
      // 创建Blob对象
      const blob = new Blob([jsonData], {type: 'application/json'});
      
      // 创建URL
      const url = URL.createObjectURL(blob);
      
      // 生成文件名
      const now = new Date();
      const fileName = `tiktok_products_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.json`;
      
      // 使用chrome.downloads API保存文件
      chrome.downloads.download({
        url: url,
        filename: fileName,
        saveAs: true // 允许用户选择保存位置
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("导出错误:", chrome.runtime.lastError);
          sendResponse({success: false, error: chrome.runtime.lastError.message});
        } else {
          sendResponse({success: true, fileName: fileName, downloadId: downloadId});
        }
        
        // 释放URL
        URL.revokeObjectURL(url);
      });
      
      return true; // 保持消息通道打开
    } catch (error) {
      console.error("处理导出时出错:", error);
      sendResponse({success: false, error: error.message});
    }
  }
  
});
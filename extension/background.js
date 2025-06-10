// 后台服务脚本
chrome.runtime.onInstalled.addListener(() => {
  // 设置默认值
  chrome.storage.sync.set({
    autoExtract: true,
    showImages: true,
  });
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    let siteType = "";
    if (/shopee\.[a-z]+/i.test(tab.url)) {
      siteType = "shopee";
    } else if (/tiktok\.com/i.test(tab.url)) {
      siteType = "tiktok";
    }

    chrome.storage.sync.get(["autoExtract"], (data) => {
      if (data.autoExtract) {
        if (siteType === "tiktok") {
          chrome.tabs.sendMessage(
            tabId,
            { action: "isProductPage" },
            (response) => {
              if (response && response.isProductPage) {
                chrome.runtime.sendMessage({
                  action: "autoExtractTrigger",
                  siteType: "tiktok",
                });
              }
            }
          );
        } else if (siteType === "shopee") {
          chrome.tabs.sendMessage(
            tabId,
            { action: "isShopeeProductPage" },
            (response) => {
              if (response && response.isProductPage) {
                chrome.runtime.sendMessage({
                  action: "autoExtractTrigger",
                  siteType: "shopee",
                });
              }
            }
          );
        }
      }
    });
  }
});

// 合并所有消息监听到一个监听器
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 自动提取触发
  if (msg.action === "autoExtractTrigger") {
    chrome.runtime.sendMessage({
      action: "updateStatus",
      message: "Product page detected, extracting...",
    });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "scrapeProducts" },
          (response) => {
            if (response && response.success) {
              chrome.runtime.sendMessage({
                action: "displayResults",
                products: response.products,
              });
            }
          }
        );
      }
    });
    return;
  }

  // 导出商品数据为JSON文件
  if (msg.action === "exportProductsAsJSON") {
    try {
      const jsonData = JSON.stringify(msg.data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const fileName = `tiktok_products_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}.json`;
      chrome.downloads.download(
        {
          url: url,
          filename: fileName,
          saveAs: true,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("导出错误:", chrome.runtime.lastError);
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            sendResponse({
              success: true,
              fileName: fileName,
              downloadId: downloadId,
            });
          }
          URL.revokeObjectURL(url);
        }
      );
      return true; // 保持消息通道打开
    } catch (error) {
      console.error("处理导出时出错:", error);
      sendResponse({ success: false, error: error.message });
    }
    return;
  }

  // 保存token
  if (msg.action === "saveToken") {
    console.log("后台收到token：", msg.token);
    chrome.storage.local.set({ token: msg.token });
    return;
  }
});

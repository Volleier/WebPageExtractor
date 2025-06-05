/**
 * 检查当前页面是否为 Shopee 商品页或商品列表页
 * @returns {boolean} 是否为商品页
 */
export function checkIfShopeeProductPage() {
  // 商品卡片选择器
  const productCardSelector = 'div.flex.flex-col.bg-white.cursor-pointer';
  const cards = document.querySelectorAll(productCardSelector);
  const url = window.location.href;
  const isProductList = cards.length > 0;
  const isProductDetail = /shopee\..+\/product\//.test(url);
  return isProductList || isProductDetail;
}

/**
 * 提取 Shopee 商品信息（商品列表页）
 * @returns {Array} 商品对象数组
 */
export function extractShopeeProducts() {
  const products = [];
  const cards = document.querySelectorAll('div.flex.flex-col.bg-white.cursor-pointer');
  cards.forEach(card => {
    // 商品名
    let name = '';
    const nameDiv = card.querySelector('.line-clamp-2, .break-words');
    if (nameDiv) name = nameDiv.textContent.trim();

    // 价格
    let price = '';
    const priceSpan = card.querySelector('.text-shopee-primary .text-base, .text-shopee-primary .font-medium.text-base\\/5');
    if (priceSpan) {
      price = priceSpan.textContent.trim();
      const peso = card.querySelector('.text-shopee-primary .text-xs, .text-shopee-primary .text-xs\\/sp14');
      if (peso) price = peso.textContent.trim() + price;
    }

    // 图片
    let image = '';
    const img = card.querySelector('img[loading="lazy"], img.object-contain');
    if (img) image = img.src;

    // 已售数量
    let sold = '';
    const soldDiv = card.querySelector('.text-shopee-black87');
    if (soldDiv) sold = soldDiv.textContent.trim();

    products.push({
      name,
      price,
      image,
      sold
    });
  });
  return products;
}
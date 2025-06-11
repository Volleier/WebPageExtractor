package com.webscout.system.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 商品表 sys_product
 *
 * @author ruoyi
 */
public class SysProduct {
    // getter 和 setter
    /**
     * 商品ID
     */
    @Setter
    @Getter
    private Long id;

    /**
     * 商品名称
     */
    @Setter
    @Getter
    private String productName;

    /**
     * 商品图片
     */
    @Setter
    @Getter
    private List<String> productImage;

    /**
     * 商品价格
     */
    @Setter
    @Getter
    private Double productPrice;

    /**
     * 卖家
     */
    @Setter
    @Getter
    private String seller;

    @Override
    public String toString() {
        return "SysProduct{" +
                "id=" + id +
                ", productName='" + productName + '\'' +
                ", productImage=" + productImage +
                ", productPrice=" + productPrice +
                ", seller='" + seller + '\'' +
                '}';
    }
}
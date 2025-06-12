package com.webscout.system.domain;

import lombok.Getter;
import lombok.Setter;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;

import java.util.List;

/**
 * 商品表 sys_product
 *
 * @author ruoyi
 */
public class SysProduct {
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
    @TableField(typeHandler = JacksonTypeHandler.class)
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
    private String productSeller;

    @Override
    public String toString() {
        return "SysProduct{" +
                "id=" + id +
                ", productName='" + productName + '\'' +
                ", productImage=" + productImage +
                ", productPrice=" + productPrice +
                ", productSeller='" + productSeller + '\'' +
                '}';
    }
}
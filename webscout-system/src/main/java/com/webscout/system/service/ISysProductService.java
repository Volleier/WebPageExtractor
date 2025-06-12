package com.webscout.system.service;

import com.webscout.system.domain.SysProduct;

import java.util.List;

public interface ISysProductService {
    /**
     * 新增商品
     *
     * @param product 商品信息
     * @return 结果
     */
    int insertSysProduct(SysProduct product);

    /*
     * 查询商品列表
     *
     * @param product 商品信息
     * @return 商品集合
     */
    List<SysProduct> selectSysProductList(SysProduct product);
}
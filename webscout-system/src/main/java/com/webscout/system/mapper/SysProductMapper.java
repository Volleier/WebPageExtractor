package com.webscout.system.mapper;

import com.webscout.system.domain.SysProduct;

import java.util.List;

public interface SysProductMapper {
    /**
     * 查询商品列表
     *
     * @param product 商品查询条件
     * @return 商品列表
     */
    List<SysProduct> selectSysProductList(SysProduct product);


    /**
     * 插入商品数据
     *
     * @param product 商品数据
     * @return 插入结果，影响的行数
     */
    int insertSysProduct(SysProduct product);

    /**
     * 带日志的查询商品列表
     *
     * @param product 商品数据
     * @return 商品列表
     */
    default List<SysProduct> selectSysProductListWithLog(SysProduct product) {
        List<SysProduct> list = selectSysProductList(product);
        return list;
    }
}
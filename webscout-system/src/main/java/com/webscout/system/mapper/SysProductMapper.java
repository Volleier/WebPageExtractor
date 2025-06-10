package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.SysProduct;
import java.util.List;

public interface SysProductMapper {
    int insertSysProduct(SysProduct product);
    List<SysProduct> selectSysProductList(SysProduct product);
}
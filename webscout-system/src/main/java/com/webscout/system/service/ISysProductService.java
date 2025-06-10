package com.ruoyi.system.service;

import com.ruoyi.system.domain.SysProduct;
import java.util.List;

public interface ISysProductService {
    int insertSysProduct(SysProduct product);
    List<SysProduct> selectSysProductList(SysProduct product);
}
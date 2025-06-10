package com.webscout.system.service;

import com.webscout.system.domain.SysProduct;
import java.util.List;

public interface ISysProductService {
    int insertSysProduct(SysProduct product);
    List<SysProduct> selectSysProductList(SysProduct product);
}
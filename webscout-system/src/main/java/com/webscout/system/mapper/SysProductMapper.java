package com.webscout.system.mapper;

import com.webscout.system.domain.SysProduct;
import java.util.List;

public interface SysProductMapper {
    int insertSysProduct(SysProduct product);
    List<SysProduct> selectSysProductList(SysProduct product);
}
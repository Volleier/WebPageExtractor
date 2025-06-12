package com.webscout.system.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.webscout.system.domain.SysProduct;
import com.webscout.system.mapper.SysProductMapper;
import com.webscout.system.service.ISysProductService;

import java.util.List;

@Service
public class SysProductServiceImpl implements ISysProductService {

    @Autowired
    private SysProductMapper sysProductMapper;

    @Override
    public int insertSysProduct(SysProduct product) {
        return sysProductMapper.insertSysProduct(product);
    }

    @Override
    public List<SysProduct> selectSysProductList(SysProduct product) {
        List<SysProduct> list = sysProductMapper.selectSysProductList(product);
        return list;
    }
}
package com.ruoyi.system.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.domain.SysProduct;
import com.ruoyi.system.mapper.SysProductMapper;
import com.ruoyi.system.service.ISysProductService;

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
        return sysProductMapper.selectSysProductList(product);
    }
}
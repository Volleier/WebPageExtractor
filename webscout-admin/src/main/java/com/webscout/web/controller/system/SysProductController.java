package com.webscout.web.controller.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.webscout.system.domain.SysProduct;
import com.webscout.system.service.ISysProductService;
import com.webscout.common.core.domain.AjaxResult;
import java.util.List;

@RestController
@RequestMapping("/system/product")
public class SysProductController {

    @Autowired
    private ISysProductService sysProductService;

    // 新增商品
    @PostMapping
    public AjaxResult add(@RequestBody SysProduct product) {
        int rows = sysProductService.insertSysProduct(product);
        return rows > 0 ? AjaxResult.success() : AjaxResult.error("保存失败");
    }

    // 查询商品列表
    @GetMapping("/list")
    public AjaxResult list(SysProduct product) {
        List<SysProduct> list = sysProductService.selectSysProductList(product);
        return AjaxResult.success(list);
    }
}
package com.ruoyi.web.controller.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.ruoyi.system.domain.SysProduct;
import com.ruoyi.system.service.ISysProductService;
import com.ruoyi.common.core.domain.AjaxResult;
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
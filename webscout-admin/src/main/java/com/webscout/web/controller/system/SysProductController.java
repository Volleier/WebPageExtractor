package com.webscout.web.controller.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.webscout.system.domain.SysProduct;
import com.webscout.system.service.ISysProductService;
import com.webscout.common.core.domain.AjaxResult;

import java.util.List;

@CrossOrigin
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

    @PostMapping("/receiveString")
    public AjaxResult receiveString(@RequestBody(required = false) String data) {
        System.out.println("前后端连通成功 ");
        // 直接把收到的内容作为data返回
        return AjaxResult.success(data);
    }

    /**
     * 接收前端发送的CSV数据
     *
     * @param csvData CSV格式的字符串
     * @return 处理结果
     */
    @PostMapping("/receiveCsv")
    public AjaxResult receiveCsv(@RequestBody(required = false) String csvData) {
        System.out.println("收到前端CSV数据: " + csvData);
        /* 仅为测试
        // 保存CSV数据到本地文件，使用UTF-8编码
        if (csvData != null && !csvData.isEmpty()) {
            try {
                String filePath = System.getProperty("user.dir") + "/received_data.csv";
                // 添加UTF-8 BOM头
                byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
                java.nio.file.Files.write(java.nio.file.Paths.get(filePath), bom);
                java.nio.file.Files.write(java.nio.file.Paths.get(filePath), csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8), java.nio.file.StandardOpenOption.APPEND);
                // ...existing code...
            } catch (Exception e) {
                // ...existing code...
            }
        }
         */
        return AjaxResult.error("CSV数据为空");
    }
}
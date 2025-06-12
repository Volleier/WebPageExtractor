<template>
  <div class="app-container">
    <h2>产品列表</h2>
    <el-table :data="productList" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="productName" label="商品名称" />
      <el-table-column prop="productImage" label="商品图片">
        <template slot-scope="scope">
          <img v-if="scope.row.productImage && scope.row.productImage.length" :src="scope.row.productImage[0]" alt="图片"
            style="width: 60px; height: 60px; object-fit: cover;" />
        </template>
      </el-table-column>
      <el-table-column prop="productPrice" label="价格" />
      <el-table-column prop="productSeller" label="卖家" />
    </el-table>
  </div>
</template>

<script>
import axios from 'axios'
import Cookies from "js-cookie"

export default {
  name: 'ProductList',
  data() {
    return {
      productList: []
    }
  },
  mounted() {
    const token = Cookies.get("Admin-Token")
    axios.get(process.env.VUE_APP_BASE_API + "/system/product/list", {
      headers: {
        Authorization: "Bearer " + token
      }
    }).then(res => {
      console.log("接口返回数据：", res.data);
      this.productList = res.data.data;
    });
  }
}
</script>

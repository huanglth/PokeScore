# PokeScore

先选择 3 门选考科目，再确认科目与宝可梦六维的对应关系，最后输入六科高考成绩。页面会把每门课成绩映射到对应种族值，并给出最接近的宝可梦、属性、世代、种族值总和和 NationalDex 链接。

## 打开方式

直接用浏览器打开 `index.html` 即可，不需要安装依赖或启动服务器。

## 映射模型

- 必考固定为：语文 HP、数学物攻、外语特攻。
- 选考支持：物理、化学、生物、政治、历史、地理、技术。
- 三门选考可分配到：物防、特防、速度。
- 每门课先按本科满分换算分位，再映射到对应宝可梦种族值分布。
- 单科成绩决定六维形状，高考总分决定整体种族值强度，避免生成超过真实图鉴范围的组合。
- 匹配宝可梦时同时比较六维形状和六维总和。

## 数据

- 宝可梦中文名、属性、种族值来自 [`pokemon.json`](https://github.com/fanzeyi/pokemon.json) 开源数据集。
- 图片使用 [PokeAPI official artwork](https://github.com/PokeAPI/sprites) 路径。
- 图鉴跳转使用 [NationalDex 中文站](https://nationaldex.io/zh-CN) 链接。

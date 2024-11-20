# Mortal Plus

Mortal牌谱解析增强：Chrome 扩展

## 扩展地址

[Mortal脚本 哔哩哔哩](https://www.bilibili.com/opus/801346640086564869)

[Mortal恶手率插件 百度贴吧](https://tieba.baidu.com/p/8873100433)

## Updated logs

- **Version 3.0.1**

    * **2024.11.18**

    * 默认配置更新为 `mortal "4.1b"`，采用 `KillerDucky` 界面

    * 修复 `KillerDucky` 中文界面不显示进度条的问题

    * 修复 `KillerDucky` 界面不显示立直家危险度的问题

    * 减少按键过快导致的异步加载数据失败（哥哥慢点）

    * 优化剪贴板监听
    
    * `Save to Excel` 添加 `KillerDucky` 界面的牌谱解析更新时间（该界面没有解析时间，采用当前时间作为更新时间）

    * 添加 `readme.md` 文件

## Notes

- 添加 `Flatted` 库解决循环引用问题，以提供 `KillerDucky` 界面对立直家的危险度显示

- `flatted.min.js` 文件仅用于观赏，实际为静态引入代码
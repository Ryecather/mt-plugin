# mt-browser

基于百度翻译 API 的浏览器网页翻译插件，支持 Chrome 和 Firefox。

## 安装

- **Chrome / Edge**: 在 `chrome://extensions` 打开开发者模式，加载 `chrome/` 目录
- **Firefox**: 在 `about:debugging#/runtime/this-firefox` 加载 `firefox/` 目录为临时附加组件

## 使用

1. 点击工具栏图标，选择源语言和目标语言，点击"翻译"
2. 划词选中文本后右键 → "YiMT翻译" 快速翻译
3. 快捷键 `Ctrl+Shift+T` 翻译当前选中文字
4. 点击"还原"恢复网页原文

## 设置

在弹出窗口的设置页面填写百度翻译 API 的 APP ID 和 Secret Key，或配置自定义翻译服务端点。

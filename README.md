# tcs
贪吃蛇
https://unplage.github.io/tcs/

## 结构

| 文件 | 说明 |
| --- | --- |
| `index.html` | 单文件游戏（HTML + CSS + JS 内联） |
| `manifest.json` | PWA 清单（图标、主题色、standalone） |
| `sw.js` | Service Worker：离线缓存、版本化清理 |
| `icon.svg` / `icon-maskable.svg` | 图标源文件（矢量） |
| `icon-192.png` / `icon-512.png` | 常规图标 |
| `icon-maskable-192.png` / `icon-maskable-512.png` | Android 自适应（maskable）图标 |
| `apple-touch-icon.png` | iOS 添加到主屏图标（180×180） |
| `favicon.ico` | 浏览器标签页图标（16/32/48） |

## 缓存隔离规则

同一域名下的多个 PWA 共用一份 Cache Storage，因此 `sw.js` 严格按作用域隔离：

- 缓存名格式：`pwa-cache<作用域路径>v<版本>`，例如 `/tcs/` → `pwa-cache-tcs-v6`
- 激活时只删除匹配 `^pwa-cache<作用域路径>v\d+$` 且内容全部位于本作用域内的旧缓存
- 同源下其它项目（如 `/pwa1/`）的缓存、以及名字相近的项目缓存都不会被删除
- 修改缓存内容时，把 `sw.js` 里的 `CACHE_VERSION` 加 1，旧缓存会在下次激活时自动回收

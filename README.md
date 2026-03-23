# AI Page Summarizer

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=google-chrome&logoColor=white)](https://github.com/ykdoit/ai-page-summarizer)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ykdoit/ai-page-summarizer)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

AI 驱动的网页内容总结与语音播报 Chrome 扩展，支持多种 AI 服务商，一键生成网页摘要。

## 功能特性

- **智能总结** - 一键提取网页核心内容，生成结构化摘要
- **流式输出** - 实时展示 AI 生成过程，无需等待完整响应
- **语音播报** - 支持 TTS 朗读摘要内容，可暂停/继续/停止
- **多服务商支持** - OpenAI、Claude、通义千问、自定义 API
- **多种展示格式** - 标准、紧凑、卡片、大纲四种格式
- **自定义提示词** - 支持用户自定义总结提示词模板
- **深色/浅色主题** - 参考 Gemini 设计风格的双主题支持
- **三种 UI 模式** - Side Panel、Popup、悬浮窗

## 截图

![Side Panel 模式](./screenshots/sidepanel.png)
*Side Panel 模式 - 主界面*

![设置页面](./screenshots/settings.png)
*设置页面 - AI 服务商配置*

## 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 | 前端框架 |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具 |
| Tailwind CSS | 样式框架 |
| Chrome Manifest V3 | 扩展 API |
| @mozilla/readability | 内容提取 |
| markdown-it | Markdown 渲染 |

## 项目结构

```
ai-page-summarizer/
├── src/
│   ├── background/          # Service Worker 后台脚本
│   ├── sidepanel/           # 侧边栏 UI（主界面）
│   ├── popup/               # 弹窗 UI
│   ├── options/             # 设置页面
│   ├── content/             # 内容脚本
│   ├── services/            # 服务层
│   │   ├── ai-service.ts    # AI 服务统一接口
│   │   ├── storage-service.ts
│   │   ├── content-extractor.ts
│   │   ├── tts-service.ts
│   │   └── providers/       # AI 服务商实现
│   ├── composables/         # Vue 组合式函数
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数
├── public/icons/            # 扩展图标
├── dist/                    # 构建输出
└── package.json
```

## 安装

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/ykdoit/ai-page-summarizer.git
cd ai-page-summarizer

# 安装依赖
npm install

# 构建
npm run build
```

### 加载扩展

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择项目中的 `dist` 目录

## 使用

1. 点击浏览器工具栏的扩展图标
2. 首次使用需配置 AI 服务商（点击设置图标）
3. 填写 API Key 和相关配置
4. 点击「测试连接」验证配置
5. 返回主界面，点击「开始使用」或「总结」按钮

## 配置说明

### AI 服务商

| 服务商 | 默认模型 | API 格式 |
|--------|----------|----------|
| OpenAI | gpt-4o-mini | OpenAI |
| Claude | claude-3-haiku-20240307 | Anthropic |
| 通义千问 | qwen-turbo | OpenAI 兼容 |
| 自定义 | - | OpenAI 兼容 |

### 自定义 API

支持 OpenAI 兼容的 API（如智谱 GLM、DeepSeek、Moonshot 等）：

1. 选择「自定义」服务商
2. 填写完整 API 地址（如 `https://api.deepseek.com/chat/completions`）
3. 填写 API Key 和模型名称
4. 点击「测试连接」验证

### 自定义提示词

支持变量替换：
- `{content}` - 网页内容
- `{title}` - 网页标题
- `{url}` - 网页 URL

示例：
```
请用中文总结以下内容：
标题：{title}
内容：{content}
```

## 开发

```bash
# 开发模式（监听文件变化自动构建）
npm run dev

# 类型检查
npm run typecheck

# 生产构建
npm run build
```

## 注意事项

- **特殊页面** - `chrome://`、`edge://` 等浏览器内部页面无法使用
- **API Key 安全** - API Key 存储在 Chrome Storage Local，仅本地使用
- **CORS 限制** - 部分 API 可能需要配置 CORS

## 常见问题

<details>
<summary>点击刷新提示 BLANK_PAGE？</summary>

确保当前页面是普通网页（非空白页、新标签页或浏览器内部页面）。
</details>

<details>
<summary>API 连接失败？</summary>

1. 检查 API 地址是否完整（需包含 `/chat/completions` 等路径）
2. 使用「测试连接」功能验证配置
3. 检查 API Key 是否正确
4. 检查网络连接和代理设置
</details>

<details>
<summary>语音播报没有声音？</summary>

1. 检查系统音量设置
2. 检查浏览器是否允许自动播放音频
3. 尝试手动点击播放按钮
</details>

## 更新日志

### v1.0.0
- 初始版本发布
- 支持 OpenAI、Claude、通义千问、自定义 API
- 流式输出与 TTS 语音播报
- 深色/浅色主题
- 三种 UI 模式

## 许可证

[MIT License](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request！

---

如果这个项目对你有帮助，请给一个 ⭐️ Star！

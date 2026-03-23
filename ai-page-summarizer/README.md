# AI Page Summarizer

AI 驱动的网页内容总结与语音播报 Chrome 扩展。

## 功能特性

- **智能总结**：一键提取网页核心内容，生成结构化摘要
- **流式输出**：实时展示 AI 生成过程，无需等待完整响应
- **语音播报**：支持 TTS 朗读摘要内容，可暂停/继续/停止
- **多服务商支持**：OpenAI、Claude、通义千问、自定义 API
- **自定义提示词**：支持用户自定义总结提示词模板
- **深色/浅色主题**：参考 Gemini 设计风格的双主题支持
- **Markdown 渲染**：支持标题、列表、代码块等格式化显示

## 技术栈

- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite 5
- **样式**：Tailwind CSS
- **Chrome API**：Manifest V3、Side Panel、Content Scripts
- **内容提取**：@mozilla/readability
- **Markdown 渲染**：markdown-it

## 项目结构

```
ai-page-summarizer/
├── src/
│   ├── background/          # Service Worker 后台脚本
│   │   └── index.ts         # 消息处理、标签页管理
│   ├── sidepanel/           # 侧边栏 UI（主界面）
│   │   ├── App.vue          # 主组件
│   │   ├── main.ts          # 入口文件
│   │   └── components/
│   │       ├── Settings.vue     # 设置页面
│   │       └── SummaryView.vue  # 摘要展示组件
│   ├── popup/               # 弹窗 UI
│   ├── options/             # 设置页面
│   ├── content/             # 内容脚本
│   │   ├── index.ts         # 页面内容提取
│   │   └── floating-widget.ts   # 悬浮窗模式
│   ├── services/            # 服务层
│   │   ├── ai-service.ts    # AI 服务统一接口
│   │   ├── storage-service.ts   # Chrome Storage 封装
│   │   ├── content-extractor.ts # 网页内容提取
│   │   ├── tts-service.ts   # TTS 语音服务
│   │   └── providers/       # AI 服务商实现
│   │       ├── base.ts      # 基类
│   │       ├── openai.ts    # OpenAI / 兼容 API
│   │       ├── claude.ts    # Anthropic Claude
│   │       ├── qwen.ts      # 通义千问
│   │       └── custom.ts    # 自定义服务商
│   ├── composables/         # Vue 组合式函数
│   │   ├── useSettings.ts   # 设置管理
│   │   ├── useSummary.ts    # 总结逻辑
│   │   └── useTTS.ts        # TTS 控制
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   └── manifest.json        # Chrome 扩展配置
├── public/
│   └── icons/               # 扩展图标
├── dist/                    # 构建输出
├── package.json
├── vite.config.ts           # 主构建配置
├── vite.config.content.ts   # Content Script 构建配置
└── tsconfig.json
```

## 安装与使用

### 开发环境

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck
```

### 加载扩展

1. 运行 `npm run build` 生成 `dist` 目录
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `dist` 目录

## 配置说明

### AI 服务商配置

扩展支持以下 AI 服务商：

| 服务商 | 默认模型 | API 格式 |
|--------|----------|----------|
| OpenAI | gpt-4o-mini | OpenAI 兼容 |
| Claude | claude-3-haiku-20240307 | Anthropic |
| 通义千问 | qwen-turbo | OpenAI 兼容 |
| 自定义 | - | OpenAI 兼容 |

### 自定义 API 配置

对于 OpenAI 兼容的 API（如智谱 GLM、DeepSeek 等）：

1. 选择「自定义」服务商
2. 填写完整的 API 地址（如 `https://api.z.ai/api/coding/paas/v4/chat/completions`）
3. 填写 API Key 和模型名称
4. 点击「测试连接」验证配置

### 自定义提示词

支持以下变量替换：
- `{content}` - 网页内容
- `{title}` - 网页标题
- `{url}` - 网页 URL

示例：
```
请用简洁的语言总结以下内容：
标题：{title}
地址：{url}
内容：{content}
```

## 核心功能实现

### 消息通信

使用 Chrome Message API 实现各组件间通信：

```typescript
// 消息类型定义（src/types/index.ts）
enum MessageType {
  GET_PAGE_CONTENT,    // 获取页面内容
  SUMMARIZE,           // 开始总结
  STOP_SUMMARIZE,      // 停止总结
  SUMMARY_CHUNK,       // 流式输出片段
  SUMMARY_COMPLETE,    // 总结完成
  SUMMARY_ERROR,       // 错误处理
}
```

### 流式输出

通过 Server-Sent Events (SSE) 实现实时输出：

```typescript
// 服务端返回格式
data: {"choices":[{"delta":{"content":"总结内容..."}}]}
```

### 内容提取

使用 Readability 算法提取网页正文：

```typescript
// src/services/content-extractor.ts
import { Readability } from '@mozilla/readability';

const doc = new DOMParser().parseFromString(html, 'text/html');
const reader = new Readability(doc);
const article = reader.parse();
```

## 主题系统

支持深色/浅色主题切换，配色参考 Google Gemini：

| 用途 | 浅色模式 | 深色模式 |
|------|----------|----------|
| 背景 | #ffffff | #1e1e1e |
| 次级背景 | #f8fafc | #2d2d2d |
| 主文字 | #1e293b | #e8eaed |
| 次级文字 | #64748b | #9aa0a6 |
| 强调色 | #6366f1 | #8ab4f8 |

## 注意事项

1. **特殊页面**：`chrome://`、`edge://` 等浏览器内部页面无法使用
2. **CORS 限制**：部分 API 可能需要配置 CORS，建议使用支持浏览器直接调用的 API
3. **API Key 安全**：API Key 存储在 Chrome Storage 中，仅本地使用

## 常见问题

### Q: 点击刷新提示 BLANK_PAGE？
A: 确保当前页面是普通网页（非空白页或特殊页面）

### Q: API 连接失败？
A: 
1. 检查 API 地址是否完整（需包含 `/chat/completions` 等路径）
2. 使用「测试连接」功能验证配置
3. 检查 API Key 是否正确

### Q: 语音播报无法暂停？
A: 确保使用最新版本，旧版本仅支持停止

## 许可证

MIT License

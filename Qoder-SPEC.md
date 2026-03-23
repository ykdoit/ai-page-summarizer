# AI Page Summarizer - 浏览器插件开发规范

## Context

开发一个浏览器插件，实现以下核心功能：
1. 用户访问任意网页时，点击插件图标打开 Side Panel 侧边栏
2. 插件自动提取当前网页内容
3. 用户点击"总结"按钮，调用 AI 服务进行内容总结
4. 总结完成后，支持语音播报功能

**技术选型：**
- AI 服务：支持多服务商切换（OpenAI / Claude / 通义千问）
- UI 形式：Side Panel 侧边栏（Chrome 114+）
- 语音方案：Web Speech API（免费）
- 技术栈：Vue 3 + Vite + Tailwind CSS

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    浏览器插件架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Side Panel  │    │ Content     │    │ Background  │     │
│  │ (Vue 3)     │◄──►│ Script      │◄──►│ Service     │     │
│  │             │    │             │    │ Worker      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ AI Service  │    │ TTS Service │    │ Storage     │     │
│  │ (多服务商)   │    │ (Web Speech)│    │ Service     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
ai-page-summarizer/
├── src/
│   ├── manifest.json              # Chrome Extension Manifest V3
│   │
│   ├── background/                # Background Service Worker
│   │   └── index.ts               # 后台逻辑、消息处理
│   │
│   ├── content/                   # Content Script
│   │   ├── index.ts               # 注入脚本入口
│   │   └── style.css              # 注入样式
│   │
│   ├── sidepanel/                 # Side Panel 界面
│   │   ├── App.vue                # 主组件
│   │   ├── main.ts                # 入口文件
│   │   └── components/            # 子组件
│   │       ├── Header.vue         # 头部
│   │       ├── SummaryView.vue    # 总结展示
│   │       ├── TTSControls.vue    # 播报控制
│   │       └── Settings.vue       # 设置面板
│   │
│   ├── popup/                     # Popup 弹窗（辅助入口）
│   │   ├── App.vue
│   │   └── main.ts
│   │
│   ├── options/                   # 设置页面
│   │   ├── App.vue
│   │   └── main.ts
│   │
│   ├── services/                  # 服务层
│   │   ├── ai-service.ts          # AI 服务封装
│   │   ├── providers/             # AI 服务商实现
│   │   │   ├── base.ts            # 基类
│   │   │   ├── openai.ts          # OpenAI
│   │   │   ├── claude.ts          # Claude
│   │   │   └── qwen.ts            # 通义千问
│   │   ├── tts-service.ts         # 语音播报服务
│   │   ├── content-extractor.ts   # 内容提取服务
│   │   └── storage-service.ts     # 存储服务
│   │
│   ├── composables/               # Vue Composables
│   │   ├── useSummary.ts          # 总结逻辑
│   │   ├── useTTS.ts              # 播报逻辑
│   │   └── useSettings.ts         # 设置逻辑
│   │
│   ├── types/                     # TypeScript 类型
│   │   └── index.ts
│   │
│   └── utils/                     # 工具函数
│       ├── message.ts             # 消息通信
│       └── helpers.ts             # 辅助函数
│
├── public/
│   └── icons/                     # 插件图标
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Implementation Details

### 1. Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "AI Page Summarizer",
  "version": "1.0.0",
  "description": "AI 驱动的网页内容总结与语音播报助手",

  "permissions": [
    "activeTab",
    "storage",
    "sidePanel"
  ],

  "host_permissions": [
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://dashscope.aliyuncs.com/*"
  ],

  "action": {
    "default_title": "AI 总结助手",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  },

  "side_panel": {
    "default_path": "sidepanel.html"
  },

  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content/index.js"],
    "css": ["content/style.css"]
  }],

  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },

  "options_page": "options.html"
}
```

### 2. 内容提取服务

**文件：** `src/services/content-extractor.ts`

核心功能：
- 使用 Readability 算法提取正文
- 支持用户选择区域
- 智能识别主要内容区域
- 过滤广告和无关内容

提取策略：
1. 优先使用 Readability 解析
2. 备选方案：查找 article/main 等语义标签
3. 最后备选：提取 body 内容

### 3. AI 服务架构

**文件：** `src/services/ai-service.ts`, `src/services/providers/*.ts`

```typescript
// AI 服务提供商接口
interface AIProvider {
  name: string;
  summarize(content: string, options?: SummarizeOptions): Promise<string>;
  streamSummarize(content: string, onChunk: (chunk: string) => void): Promise<void>;
}

// 支持的服务商
- OpenAIProvider (gpt-4o-mini)
- ClaudeProvider (claude-3-haiku)
- QwenProvider (qwen-turbo)
```

Prompt 设计：
```
你是一个专业的内容总结助手。请对以下网页内容进行总结：

【网页标题】：{title}
【网页URL】：{url}
【网页内容】：
{content}

请按以下格式输出总结：
## 核心主题
（一句话概括）

## 关键要点
1. ...
2. ...
3. ...

## 结论
（总结性陈述）
```

### 4. TTS 服务

**文件：** `src/services/tts-service.ts`

```typescript
class TTSService {
  // 播放文本
  speak(text: string, options: TTSOptions): Promise<void>;

  // 控制方法
  pause(): void;
  resume(): void;
  stop(): void;

  // 状态
  isSpeaking: boolean;
  isPaused: boolean;

  // 配置
  setVoice(voice: SpeechSynthesisVoice): void;
  setRate(rate: number): void;  // 0.5 - 2.0
  setPitch(pitch: number): void; // 0 - 2
}
```

### 5. 消息通信协议

**文件：** `src/utils/message.ts`

```typescript
// 消息类型
enum MessageType {
  // Content Script -> Background
  GET_PAGE_CONTENT = 'GET_PAGE_CONTENT',
  EXTRACT_CONTENT = 'EXTRACT_CONTENT',

  // Side Panel -> Background
  SUMMARIZE = 'SUMMARIZE',
  TTS_SPEAK = 'TTS_SPEAK',
  TTS_STOP = 'TTS_STOP',

  // Background -> Side Panel
  SUMMARY_CHUNK = 'SUMMARY_CHUNK',
  SUMMARY_COMPLETE = 'SUMMARY_COMPLETE',
  ERROR = 'ERROR'
}

// 消息格式
interface Message<T = any> {
  type: MessageType;
  payload?: T;
  tabId?: number;
}
```

### 6. 数据存储

**文件：** `src/services/storage-service.ts`

存储内容：
```typescript
interface StorageSchema {
  // 用户设置
  settings: {
    aiProvider: 'openai' | 'claude' | 'qwen';
    apiKeys: {
      openai?: string;
      claude?: string;
      qwen?: string;
    };
    ttsConfig: {
      rate: number;
      pitch: number;
      voiceId: string;
    };
  };

  // 历史记录
  history: Array<{
    id: string;
    url: string;
    title: string;
    summary: string;
    createdAt: number;
  }>;
}
```

---

## UI Components

### Side Panel 主界面

```
┌─────────────────────────────┐
│  AI 总结助手         设置  │  <- Header
├─────────────────────────────┤
│                             │
│  当前页面：                  │
│  【网页标题】                │
│  【URL】                    │
│                             │
│  ┌─────────────────────┐   │
│  │    开始总结          │   │  <- 主按钮
│  └─────────────────────┘   │
│                             │
│  ───────────────────────   │
│                             │
│  ## 核心主题                │
│  ...                       │
│                             │
│  ## 关键要点                │  <- 总结内容
│  1. ...                    │
│  2. ...                    │
│                             │
│  ───────────────────────   │
│                             │
│  播放  暂停  停止           │  <- TTS 控制
│                             │
└─────────────────────────────┘
```

### 设置页面

```
┌─────────────────────────────┐
│  返回 设置                  │
├─────────────────────────────┤
│                             │
│  AI 服务商                  │
│  ○ OpenAI                   │
│  ○ Claude                   │
│  ○ 通义千问                  │
│                             │
│  API Key                    │
│  ┌─────────────────────┐   │
│  │ sk-****              │   │
│  └─────────────────────┘   │
│                             │
│  语音设置                   │
│  语速：[====●====] 1.0x    │
│  音调：[====●====] 1.0     │
│                             │
│  ┌─────────────────────┐   │
│  │    保存设置          │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

---

## Development Steps

### Phase 1: 项目初始化
- [ ] 创建项目目录结构
- [ ] 配置 Vite + Vue 3 + TypeScript
- [ ] 配置 Tailwind CSS
- [ ] 配置 Manifest V3
- [ ] 创建基础组件框架

### Phase 2: 核心功能 - 内容提取
- [ ] 实现 Content Script 注入
- [ ] 集成 Readability 库
- [ ] 实现智能内容提取
- [ ] 实现消息通信机制

### Phase 3: 核心功能 - AI 总结
- [ ] 实现 AI 服务基类
- [ ] 实现 OpenAI Provider
- [ ] 实现 Claude Provider
- [ ] 实现通义千问 Provider
- [ ] 实现流式输出支持
- [ ] 实现 API Key 安全存储

### Phase 4: 核心功能 - 语音播报
- [ ] 实现 TTS 服务
- [ ] 实现播报控制（播放/暂停/停止）
- [ ] 实现语音设置（语速/音调）
- [ ] 优化中文语音支持

### Phase 5: UI 界面
- [ ] 实现 Side Panel 主界面
- [ ] 实现总结结果展示
- [ ] 实现 TTS 控制面板
- [ ] 实现设置页面
- [ ] 实现历史记录功能

### Phase 6: 完善优化
- [ ] 错误处理与用户提示
- [ ] 加载状态与进度显示
- [ ] 性能优化
- [ ] 图标与视觉设计

---

## Key Files

| 文件路径 | 说明 |
|----------|------|
| `src/manifest.json` | Chrome Extension 配置 |
| `src/background/index.ts` | 后台服务入口 |
| `src/content/index.ts` | 内容脚本入口 |
| `src/sidepanel/App.vue` | Side Panel 主组件 |
| `src/services/ai-service.ts` | AI 服务核心 |
| `src/services/tts-service.ts` | 语音播报服务 |
| `src/services/content-extractor.ts` | 内容提取服务 |

---

## Verification

### 开发环境测试
1. 运行 `pnpm dev` 启动开发服务器
2. 在 Chrome 中加载 `dist` 目录作为未打包的扩展
3. 访问任意网页，点击插件图标
4. Side Panel 应正常打开

### 功能测试
1. **内容提取测试**
   - 访问新闻网站、博客、文档页面
   - 验证内容提取准确性

2. **AI 总结测试**
   - 配置 API Key
   - 点击总结按钮
   - 验证流式输出效果

3. **语音播报测试**
   - 点击播放按钮
   - 验证中文语音播报
   - 测试暂停/继续/停止功能

4. **设置功能测试**
   - 切换 AI 服务商
   - 修改语音设置
   - 验证设置持久化

### 构建测试
```bash
pnpm build
# 在 Chrome 中加载 dist 目录测试
```

---

## Dependencies

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "@mozilla/readability": "^0.5.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/chrome": "^0.0.260"
  }
}
```

---

## Security Considerations

1. **API Key 存储**
   - 使用 `chrome.storage.local` 存储
   - 不在代码中硬编码
   - 设置页面提供清除功能

2. **内容安全**
   - 使用 Shadow DOM 隔离样式
   - 对用户内容进行 XSS 过滤
   - 配置 CSP 策略

3. **权限最小化**
   - 仅请求必要权限
   - 使用 `activeTab` 而非 `tabs`
   - 明确声明 host_permissions

---

## Notes

- Chrome Side Panel 需要 Chrome 114+ 版本
- Web Speech API 在部分浏览器可能需要用户交互后才能使用
- 流式输出需要 AI 服务商支持 SSE
- 建议优先支持 OpenAI，后续扩展其他服务商

# 技术架构

## 约束
- 移动端网页优先（竖屏、单手操作）
- 纯静态：无后端、无数据库、无账号
- 进度存客户端
- Serverless 部署（Cloudflare Pages / GitHub Pages / Vercel 静态）

## 栈
| 层 | 选型 | 理由 |
|---|---|---|
| 构建 | Vite | 静态产物，零配置 |
| 语言 | TypeScript | 题库/范围表需要类型约束 |
| UI | Preact + hooks | 3KB，移动端首屏快 |
| 路由 | hash 路由（自写 ~30 行） | 静态托管无需 rewrite 规则，子路径部署也不会 404 |
| 样式 | 原生 CSS + CSS 变量 | 无运行时开销 |
| 存储 | localStorage | 见下 |
| 内容 | TS 模块（题库/课程/范围表） | 编译期校验，随包发布，天然离线 |

依赖只有 `preact` + 构建期 `vite / typescript / @preact/preset-vite`。

## 存储：为什么不是 cookie
cookie 单域名上限约 4KB，且每次请求都会带上。本项目需要存：
- 116 课的完成状态与小测分数
- 错题本（间隔重复，条目会累积到几百条）
- 每日训练打卡、技能雷达五维统计

这些量级会突破 4KB。方案：

- **localStorage**，key: `holdem.progress.v1`（单 JSON blob，带 schema 版本号，便于迁移）
- **导出/导入进度码**：把 JSON 压缩成 base64 字符串，用户可复制到另一台设备粘贴导入 —— 保持零后端的前提下解决跨设备
- 写入做 debounce，避免 drill 每题一次同步写

## 目录结构
```
holdem-practice/
├── docs/                    # 大纲、架构、内容规范
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── app.tsx              # 路由挂载
│   ├── styles.css
│   ├── lib/
│   │   ├── router.ts        # hash 路由
│   │   ├── storage.ts       # 进度读写 + 导入导出
│   │   └── range.ts         # 范围记法解析 → 169 格
│   ├── data/
│   │   ├── curriculum.ts    # 11 级 116 课的元数据
│   │   └── ranges.ts        # 范围表（带来源与假设标注）
│   ├── content/
│   │   └── lessons/         # 课程正文（结构化 block）
│   ├── features/
│   │   ├── RangeGrid.tsx    # 13×13 矩阵（可视化 + 可涂抹）
│   │   └── RangeTrainer.tsx # 翻前范围训练器
│   └── pages/
│       ├── Home.tsx  Level.tsx  Lesson.tsx  Drills.tsx
└── package.json
```

## 内容数据模型
```ts
Lesson  { id, levelId, title, goal, blocks: Block[], quiz?: Question[] }
Block   = Para | Heading | List | Callout | RangeRef | HandExample | Table
Question{ id, prompt, options[], answer, explain, tags[] }
```
题目统一带 `tags`，错题本按 tag 聚合 → 直接驱动技能雷达，无需额外统计表。

## 部署
`pnpm build` → `dist/` 纯静态。推荐 Cloudflare Pages（免费、全球边缘、自动 HTTPS）。
后续要离线可用再加 `vite-plugin-pwa`（一次性改动，不影响架构）。

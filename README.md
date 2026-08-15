# 德州扑克训练

移动端网页版德州扑克教学 + 练习。纯静态、无后端、进度存本地。

- 课程大纲：[docs/curriculum.md](docs/curriculum.md) —— 11 级 116 课
- 技术架构：[docs/architecture.md](docs/architecture.md)

## 开发

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 类型检查 + 输出 dist/
```

手机上调试：`pnpm dev --host`，然后用同一 WiFi 下的手机访问终端里打印的 Network 地址。

## 部署

`dist/` 是纯静态目录，扔到任意静态托管即可（Cloudflare Pages / GitHub Pages / Vercel）。
`vite.config.ts` 里 `base: './'` 已配好相对路径，部署到子路径也不会挂。

## 当前状态

已完成：
- 课程目录（11 级 116 课的完整骨架）
- 课程正文 3 课：L1-02 范围矩阵、L1-03 位置与开池范围、L2-02 底池赔率
- 每课出师小测（答错自动进错题本）
- 翻前范围训练器（RFI，出题偏向边界手牌）
- 进度存储 + 导出/导入进度码
- 13×13 范围矩阵组件

待办：见 docs/curriculum.md 的练习模块清单。

## 内容正确性

范围表在 `src/data/ranges.ts`，每张表必须标注：
- `conditions` —— 适用条件（人数 / 筹码深度 / ante / 抽水环境）
- `nature` —— `consensus`（共识标准）或 `simplified`（简化近似）
- `caveat` —— 简化的代价，`simplified` 时必填

不标注来源与假设的精确数字不进表。

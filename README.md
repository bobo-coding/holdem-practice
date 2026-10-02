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

课程：11 级 116 课正文全部完成，348 道出师小测题（答错自动进错题本）。

练习（14 个）：

| 练习 | 级别 | 数据来源 |
|---|---|---|
| 翻前范围训练器 | L1 | 范围表 `src/data/ranges.ts` |
| 赔率闪卡 / EV 计算题 / Combo 计数 | L2 | 公式实时生成 |
| Board Texture 分类 | L3 | 翻牌预计算 |
| Spot Trainer（20 个局面） | L3–L4 · L8 | 翻牌 / 转牌 / 阻断预计算 |
| 范围推断题 | L5 | 范围表 + 逐街推导 |
| GTO 频率题 / 剥削调整题 | L6 | 公式实时生成 |
| Push/Fold 训练 / 纳什表查表 | L7 | 单挑纳什表预计算 |
| ICM 决策题 | L7 | `src/lib/icm.ts` 实时计算 |
| Session 日志 | L9 | 用户记录 |

其他：进度存储 + 导出/导入进度码、13×13 范围矩阵组件（按强弱度渐变着色：位置范围按最早开池位置分层，纳什表按能执行到的筹码深度）。

未做：对局模拟（规则型 bot）、每日训练题包、技能雷达、错题本间隔重复调度。

## 数据与校验

```bash
pnpm precompute   # 重新生成 src/data/ 下的预计算数据（Push/Fold 约 2 分钟）
pnpm check        # 内容与数据完整性校验，build 和 CI 都会跑
```

预计算数据都是真算出来的：翻牌/转牌对抗与阻断用蒙特卡洛，Push/Fold 纳什表用 169×169
胜率矩阵迭代求均衡，ICM 用 Malmuth-Harville 模型并由枚举实现交叉验证，L6 的河牌局面用 CFR+
精确求解（含节点锁定与最优剥削），课程引用的数字由 `pnpm check` 逐个核对。

## 内容正确性

范围表在 `src/data/ranges.ts`，每张表必须标注：
- `conditions` —— 适用条件（人数 / 筹码深度 / ante / 抽水环境）
- `nature` —— `consensus`（共识标准）或 `simplified`（简化近似）
- `caveat` —— 简化的代价，`simplified` 时必填

不标注来源与假设的精确数字不进表。

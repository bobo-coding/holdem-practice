import { navigate } from '../lib/router'
import { load } from '../lib/storage'
import { RangeTrainer } from '../features/RangeTrainer'
import { CalcDrill } from '../features/CalcDrill'
import { TextureDrill } from '../features/TextureDrill'
import { SpotTrainer } from '../features/SpotTrainer'
import { RangeReadDrill } from '../features/RangeReadDrill'
import { PushFoldDrill } from '../features/PushFoldDrill'
import { GENERATORS, type GeneratorId } from '../data/generators'

const RFI_DRILL = 'rfi-6max-100bb'

interface Entry {
  id: string
  /** 统计用的 drill id，与存储里的 key 一致 */
  statId: string
  name: string
  desc: string
  level: string
  ready: boolean
}

const CATALOG: Entry[] = [
  {
    id: 'rfi',
    statId: RFI_DRILL,
    name: '翻前范围训练器',
    desc: '随机位置 + 手牌，判断开池或弃牌',
    level: 'L1',
    ready: true,
  },
  {
    id: 'odds',
    statId: 'odds',
    name: '赔率闪卡',
    desc: '限时计算跟注所需的最低胜率',
    level: 'L2',
    ready: true,
  },
  {
    id: 'ev',
    statId: 'ev',
    name: 'EV 计算题',
    desc: '诈唬 EV、盈亏平衡弃牌率、跟注 EV',
    level: 'L2',
    ready: true,
  },
  {
    id: 'combo',
    statId: 'combo',
    name: 'Combo 计数',
    desc: '数组合、算阻断牌的影响',
    level: 'L2',
    ready: true,
  },
  {
    id: 'texture',
    statId: 'texture',
    name: 'Board Texture 分类',
    desc: '牌面归类 + 谁有范围优势（真实模拟数据）',
    level: 'L3',
    ready: true,
  },
  {
    id: 'spot',
    statId: 'spot',
    name: 'Spot Trainer',
    desc: '完整局面多选 + 解析，覆盖翻牌到河牌',
    level: 'L3–L4',
    ready: true,
  },
  {
    id: 'readrange',
    statId: 'readrange',
    name: '范围推断题',
    desc: '在矩阵上画出对手范围，按组合数算重合度',
    level: 'L5',
    ready: true,
  },
  {
    id: 'freq',
    statId: 'freq',
    name: 'GTO 频率题',
    desc: 'MDF、诈唬占比、平衡需要的诈唬组合数',
    level: 'L6',
    ready: true,
  },
  {
    id: 'exploit',
    statId: 'exploit',
    name: '剥削调整题',
    desc: '给出对手统计，选择偏离均衡的方向',
    level: 'L6',
    ready: true,
  },
  {
    id: 'pushfold',
    statId: 'pushfold',
    name: 'Push/Fold 训练',
    desc: '3–15bb 单挑纳什表，SB 全下 / BB 跟注',
    level: 'L7',
    ready: true,
  },
  {
    id: 'icm',
    statId: 'icm',
    name: 'ICM 决策题',
    desc: '筹码折算奖金、泡沫期跟注所需胜率',
    level: 'L7',
    ready: true,
  },
]

export function DrillsPage() {
  const p = load()
  return (
    <>
      <div class="topbar">
        <h1>练习</h1>
      </div>

      {CATALOG.map((d) => {
        const s = p.drills[d.statId]
        const rate = s && s.attempts ? Math.round((s.correct / s.attempts) * 100) : null
        return (
          <div
            key={d.id}
            class={`card${d.ready ? ' tap' : ''}`}
            style={d.ready ? '' : 'opacity:.5'}
            onClick={() => d.ready && navigate(`/drills/${d.id}`)}
          >
            <div class="row">
              <b>{d.name}</b>
              <span class={`tag${rate !== null ? ' on' : ''}`}>
                {d.ready ? (rate !== null ? `${rate}% · ${s!.attempts} 题` : '开始') : '未上线'}
              </span>
            </div>
            <div class="muted">
              {d.level} · {d.desc}
            </div>
          </div>
        )
      })}
    </>
  )
}

export function DrillPage({ id }: { id: string }) {
  const entry = CATALOG.find((d) => d.id === id)
  const isCalc = id in GENERATORS
  return (
    <>
      <div class="topbar">
        <span class="back" onClick={() => navigate('/drills')}>
          ‹ 练习
        </span>
        <h1 style="font-size:17px">{entry?.name ?? '练习'}</h1>
      </div>
      {id === 'rfi' ? (
        <RangeTrainer />
      ) : id === 'texture' ? (
        <TextureDrill />
      ) : id === 'spot' ? (
        <SpotTrainer />
      ) : id === 'readrange' ? (
        <RangeReadDrill />
      ) : id === 'pushfold' ? (
        <PushFoldDrill />
      ) : isCalc ? (
        <CalcDrill id={id as GeneratorId} />
      ) : (
        <div class="card">这个训练还没上线。</div>
      )}
    </>
  )
}

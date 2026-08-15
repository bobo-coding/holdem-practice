import { navigate } from '../lib/router'
import { load } from '../lib/storage'
import { RangeTrainer } from '../features/RangeTrainer'

const CATALOG = [
  { id: 'rfi', name: '翻前范围训练器', desc: '随机位置 + 手牌，判断开池或弃牌', level: 'L1', ready: true },
  { id: 'odds', name: '赔率闪卡', desc: '限时计算底池赔率与必要胜率', level: 'L2', ready: false },
  { id: 'ev', name: 'EV 计算题', desc: '分步填空，给出完整解算', level: 'L2', ready: false },
  { id: 'combo', name: 'Combo 计数', desc: '给定范围数组合、算 blocker 影响', level: 'L2', ready: false },
  { id: 'texture', name: 'Board Texture 分类', desc: '牌面归类 + 谁有范围优势', level: 'L3', ready: false },
  { id: 'spot', name: 'Spot Trainer', desc: '完整局面多选 + 解析', level: 'L3–L6', ready: false },
  { id: 'readrange', name: '范围推断题', desc: '画出对手范围，比对重合度', level: 'L5', ready: false },
  { id: 'pushfold', name: 'Push/Fold 训练', desc: '筹码深度 + 位置 + ICM', level: 'L7', ready: false },
]

export function DrillsPage() {
  const p = load()
  return (
    <>
      <div class="topbar">
        <h1>练习</h1>
      </div>

      {CATALOG.map((d) => {
        const s = p.drills[d.id === 'rfi' ? 'rfi-6max-100bb' : d.id]
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
  return (
    <>
      <div class="topbar">
        <span class="back" onClick={() => navigate('/drills')}>
          ‹ 练习
        </span>
        <h1 style="font-size:17px">翻前范围</h1>
      </div>
      {id === 'rfi' ? <RangeTrainer /> : <div class="card">这个训练还没上线。</div>}
    </>
  )
}

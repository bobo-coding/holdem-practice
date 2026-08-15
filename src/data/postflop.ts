/**
 * 自动生成，请勿手改。来源：scripts/precompute-postflop.ts
 *
 * 双方范围为翻前范围（CO 开池 / BB 跟注），未按翻后行动收窄。
 * 绝对数值因此偏保守，但「转牌把范围推向哪个方向」的结论不受影响。
 */

export interface TurnRow {
  turn: string
  label: string
  /** CO 的胜率（%） */
  coEq: number
  /** 两对及以上的组合占比（%） */
  coStrong: number
  bbStrong: number
}

export interface TurnCase {
  flop: string[]
  rows: TurnRow[]
}

export interface BlockerRow {
  hero: string[]
  desc: string
  combos: number
}

export interface BlockerCase {
  board: string[]
  target: string
  baseline: number
  rows: BlockerRow[]
}

export const TURNS: TurnCase[] = [
  {
    "flop": [
      "K♠",
      "7♦",
      "2♣"
    ],
    "rows": [
      {
        "turn": "A♥",
        "label": "A —— 高于顶张的高张",
        "coEq": 57.8,
        "coStrong": 9.5,
        "bbStrong": 6.8
      },
      {
        "turn": "K♥",
        "label": "K —— 配对顶张",
        "coEq": 57.6,
        "coStrong": 40.9,
        "bbStrong": 34.8
      },
      {
        "turn": "7♥",
        "label": "7 —— 配对中张",
        "coEq": 56.1,
        "coStrong": 43.6,
        "bbStrong": 35.1
      },
      {
        "turn": "Q♥",
        "label": "Q —— 中高张",
        "coEq": 59.2,
        "coStrong": 7.9,
        "bbStrong": 5.3
      },
      {
        "turn": "8♥",
        "label": "8 —— 空牌",
        "coEq": 54.1,
        "coStrong": 6,
        "bbStrong": 7.2
      },
      {
        "turn": "3♥",
        "label": "3 —— 空牌",
        "coEq": 56.9,
        "coStrong": 4.5,
        "bbStrong": 4
      },
      {
        "turn": "5♠",
        "label": "5 —— 带来同花听牌",
        "coEq": 56.9,
        "coStrong": 4.6,
        "bbStrong": 4.6
      }
    ]
  },
  {
    "flop": [
      "J♠",
      "T♠",
      "9♦"
    ],
    "rows": [
      {
        "turn": "A♥",
        "label": "A —— 高张",
        "coEq": 57,
        "coStrong": 28.7,
        "bbStrong": 22.4
      },
      {
        "turn": "Q♥",
        "label": "Q —— 完成顺子",
        "coEq": 55.6,
        "coStrong": 52.7,
        "bbStrong": 50.2
      },
      {
        "turn": "8♥",
        "label": "8 —— 完成顺子",
        "coEq": 54.2,
        "coStrong": 43.8,
        "bbStrong": 47.3
      },
      {
        "turn": "2♠",
        "label": "2 —— 完成同花",
        "coEq": 56.6,
        "coStrong": 23.6,
        "bbStrong": 22.9
      },
      {
        "turn": "4♥",
        "label": "4 —— 空牌",
        "coEq": 57.6,
        "coStrong": 17.1,
        "bbStrong": 16.7
      }
    ]
  }
]

export const BLOCKERS: BlockerCase[] = [
  {
    "board": [
      "Q♠",
      "8♠",
      "3♠",
      "J♥",
      "2♦"
    ],
    "target": "已成同花的组合",
    "baseline": 31,
    "rows": [
      {
        "hero": [
          "A♠",
          "K♦"
        ],
        "desc": "持有 A♠",
        "combos": 23
      },
      {
        "hero": [
          "K♠",
          "Q♦"
        ],
        "desc": "持有 K♠",
        "combos": 23
      },
      {
        "hero": [
          "A♥",
          "K♦"
        ],
        "desc": "持有 A♥（不阻断黑桃）",
        "combos": 31
      }
    ]
  },
  {
    "board": [
      "Q♠",
      "8♠",
      "3♠",
      "J♥",
      "2♦"
    ],
    "target": "坚果同花的组合",
    "baseline": 8,
    "rows": [
      {
        "hero": [
          "A♠",
          "K♦"
        ],
        "desc": "持有 A♠",
        "combos": 0
      },
      {
        "hero": [
          "A♥",
          "K♦"
        ],
        "desc": "持有 A♥",
        "combos": 8
      }
    ]
  },
  {
    "board": [
      "A♠",
      "K♦",
      "7♣",
      "4♥",
      "2♠"
    ],
    "target": "两对及以上的组合",
    "baseline": 55,
    "rows": [
      {
        "hero": [
          "A♥",
          "Q♦"
        ],
        "desc": "持有一张 A",
        "combos": 46
      },
      {
        "hero": [
          "K♥",
          "Q♦"
        ],
        "desc": "持有一张 K",
        "combos": 51
      },
      {
        "hero": [
          "Q♥",
          "J♦"
        ],
        "desc": "两张都不阻断",
        "combos": 55
      }
    ]
  }
]

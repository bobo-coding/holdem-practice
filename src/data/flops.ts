/**
 * 自动生成，请勿手改。来源：scripts/precompute-flops.ts
 *
 * CO 开池范围（rfi-6max-100bb）对 BB 跟注范围（bb-call-vs-co）在各翻牌上的对抗数据。
 * 胜率为 300,000 次蒙特卡洛（含平分的一半），成牌分布为全组合精确统计。
 */

export interface FlopData {
  board: string[]
  group: string
  /** CO 的胜率（%），BB 的等于 100 减去它 */
  coEq: number
  /** 两对及以上的组合占比（%） */
  coStrong: number
  bbStrong: number
  /** 顶对 / 超对及以上的组合占比（%） */
  coTop: number
  bbTop: number
}

export const FLOPS: FlopData[] = [
  {
    "board": [
      "K♠",
      "7♦",
      "2♣"
    ],
    "group": "干燥高张",
    "coEq": 57.2,
    "coStrong": 3.5,
    "bbStrong": 3.1,
    "coTop": 22.8,
    "bbTop": 16
  },
  {
    "board": [
      "A♠",
      "8♦",
      "3♣"
    ],
    "group": "干燥高张",
    "coEq": 56.5,
    "coStrong": 4.3,
    "bbStrong": 4.5,
    "coTop": 29.2,
    "bbTop": 22.3
  },
  {
    "board": [
      "Q♠",
      "6♦",
      "2♣"
    ],
    "group": "干燥高张",
    "coEq": 59.5,
    "coStrong": 2.9,
    "bbStrong": 1.4,
    "coTop": 23.9,
    "bbTop": 13.6
  },
  {
    "board": [
      "9♠",
      "5♦",
      "2♣"
    ],
    "group": "干燥中低",
    "coEq": 54.8,
    "coStrong": 2.8,
    "bbStrong": 1.6,
    "coTop": 21.4,
    "bbTop": 19.1
  },
  {
    "board": [
      "7♠",
      "4♦",
      "2♣"
    ],
    "group": "干燥低张",
    "coEq": 55.1,
    "coStrong": 2.7,
    "bbStrong": 1.9,
    "coTop": 20.1,
    "bbTop": 18.7
  },
  {
    "board": [
      "K♠",
      "K♦",
      "7♣"
    ],
    "group": "配对面",
    "coEq": 56.7,
    "coStrong": 40.3,
    "bbStrong": 32.8,
    "coTop": 40.3,
    "bbTop": 32.8
  },
  {
    "board": [
      "7♠",
      "7♦",
      "2♣"
    ],
    "group": "配对面",
    "coEq": 55.3,
    "coStrong": 25.4,
    "bbStrong": 21,
    "coTop": 25.4,
    "bbTop": 21
  },
  {
    "board": [
      "J♠",
      "J♦",
      "4♣"
    ],
    "group": "配对面",
    "coEq": 60,
    "coStrong": 37.3,
    "bbStrong": 24.4,
    "coTop": 37.3,
    "bbTop": 24.4
  },
  {
    "board": [
      "2♠",
      "2♦",
      "9♣"
    ],
    "group": "配对面",
    "coEq": 56.2,
    "coStrong": 31.3,
    "bbStrong": 26,
    "coTop": 31.3,
    "bbTop": 26
  },
  {
    "board": [
      "J♠",
      "T♠",
      "9♦"
    ],
    "group": "双色连接",
    "coEq": 56.6,
    "coStrong": 15.8,
    "bbStrong": 15.8,
    "coTop": 35.3,
    "bbTop": 25.9
  },
  {
    "board": [
      "9♠",
      "8♠",
      "6♦"
    ],
    "group": "双色连接",
    "coEq": 49.7,
    "coStrong": 4.4,
    "bbStrong": 5.6,
    "coTop": 22.5,
    "bbTop": 21.3
  },
  {
    "board": [
      "7♠",
      "6♠",
      "5♦"
    ],
    "group": "双色连接",
    "coEq": 49.6,
    "coStrong": 5.5,
    "bbStrong": 7.5,
    "coTop": 22.1,
    "bbTop": 22.5
  },
  {
    "board": [
      "A♠",
      "9♠",
      "4♦"
    ],
    "group": "双色干燥",
    "coEq": 55.6,
    "coStrong": 6.7,
    "bbStrong": 4.5,
    "coTop": 28.8,
    "bbTop": 22.3
  },
  {
    "board": [
      "K♠",
      "8♠",
      "3♦"
    ],
    "group": "双色干燥",
    "coEq": 56.2,
    "coStrong": 3.9,
    "bbStrong": 3.1,
    "coTop": 23.2,
    "bbTop": 16.2
  },
  {
    "board": [
      "J♠",
      "8♠",
      "3♠"
    ],
    "group": "单色",
    "coEq": 55.2,
    "coStrong": 10.3,
    "bbStrong": 9.1,
    "coTop": 32.5,
    "bbTop": 21.2
  },
  {
    "board": [
      "A♠",
      "Q♠",
      "5♠"
    ],
    "group": "单色",
    "coEq": 57.3,
    "coStrong": 12.4,
    "bbStrong": 7.9,
    "coTop": 35.1,
    "bbTop": 27.8
  },
  {
    "board": [
      "9♠",
      "6♠",
      "2♠"
    ],
    "group": "单色",
    "coEq": 53.2,
    "coStrong": 9.6,
    "bbStrong": 8,
    "coTop": 28.3,
    "bbTop": 25.1
  },
  {
    "board": [
      "A♠",
      "K♦",
      "Q♣"
    ],
    "group": "大牌面",
    "coEq": 59.6,
    "coStrong": 18.8,
    "bbStrong": 4.7,
    "coTop": 39.5,
    "bbTop": 27.5
  },
  {
    "board": [
      "K♠",
      "Q♦",
      "J♣"
    ],
    "group": "大牌面",
    "coEq": 59.3,
    "coStrong": 19.6,
    "bbStrong": 11.5,
    "coTop": 33.3,
    "bbTop": 23.1
  },
  {
    "board": [
      "A♠",
      "J♦",
      "T♣"
    ],
    "group": "大牌面",
    "coEq": 59.7,
    "coStrong": 18.8,
    "bbStrong": 9.3,
    "coTop": 39.4,
    "bbTop": 27.6
  },
  {
    "board": [
      "9♠",
      "8♦",
      "7♣"
    ],
    "group": "中张连接",
    "coEq": 51.4,
    "coStrong": 11.1,
    "bbStrong": 11.3,
    "coTop": 28.3,
    "bbTop": 25.5
  },
  {
    "board": [
      "T♠",
      "9♦",
      "8♣"
    ],
    "group": "中张连接",
    "coEq": 54.3,
    "coStrong": 11.6,
    "bbStrong": 13.6,
    "coTop": 35.5,
    "bbTop": 25
  },
  {
    "board": [
      "6♠",
      "5♦",
      "4♣"
    ],
    "group": "低张连接",
    "coEq": 51.7,
    "coStrong": 5.2,
    "bbStrong": 5.4,
    "coTop": 22.6,
    "bbTop": 18.5
  },
  {
    "board": [
      "5♠",
      "4♦",
      "3♣"
    ],
    "group": "低张连接",
    "coEq": 53.9,
    "coStrong": 5.7,
    "bbStrong": 8.1,
    "coTop": 23.9,
    "bbTop": 18.9
  }
]

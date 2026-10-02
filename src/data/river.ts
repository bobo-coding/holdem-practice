/**
 * 自动生成，请勿手改。来源：scripts/precompute-river.ts
 *
 * L6 的完整求解河牌局面。CFR+ 迭代 4000 轮，无随机性，重复运行结果一致。
 * EV 单位为 bb，以河牌开始时为 0 点：CO 的 EV 是他从这个 20bb 底池里平均拿走多少。
 */

export const RIVER = {
 "board": [
  "K♦",
  "8♣",
  "4♠",
  "7♥",
  "2♣"
 ],
 "pot": 20,
 "stack": 80,
 "sizes": [
  10,
  20,
  40
 ],
 "ranges": {
  "co": "AA, KK, 88, 77, 44, AKs, AKo, KQs, KQo, KJs, KTs, K8s, 87s, 65s, T9s, J9s, JTs, QJs, QTs, AQs, AJs, ATs, 54s",
  "bb": "K9s, K7s-K2s, K9o, K7o, A8s, Q8s, J8s, T8s, 98s, 86s, 76s, 75s, 65s, 98o, 87o, 76o, 44, 77, 22, T9s, T9o, 96s"
 },
 "combos": {
  "co": 91,
  "bb": 116
 },
 "equilibrium": {
  "ev": 11.96,
  "exploitability": 0.0001,
  "summary": {
   "freq": [
    68.2,
    2.7,
    0,
    29.1
   ],
   "bluffShare": [
    43.3,
    28.4,
    35.5
   ]
  },
  "callRate": [
   {
    "size": 10,
    "call": 53.3,
    "mdf": 66.7
   },
   {
    "size": 20,
    "call": 38.4,
    "mdf": 50
   },
   {
    "size": 40,
    "call": 26,
    "mdf": 33.3
   }
  ],
  "co": [
   {
    "code": "65s",
    "combos": 4,
    "showdown": 98.6,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 29.38,
    "actionEV": [
     19.72,
     24.89,
     27.19,
     29.38
    ]
   },
   {
    "code": "KK",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 25.65,
    "actionEV": [
     19.14,
     23.67,
     25.49,
     25.65
    ]
   },
   {
    "code": "88",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 26.54,
    "actionEV": [
     19.14,
     23.62,
     26.26,
     26.54
    ]
   },
   {
    "code": "77",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     3.6,
     0,
     96.3
    ],
    "ev": 23.38,
    "actionEV": [
     19.13,
     23.07,
     23.33,
     23.38
    ]
   },
   {
    "code": "44",
    "combos": 3,
    "showdown": 93.7,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 24.26,
    "actionEV": [
     18.75,
     22.84,
     24.13,
     24.26
    ]
   },
   {
    "code": "K8s",
    "combos": 2,
    "showdown": 86,
    "freq": [
     0,
     39.9,
     0.1,
     60
    ],
    "ev": 19.73,
    "actionEV": [
     17.2,
     19.73,
     19.69,
     19.73
    ]
   },
   {
    "code": "87s",
    "combos": 2,
    "showdown": 75.8,
    "freq": [
     64.4,
     35.6,
     0,
     0
    ],
    "ev": 15.16,
    "actionEV": [
     15.16,
     15.16,
     14.38,
     12.9
    ]
   },
   {
    "code": "AKs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     97.4,
     2.6,
     0,
     0
    ],
    "ev": 14.49,
    "actionEV": [
     14.49,
     14.42,
     12.67,
     8.64
    ]
   },
   {
    "code": "AKo",
    "combos": 9,
    "showdown": 72.4,
    "freq": [
     99.9,
     0.1,
     0,
     0
    ],
    "ev": 14.48,
    "actionEV": [
     14.48,
     14.41,
     12.67,
     8.63
    ]
   },
   {
    "code": "KQs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     97.4,
     2.6,
     0,
     0
    ],
    "ev": 14.49,
    "actionEV": [
     14.49,
     14.43,
     12.67,
     8.64
    ]
   },
   {
    "code": "KQo",
    "combos": 9,
    "showdown": 72.4,
    "freq": [
     99.9,
     0.1,
     0,
     0
    ],
    "ev": 14.48,
    "actionEV": [
     14.48,
     14.41,
     12.67,
     8.63
    ]
   },
   {
    "code": "KJs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     97.4,
     2.6,
     0,
     0
    ],
    "ev": 14.49,
    "actionEV": [
     14.49,
     14.43,
     12.67,
     8.64
    ]
   },
   {
    "code": "KTs",
    "combos": 3,
    "showdown": 71.3,
    "freq": [
     97.4,
     2.6,
     0,
     0
    ],
    "ev": 14.27,
    "actionEV": [
     14.27,
     14.22,
     12.39,
     8.18
    ]
   },
   {
    "code": "AA",
    "combos": 6,
    "showdown": 71.2,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 14.24,
    "actionEV": [
     14.24,
     13.97,
     12.29,
     8.45
    ]
   },
   {
    "code": "54s",
    "combos": 3,
    "showdown": 18,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 4.26,
    "actionEV": [
     3.6,
     3.93,
     4.08,
     4.26
    ]
   },
   {
    "code": "QJs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     72.6,
     2.4,
     0,
     25
    ],
    "ev": 3.56,
    "actionEV": [
     3.49,
     3.49,
     3.49,
     3.49
    ]
   },
   {
    "code": "AQs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     72.6,
     2.4,
     0,
     25
    ],
    "ev": 3.56,
    "actionEV": [
     3.49,
     3.49,
     3.49,
     3.49
    ]
   },
   {
    "code": "AJs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     72.6,
     2.4,
     0,
     25
    ],
    "ev": 3.56,
    "actionEV": [
     3.49,
     3.49,
     3.49,
     3.49
    ]
   },
   {
    "code": "JTs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     75,
     0,
     0,
     25
    ],
    "ev": 2.96,
    "actionEV": [
     2.9,
     2.83,
     2.87,
     2.89
    ]
   },
   {
    "code": "QTs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     75,
     0,
     0,
     25
    ],
    "ev": 2.96,
    "actionEV": [
     2.9,
     2.83,
     2.87,
     2.89
    ]
   },
   {
    "code": "ATs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     75,
     0,
     0,
     25
    ],
    "ev": 2.96,
    "actionEV": [
     2.9,
     2.83,
     2.87,
     2.89
    ]
   },
   {
    "code": "J9s",
    "combos": 4,
    "showdown": 14.4,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 2.88,
    "actionEV": [
     2.88,
     2.08,
     2.02,
     1.87
    ]
   },
   {
    "code": "T9s",
    "combos": 4,
    "showdown": 7.4,
    "freq": [
     83.7,
     6.4,
     0,
     9.8
    ],
    "ev": 1.48,
    "actionEV": [
     1.48,
     1.48,
     1.46,
     1.33
    ]
   }
  ],
  "bb": [
   [
    {
     "code": "65s",
     "combos": 4,
     "showdown": 98.3,
     "call": 100
    },
    {
     "code": "77",
     "combos": 3,
     "showdown": 88.5,
     "call": 100
    },
    {
     "code": "44",
     "combos": 3,
     "showdown": 84.9,
     "call": 100
    },
    {
     "code": "87o",
     "combos": 7,
     "showdown": 83.9,
     "call": 100
    },
    {
     "code": "K7o",
     "combos": 7,
     "showdown": 82.4,
     "call": 100
    },
    {
     "code": "22",
     "combos": 3,
     "showdown": 82.4,
     "call": 100
    },
    {
     "code": "K7s",
     "combos": 2,
     "showdown": 82.2,
     "call": 100
    },
    {
     "code": "K4s",
     "combos": 2,
     "showdown": 82.1,
     "call": 100
    },
    {
     "code": "K2s",
     "combos": 2,
     "showdown": 80.8,
     "call": 100
    },
    {
     "code": "K6s",
     "combos": 3,
     "showdown": 45.3,
     "call": 78.7
    },
    {
     "code": "K5s",
     "combos": 3,
     "showdown": 44.8,
     "call": 78.5
    },
    {
     "code": "K3s",
     "combos": 3,
     "showdown": 44.7,
     "call": 78.7
    },
    {
     "code": "K9s",
     "combos": 3,
     "showdown": 43.2,
     "call": 7.9
    },
    {
     "code": "K9o",
     "combos": 9,
     "showdown": 43.2,
     "call": 3.2
    },
    {
     "code": "A8s",
     "combos": 3,
     "showdown": 40.7,
     "call": 66.5
    },
    {
     "code": "86s",
     "combos": 3,
     "showdown": 40.4,
     "call": 99.4
    },
    {
     "code": "76s",
     "combos": 3,
     "showdown": 40.1,
     "call": 60.1
    },
    {
     "code": "76o",
     "combos": 9,
     "showdown": 40.1,
     "call": 60.1
    },
    {
     "code": "75s",
     "combos": 3,
     "showdown": 39.6,
     "call": 60.1
    },
    {
     "code": "Q8s",
     "combos": 3,
     "showdown": 39.2,
     "call": 66
    },
    {
     "code": "98s",
     "combos": 3,
     "showdown": 38.5,
     "call": 35.4
    },
    {
     "code": "98o",
     "combos": 9,
     "showdown": 38.5,
     "call": 36.6
    },
    {
     "code": "J8s",
     "combos": 3,
     "showdown": 37.4,
     "call": 66.1
    },
    {
     "code": "T8s",
     "combos": 3,
     "showdown": 37.4,
     "call": 36.2
    },
    {
     "code": "T9s",
     "combos": 4,
     "showdown": 1.8,
     "call": 0
    },
    {
     "code": "T9o",
     "combos": 12,
     "showdown": 1.2,
     "call": 0
    },
    {
     "code": "96s",
     "combos": 4,
     "showdown": 0,
     "call": 0
    }
   ],
   [
    {
     "code": "65s",
     "combos": 4,
     "showdown": 98.3,
     "call": 100
    },
    {
     "code": "77",
     "combos": 3,
     "showdown": 88.5,
     "call": 100
    },
    {
     "code": "44",
     "combos": 3,
     "showdown": 84.9,
     "call": 100
    },
    {
     "code": "87o",
     "combos": 7,
     "showdown": 83.9,
     "call": 94.4
    },
    {
     "code": "K7o",
     "combos": 7,
     "showdown": 82.4,
     "call": 97.3
    },
    {
     "code": "22",
     "combos": 3,
     "showdown": 82.4,
     "call": 100
    },
    {
     "code": "K7s",
     "combos": 2,
     "showdown": 82.2,
     "call": 95.3
    },
    {
     "code": "K4s",
     "combos": 2,
     "showdown": 82.1,
     "call": 29
    },
    {
     "code": "K2s",
     "combos": 2,
     "showdown": 80.8,
     "call": 78.1
    },
    {
     "code": "K6s",
     "combos": 3,
     "showdown": 45.3,
     "call": 35.5
    },
    {
     "code": "K5s",
     "combos": 3,
     "showdown": 44.8,
     "call": 20.3
    },
    {
     "code": "K3s",
     "combos": 3,
     "showdown": 44.7,
     "call": 34.5
    },
    {
     "code": "K9s",
     "combos": 3,
     "showdown": 43.2,
     "call": 12.2
    },
    {
     "code": "K9o",
     "combos": 9,
     "showdown": 43.2,
     "call": 9.7
    },
    {
     "code": "A8s",
     "combos": 3,
     "showdown": 40.7,
     "call": 13.1
    },
    {
     "code": "86s",
     "combos": 3,
     "showdown": 40.4,
     "call": 21.3
    },
    {
     "code": "76s",
     "combos": 3,
     "showdown": 40.1,
     "call": 78.3
    },
    {
     "code": "76o",
     "combos": 9,
     "showdown": 40.1,
     "call": 78.3
    },
    {
     "code": "75s",
     "combos": 3,
     "showdown": 39.6,
     "call": 30.4
    },
    {
     "code": "Q8s",
     "combos": 3,
     "showdown": 39.2,
     "call": 13
    },
    {
     "code": "98s",
     "combos": 3,
     "showdown": 38.5,
     "call": 6.3
    },
    {
     "code": "98o",
     "combos": 9,
     "showdown": 38.5,
     "call": 6.1
    },
    {
     "code": "J8s",
     "combos": 3,
     "showdown": 37.4,
     "call": 13.3
    },
    {
     "code": "T8s",
     "combos": 3,
     "showdown": 37.4,
     "call": 6.3
    },
    {
     "code": "T9s",
     "combos": 4,
     "showdown": 1.8,
     "call": 0
    },
    {
     "code": "T9o",
     "combos": 12,
     "showdown": 1.2,
     "call": 0
    },
    {
     "code": "96s",
     "combos": 4,
     "showdown": 0,
     "call": 0
    }
   ],
   [
    {
     "code": "65s",
     "combos": 4,
     "showdown": 98.3,
     "call": 100
    },
    {
     "code": "77",
     "combos": 3,
     "showdown": 88.5,
     "call": 100
    },
    {
     "code": "44",
     "combos": 3,
     "showdown": 84.9,
     "call": 65.7
    },
    {
     "code": "87o",
     "combos": 7,
     "showdown": 83.9,
     "call": 100
    },
    {
     "code": "K7o",
     "combos": 7,
     "showdown": 82.4,
     "call": 100
    },
    {
     "code": "22",
     "combos": 3,
     "showdown": 82.4,
     "call": 21.3
    },
    {
     "code": "K7s",
     "combos": 2,
     "showdown": 82.2,
     "call": 100
    },
    {
     "code": "K4s",
     "combos": 2,
     "showdown": 82.1,
     "call": 10.6
    },
    {
     "code": "K2s",
     "combos": 2,
     "showdown": 80.8,
     "call": 0
    },
    {
     "code": "K6s",
     "combos": 3,
     "showdown": 45.3,
     "call": 75.9
    },
    {
     "code": "K5s",
     "combos": 3,
     "showdown": 44.8,
     "call": 33.3
    },
    {
     "code": "K3s",
     "combos": 3,
     "showdown": 44.7,
     "call": 0
    },
    {
     "code": "K9s",
     "combos": 3,
     "showdown": 43.2,
     "call": 0
    },
    {
     "code": "K9o",
     "combos": 9,
     "showdown": 43.2,
     "call": 0
    },
    {
     "code": "A8s",
     "combos": 3,
     "showdown": 40.7,
     "call": 0
    },
    {
     "code": "86s",
     "combos": 3,
     "showdown": 40.4,
     "call": 78.3
    },
    {
     "code": "76s",
     "combos": 3,
     "showdown": 40.1,
     "call": 0.5
    },
    {
     "code": "76o",
     "combos": 9,
     "showdown": 40.1,
     "call": 0.5
    },
    {
     "code": "75s",
     "combos": 3,
     "showdown": 39.6,
     "call": 0
    },
    {
     "code": "Q8s",
     "combos": 3,
     "showdown": 39.2,
     "call": 0
    },
    {
     "code": "98s",
     "combos": 3,
     "showdown": 38.5,
     "call": 0
    },
    {
     "code": "98o",
     "combos": 9,
     "showdown": 38.5,
     "call": 0
    },
    {
     "code": "J8s",
     "combos": 3,
     "showdown": 37.4,
     "call": 0
    },
    {
     "code": "T8s",
     "combos": 3,
     "showdown": 37.4,
     "call": 0
    },
    {
     "code": "T9s",
     "combos": 4,
     "showdown": 1.8,
     "call": 0
    },
    {
     "code": "T9o",
     "combos": 12,
     "showdown": 1.2,
     "call": 0
    },
    {
     "code": "96s",
     "combos": 4,
     "showdown": 0,
     "call": 0
    }
   ]
  ]
 },
 "single": [
  {
   "size": 10,
   "ev": 11.52,
   "loss": 0.44,
   "freq": [
    71.8,
    28.2,
    0,
    0
   ]
  },
  {
   "size": 20,
   "ev": 11.82,
   "loss": 0.14,
   "freq": [
    72,
    0,
    28,
    0
   ]
  },
  {
   "size": 40,
   "ev": 11.95,
   "loss": 0.01,
   "freq": [
    70.7,
    0,
    0,
    29.3
   ]
  }
 ],
 "checkOnly": 10.72,
 "overfold": {
  "delta": -0.15,
  "callRate": [
   {
    "size": 10,
    "call": 38.3,
    "mdf": 66.7
   },
   {
    "size": 20,
    "call": 23.4,
    "mdf": 50
   },
   {
    "size": 40,
    "call": 11,
    "mdf": 33.3
   }
  ],
  "eqStrategyEV": 12.04,
  "exploitEV": 15.28,
  "counteredEV": -2.62,
  "vsEquilibriumEV": 11.68,
  "summary": {
   "freq": [
    39.6,
    8.8,
    11,
    40.7
   ],
   "bluffShare": [
    0,
    0,
    100
   ]
  },
  "byCode": [
   {
    "code": "65s",
    "combos": 4,
    "showdown": 98.6,
    "freq": [
     0,
     0,
     100,
     0
    ],
    "ev": 24.43,
    "actionEV": [
     19.72,
     23.4,
     24.43,
     23.11
    ]
   },
   {
    "code": "KK",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     0,
     100,
     0
    ],
    "ev": 22.33,
    "actionEV": [
     19.14,
     21.71,
     22.33,
     21.35
    ]
   },
   {
    "code": "88",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     0,
     100,
     0
    ],
    "ev": 22.79,
    "actionEV": [
     19.14,
     22.47,
     22.79,
     20.15
    ]
   },
   {
    "code": "77",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 21.59,
    "actionEV": [
     19.13,
     21.59,
     20.91,
     18.86
    ]
   },
   {
    "code": "44",
    "combos": 3,
    "showdown": 93.7,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 21.2,
    "actionEV": [
     18.75,
     21.2,
     20.9,
     17.74
    ]
   },
   {
    "code": "K8s",
    "combos": 2,
    "showdown": 86,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 18.14,
    "actionEV": [
     17.2,
     18.14,
     16.64,
     15.11
    ]
   },
   {
    "code": "87s",
    "combos": 2,
    "showdown": 75.8,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 15.32,
    "actionEV": [
     15.16,
     14.03,
     11.98,
     15.32
    ]
   },
   {
    "code": "AKs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 14.49,
    "actionEV": [
     14.49,
     12.67,
     9.94,
     12.41
    ]
   },
   {
    "code": "AKo",
    "combos": 9,
    "showdown": 72.4,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 14.48,
    "actionEV": [
     14.48,
     12.65,
     9.93,
     12.41
    ]
   },
   {
    "code": "KQs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 14.49,
    "actionEV": [
     14.49,
     12.71,
     9.94,
     12.41
    ]
   },
   {
    "code": "KQo",
    "combos": 9,
    "showdown": 72.4,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 14.48,
    "actionEV": [
     14.48,
     12.7,
     9.93,
     12.41
    ]
   },
   {
    "code": "KJs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 14.49,
    "actionEV": [
     14.49,
     12.71,
     9.94,
     12.41
    ]
   },
   {
    "code": "KTs",
    "combos": 3,
    "showdown": 71.3,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 14.27,
    "actionEV": [
     14.27,
     12.42,
     9.54,
     12.11
    ]
   },
   {
    "code": "AA",
    "combos": 6,
    "showdown": 71.2,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 14.24,
    "actionEV": [
     14.24,
     12.38,
     9.72,
     13.11
    ]
   },
   {
    "code": "54s",
    "combos": 3,
    "showdown": 18,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 14.14,
    "actionEV": [
     3.6,
     8.79,
     10.54,
     14.14
    ]
   },
   {
    "code": "QJs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 13.11,
    "actionEV": [
     3.49,
     8.02,
     9.72,
     13.11
    ]
   },
   {
    "code": "AQs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 13.11,
    "actionEV": [
     3.49,
     8.15,
     9.72,
     13.11
    ]
   },
   {
    "code": "AJs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 13.11,
    "actionEV": [
     3.49,
     8.15,
     9.72,
     13.11
    ]
   },
   {
    "code": "JTs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 12.86,
    "actionEV": [
     2.9,
     7.59,
     9.34,
     12.86
    ]
   },
   {
    "code": "QTs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 12.86,
    "actionEV": [
     2.9,
     7.59,
     9.34,
     12.86
    ]
   },
   {
    "code": "ATs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 12.86,
    "actionEV": [
     2.9,
     7.72,
     9.34,
     12.86
    ]
   },
   {
    "code": "J9s",
    "combos": 4,
    "showdown": 14.4,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 12.43,
    "actionEV": [
     2.88,
     6.88,
     8.71,
     12.43
    ]
   },
   {
    "code": "T9s",
    "combos": 4,
    "showdown": 7.4,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 12.21,
    "actionEV": [
     1.48,
     6.49,
     8.37,
     12.21
    ]
   }
  ]
 },
 "overcall": {
  "delta": 0.15,
  "callRate": [
   {
    "size": 10,
    "call": 68.3,
    "mdf": 66.7
   },
   {
    "size": 20,
    "call": 53.4,
    "mdf": 50
   },
   {
    "size": 40,
    "call": 41,
    "mdf": 33.3
   }
  ],
  "eqStrategyEV": 12,
  "exploitEV": 13.48,
  "counteredEV": 9.34,
  "vsEquilibriumEV": 11.88,
  "summary": {
   "freq": [
    38.5,
    41.8,
    2.2,
    17.6
   ],
   "bluffShare": [
    0,
    0,
    0
   ]
  },
  "byCode": [
   {
    "code": "65s",
    "combos": 4,
    "showdown": 98.6,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 35.63,
    "actionEV": [
     19.72,
     26.4,
     30.23,
     35.63
    ]
   },
   {
    "code": "KK",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 29.12,
    "actionEV": [
     19.14,
     24.57,
     26.79,
     29.12
    ]
   },
   {
    "code": "88",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 34.06,
    "actionEV": [
     19.14,
     25.4,
     29.96,
     34.06
    ]
   },
   {
    "code": "77",
    "combos": 3,
    "showdown": 95.7,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 30.98,
    "actionEV": [
     19.13,
     24.73,
     27.03,
     30.98
    ]
   },
   {
    "code": "44",
    "combos": 3,
    "showdown": 93.7,
    "freq": [
     0,
     0,
     0,
     100
    ],
    "ev": 29.75,
    "actionEV": [
     18.75,
     24.39,
     27.1,
     29.75
    ]
   },
   {
    "code": "K8s",
    "combos": 2,
    "showdown": 86,
    "freq": [
     0,
     0,
     100,
     0
    ],
    "ev": 22.28,
    "actionEV": [
     17.2,
     21.1,
     22.28,
     21.38
    ]
   },
   {
    "code": "87s",
    "combos": 2,
    "showdown": 75.8,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 16.93,
    "actionEV": [
     15.16,
     16.93,
     16.72,
     12.73
    ]
   },
   {
    "code": "AKs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 15.64,
    "actionEV": [
     14.49,
     15.64,
     13.89,
     7.88
    ]
   },
   {
    "code": "AKo",
    "combos": 9,
    "showdown": 72.4,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 15.62,
    "actionEV": [
     14.48,
     15.62,
     13.89,
     7.87
    ]
   },
   {
    "code": "KQs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 15.66,
    "actionEV": [
     14.49,
     15.66,
     13.89,
     7.88
    ]
   },
   {
    "code": "KQo",
    "combos": 9,
    "showdown": 72.4,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 15.65,
    "actionEV": [
     14.48,
     15.65,
     13.89,
     7.87
    ]
   },
   {
    "code": "KJs",
    "combos": 3,
    "showdown": 72.4,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 15.66,
    "actionEV": [
     14.49,
     15.66,
     13.89,
     7.88
    ]
   },
   {
    "code": "KTs",
    "combos": 3,
    "showdown": 71.3,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 15.51,
    "actionEV": [
     14.27,
     15.51,
     13.66,
     7.4
    ]
   },
   {
    "code": "AA",
    "combos": 6,
    "showdown": 71.2,
    "freq": [
     0,
     100,
     0,
     0
    ],
    "ev": 15.44,
    "actionEV": [
     14.24,
     15.44,
     14.03,
     8.31
    ]
   },
   {
    "code": "54s",
    "combos": 3,
    "showdown": 18,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 3.6,
    "actionEV": [
     3.6,
     -0.72,
     -1.83,
     -4.17
    ]
   },
   {
    "code": "QJs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 3.49,
    "actionEV": [
     3.49,
     -1.05,
     -2.64,
     -5.7
    ]
   },
   {
    "code": "AQs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 3.49,
    "actionEV": [
     3.49,
     -0.98,
     -2.64,
     -5.7
    ]
   },
   {
    "code": "AJs",
    "combos": 4,
    "showdown": 17.5,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 3.49,
    "actionEV": [
     3.49,
     -0.98,
     -2.64,
     -5.7
    ]
   },
   {
    "code": "JTs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 2.9,
    "actionEV": [
     2.9,
     -1.87,
     -3.48,
     -6.64
    ]
   },
   {
    "code": "QTs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 2.9,
    "actionEV": [
     2.9,
     -1.87,
     -3.48,
     -6.64
    ]
   },
   {
    "code": "ATs",
    "combos": 4,
    "showdown": 14.5,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 2.9,
    "actionEV": [
     2.9,
     -1.8,
     -3.48,
     -6.64
    ]
   },
   {
    "code": "J9s",
    "combos": 4,
    "showdown": 14.4,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 2.88,
    "actionEV": [
     2.88,
     -2.08,
     -3.88,
     -7.56
    ]
   },
   {
    "code": "T9s",
    "combos": 4,
    "showdown": 7.4,
    "freq": [
     100,
     0,
     0,
     0
    ],
    "ev": 1.48,
    "actionEV": [
     1.48,
     -2.8,
     -4.6,
     -8.38
    ]
   }
  ]
 },
 "lockSeries": [
  {
   "delta": -0.15,
   "eqStrategyEV": 12.04,
   "exploitEV": 15.28,
   "counteredEV": -2.62,
   "vsEquilibriumEV": 11.68
  },
  {
   "delta": -0.1,
   "eqStrategyEV": 12.01,
   "exploitEV": 14.09,
   "counteredEV": -1.96,
   "vsEquilibriumEV": 11.8
  },
  {
   "delta": -0.05,
   "eqStrategyEV": 11.98,
   "exploitEV": 12.98,
   "counteredEV": -1.18,
   "vsEquilibriumEV": 11.88
  },
  {
   "delta": 0.05,
   "eqStrategyEV": 11.97,
   "exploitEV": 12.41,
   "counteredEV": 9.34,
   "vsEquilibriumEV": 11.88
  },
  {
   "delta": 0.1,
   "eqStrategyEV": 11.98,
   "exploitEV": 12.93,
   "counteredEV": 9.34,
   "vsEquilibriumEV": 11.88
  },
  {
   "delta": 0.15,
   "eqStrategyEV": 12,
   "exploitEV": 13.48,
   "counteredEV": 9.34,
   "vsEquilibriumEV": 11.88
  }
 ],
 "rule": {
  "value": [
   "65s",
   "KK",
   "88",
   "77",
   "44"
  ],
  "bluff": [
   "54s",
   "QJs",
   "AQs"
  ],
  "vsEquilibrium": 11.9,
  "worstCase": 11.27,
  "summary": {
   "freq": [
    70.3,
    0,
    0,
    29.7
   ],
   "bluffShare": [
    0,
    0,
    40.7
   ]
  }
 }
} as const

export type RiverData = typeof RIVER

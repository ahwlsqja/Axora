/** Preset intent definition for goal-based entry points */
export interface PresetIntent {
  id: string
  titleKo: string
  titleEn: string
  descriptionKo: string
  descriptionEn: string
  icon: string
  category: 'accumulate' | 'protect' | 'profit' | 'entry'
}

/** 6 preset intents covering core trading goals */
export const PRESET_INTENTS: PresetIntent[] = [
  {
    id: 'dca-inj',
    titleKo: 'INJ 분할매수',
    titleEn: 'DCA into INJ',
    descriptionKo: '일정 주기로 INJ를 나눠 매수합니다',
    descriptionEn: 'Buy INJ at regular intervals',
    icon: '📊',
    category: 'accumulate',
  },
  {
    id: 'stop-loss',
    titleKo: '손절 설정',
    titleEn: 'Set stop-loss',
    descriptionKo: '가격 하락 시 자동으로 매도합니다',
    descriptionEn: 'Auto-sell when price drops below threshold',
    icon: '🛡️',
    category: 'protect',
  },
  {
    id: 'scale-in',
    titleKo: '눌림목 매수',
    titleEn: 'Scale into dip',
    descriptionKo: '가격 하락 구간에서 분할 매수합니다',
    descriptionEn: 'Buy more as price dips lower',
    icon: '📈',
    category: 'accumulate',
  },
  {
    id: 'take-profit',
    titleKo: '일부 익절',
    titleEn: 'Take partial profit',
    descriptionKo: '목표가 도달 시 일부를 매도합니다',
    descriptionEn: 'Sell a portion when target price is hit',
    icon: '💰',
    category: 'profit',
  },
  {
    id: 'limit-buy',
    titleKo: '지정가 매수',
    titleEn: 'Limit buy at discount',
    descriptionKo: '원하는 가격에 매수 주문을 걸어둡니다',
    descriptionEn: 'Place a buy order at your desired price',
    icon: '🎯',
    category: 'entry',
  },
  {
    id: 'range-accumulate',
    titleKo: '구간 매집',
    titleEn: 'Range accumulation',
    descriptionKo: '설정한 가격 범위 내에서 자동 매집합니다',
    descriptionEn: 'Accumulate within a set price range',
    icon: '📊',
    category: 'accumulate',
  },
  {
    id: 'bracket',
    titleKo: '브래킷 주문',
    titleEn: 'Bracket Order',
    descriptionKo: '진입가, 익절가, 손절가를 한 번에 설정합니다',
    descriptionEn: 'Set entry, take-profit, and stop-loss in one go',
    icon: '🔗',
    category: 'entry',
  },
]

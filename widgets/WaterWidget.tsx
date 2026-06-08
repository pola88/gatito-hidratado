import React from 'react'
import { FlexWidget, TextWidget } from 'react-native-android-widget'

interface WaterWidgetProps {
  glasses: number
  goal: number
  canUndo: boolean
}

function getCatEmoji(glasses: number, goal: number): string {
  const pct = goal > 0 ? (glasses / goal) * 100 : 0
  if (pct >= 70) return '😺'
  if (pct >= 40) return '🐱'
  if (pct >= 15) return '😿'
  return '😴'
}

export function WaterWidget({ glasses, goal, canUndo }: WaterWidgetProps) {
  const emoji = getCatEmoji(glasses, goal)
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#0d1b2a',
        borderRadius: 16,
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{ flexDirection: 'column', alignItems: 'center', flex: 1 }}
      >
        <TextWidget
          text={emoji}
          style={{ fontSize: 32, textAlign: 'center' }}
        />
        <TextWidget
          text={`${glasses} / ${goal} vasos`}
          style={{ fontSize: 13, color: '#60CFFF', fontWeight: 'bold', textAlign: 'center' }}
          maxLines={1}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column', gap: 6 }}>
        <FlexWidget
          style={{
            backgroundColor: '#1e3a5f',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 7,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          clickAction="ADD_WATER"
        >
          <TextWidget
            text="+ 🥤"
            style={{ fontSize: 15, color: '#ffffff', fontWeight: 'bold' }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: canUndo ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 7,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          clickAction={canUndo ? 'REMOVE_WATER' : 'OPEN_APP'}
        >
          <TextWidget
            text="- 🥤"
            style={{
              fontSize: 15,
              color: canUndo ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)',
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  )
}

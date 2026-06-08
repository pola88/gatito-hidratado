import React from 'react'
import { FlexWidget, TextWidget } from 'react-native-android-widget'
import { CAT_EMOJIS, CAT_HYDRATION_THRESHOLDS } from '@/constants/catConfig'

interface WaterWidgetProps {
  glasses: number
  goal: number
  progressPercent: number
  canUndo: boolean
}

function getCatEmoji(progressPercent: number): string {
  if (progressPercent >= CAT_HYDRATION_THRESHOLDS.happy) return CAT_EMOJIS.happy
  if (progressPercent >= CAT_HYDRATION_THRESHOLDS.normal) return CAT_EMOJIS.normal
  if (progressPercent >= CAT_HYDRATION_THRESHOLDS.thirsty) return CAT_EMOJIS.thirsty
  return CAT_EMOJIS.sleeping
}

export function WaterWidget({ glasses, goal, progressPercent, canUndo }: WaterWidgetProps) {
  const emoji = getCatEmoji(progressPercent)

  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: '#0d1b2a',
        borderRadius: 16,
        padding: 10,
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        <TextWidget
          text={emoji}
          style={{ fontSize: 22, marginRight: 8 }}
        />
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={`${glasses} / ${goal} vasos`}
            style={{ fontSize: 13, color: '#60CFFF', fontWeight: 'bold' }}
            maxLines={1}
          />
          <TextWidget
            text={`${progressPercent}%`}
            style={{ fontSize: 11, color: '#7a8d9e' }}
            maxLines={1}
          />
        </FlexWidget>
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'row', width: 'match_parent' }}>
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#1e3a5f',
            borderRadius: 10,
            paddingVertical: 9,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 6,
          }}
          clickAction="ADD_WATER"
        >
          <TextWidget
            text="+ 🥤"
            style={{ fontSize: 14, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: canUndo ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
            borderRadius: 10,
            paddingVertical: 9,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          clickAction={canUndo ? 'REMOVE_WATER' : 'OPEN_APP'}
        >
          <TextWidget
            text="- 🥤"
            style={{
              fontSize: 14,
              color: canUndo ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.2)',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  )
}

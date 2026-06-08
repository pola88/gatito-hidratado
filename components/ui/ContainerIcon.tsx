import React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'

export type ContainerType = 'small' | 'medium' | 'bottle'

export function getContainerType(ml: number): ContainerType {
  if (ml <= 200) return 'small'
  if (ml <= 400) return 'medium'
  return 'bottle'
}

interface Props {
  type: ContainerType
  size?: number
  filled?: boolean
  color?: string
}

const WATER_BLUE = '#60CFFF'
const EMPTY = 'rgba(255,255,255,0.2)'

export function ContainerIcon({ type, size = 28, filled = false, color }: Props) {
  const c = color ?? (filled ? WATER_BLUE : EMPTY)
  const fill = filled ? c : 'transparent'
  const sw = 1.6

  if (type === 'small') {
    // Wide short tumbler: wide at top, slightly narrower at bottom
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M4,5 L20,5 L18.5,18.5 Q18,20 17,20 L7,20 Q6,20 5.5,18.5 Z"
          fill={fill}
          stroke={c}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </Svg>
    )
  }

  if (type === 'medium') {
    // Tall drinking glass: narrower, taller, more tapered
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M7,3 L17,3 L15.5,20.5 Q15,22 13.5,22 L10.5,22 Q9,22 8.5,20.5 Z"
          fill={fill}
          stroke={c}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </Svg>
    )
  }

  // Bottle: cap + body with shoulder
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x="10" y="2" width="4" height="3.5"
        rx="1"
        fill={fill}
        stroke={c}
        strokeWidth={sw}
      />
      <Path
        d="M10,5.5 L14,5.5 L15.5,7.5 L17,9.5 L17,20 Q17,22 12,22 Q7,22 7,20 L7,9.5 L8.5,7.5 Z"
        fill={fill}
        stroke={c}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

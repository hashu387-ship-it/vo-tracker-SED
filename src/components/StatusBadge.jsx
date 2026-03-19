import React from 'react'
import { STATUS_COLORS } from '../utils/formatters'

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#999'
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap"
      style={{ backgroundColor: color }}
    >
      {status}
    </span>
  )
}

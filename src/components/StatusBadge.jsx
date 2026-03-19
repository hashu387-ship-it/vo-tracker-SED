import React from 'react'
import { STATUS_COLORS } from '../utils/formatters'
import Tooltip from './Tooltip'

const STATUS_TOOLTIPS = {
  'DVO Issued': 'Detailed Variation Order has been issued',
  'DVORR Issued': 'DVO Read & Return has been issued — pending signature',
  'VO Issued': 'Variation Order issued — assessment completed',
  'Revise & Resubmit': 'FFC to revise and resubmit the cost proposal',
  'PVO Under Approval': 'Preliminary VO is under WF approval',
  'Validity Under Review': 'Engineering team reviewing validity of the claim',
  'No Entitlement': 'Claim rejected — no contractual entitlement',
  'RFQ/ Waiting for Proposal': 'Waiting for FFC to submit cost proposal',
  'Potential/ Not Submitted': 'Potential variation — not yet submitted',
  'Pending RFC': 'Pending Request for Confirmation',
  'RFC Under Approval': 'RFC is under approval process',
  'Closed': 'Variation order is fully closed',
}

export default function StatusBadge({ status, size = 'sm' }) {
  const color = STATUS_COLORS[status] || '#999'
  const tooltip = STATUS_TOOLTIPS[status] || status

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-3 py-1'

  return (
    <Tooltip content={tooltip}>
      <span
        className={`status-badge inline-flex items-center gap-1 rounded-full text-white font-semibold whitespace-nowrap ${sizeClasses}`}
        style={{
          backgroundColor: color,
          boxShadow: `0 2px 8px ${color}40`,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
        {status}
      </span>
    </Tooltip>
  )
}

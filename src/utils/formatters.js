export const STATUS_COLORS = {
  'DVO Issued': '#4CAF50',
  'DVORR Issued': '#8BC34A',
  'VO Issued': '#2196F3',
  'Revise & Resubmit': '#FF9800',
  'PVO Under Approval': '#9C27B0',
  'Validity Under Review': '#FFC107',
  'No Entitlement': '#F44336',
  'RFQ/ Waiting for Proposal': '#00BCD4',
  'Potential/ Not Submitted': '#607D8B',
  'Pending RFC': '#78909C',
  'RFC Under Approval': '#5C6BC0',
  'Closed': '#9E9E9E',
}

export const STATUS_OPTIONS = [
  'DVO Issued',
  'DVORR Issued',
  'VO Issued',
  'Revise & Resubmit',
  'PVO Under Approval',
  'Validity Under Review',
  'No Entitlement',
  'RFQ/ Waiting for Proposal',
  'Potential/ Not Submitted',
  'Pending RFC',
  'RFC Under Approval',
  'Closed',
]

export const ACTION_BY_OPTIONS = ['', 'FFC', 'RSG', 'RSG/FFC']

export const CONTRACT_LABELS = {
  'R05-A09C07': 'C07 Buildings (SED)',
  'R05-A09C08': 'C08 Infra (SED)',
  'L09-S01C07': 'C07 Buildings (MTH)',
}

export function formatAmount(value) {
  const num = Number(value) || 0
  const abs = Math.abs(num)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (num < 0) return `(${formatted})`
  return formatted
}

export function formatAmountWithSAR(value) {
  const num = Number(value) || 0
  const abs = Math.abs(num)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (num < 0) return `(SAR ${formatted})`
  return `SAR ${formatted}`
}

export function isNegative(value) {
  return Number(value) < 0
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function getStatusBg(status) {
  const color = STATUS_COLORS[status]
  if (!color) return 'bg-gray-100'
  return ''
}

export function getStatusRowBg(status) {
  const map = {
    'DVO Issued': 'rgba(76,175,80,0.06)',
    'DVORR Issued': 'rgba(139,195,74,0.06)',
    'VO Issued': 'rgba(33,150,243,0.06)',
    'Revise & Resubmit': 'rgba(255,152,0,0.06)',
    'PVO Under Approval': 'rgba(156,39,176,0.06)',
    'Validity Under Review': 'rgba(255,193,7,0.06)',
    'No Entitlement': 'rgba(244,67,54,0.06)',
    'RFQ/ Waiting for Proposal': 'rgba(0,188,212,0.06)',
    'Potential/ Not Submitted': 'rgba(96,125,139,0.06)',
    'Closed': 'rgba(158,158,158,0.06)',
  }
  return map[status] || 'transparent'
}

import { supabase } from './supabase'

export async function fetchContracts() {
  const { data, error } = await supabase.from('contracts').select('*')
  if (error) throw error
  return data
}

export async function fetchVariations(contractId, filters = {}) {
  let query = supabase.from('variations').select('*')
  if (contractId) query = query.eq('contract_id', contractId)
  if (filters.status) query = query.eq('rsg_status', filters.status)
  if (filters.actionBy) query = query.eq('action_by', filters.actionBy)
  if (filters.isClosed !== undefined && filters.isClosed !== '') {
    query = query.eq('is_closed', Number(filters.isClosed))
  }
  if (filters.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,vo_ref.ilike.%${filters.search}%,ffc_remarks.ilike.%${filters.search}%,rsg_remarks.ilike.%${filters.search}%`
    )
  }
  const { data, error } = await query.order('no', { ascending: true })
  if (error) throw error
  return data
}

export async function updateVariation(id, field, value, oldValue) {
  const { error: updateError } = await supabase
    .from('variations')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (updateError) throw updateError

  // Log the change
  const { error: logError } = await supabase.from('change_log').insert({
    variation_id: id,
    field_name: field,
    old_value: String(oldValue ?? ''),
    new_value: String(value ?? ''),
  })
  if (logError) console.error('Failed to log change:', logError)
}

export async function createVariation(variation) {
  const { data, error } = await supabase
    .from('variations')
    .insert(variation)
    .select()
  if (error) throw error
  return data[0]
}

export async function fetchChangeLog(variationId) {
  const { data, error } = await supabase
    .from('change_log')
    .select('*')
    .eq('variation_id', variationId)
    .order('changed_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchDashboardStats() {
  const { data: variations, error } = await supabase.from('variations').select('*')
  if (error) throw error

  const contracts = ['R05-A09C07', 'R05-A09C08', 'L09-S01C07']
  const stats = {}

  for (const cid of contracts) {
    const cv = variations.filter(v => v.contract_id === cid)
    const open = cv.filter(v => !v.is_closed)
    const closed = cv.filter(v => v.is_closed)
    const ffcTotal = cv.reduce((s, v) => s + Number(v.ffc_summary || 0), 0)
    const toTotal = cv.reduce((s, v) => s + Number(v.to_summary || 0), 0)
    const statusCounts = {}
    cv.forEach(v => {
      statusCounts[v.rsg_status] = (statusCounts[v.rsg_status] || 0) + 1
    })
    stats[cid] = {
      ffcTotal,
      toTotal,
      discrepancy: ffcTotal - toTotal,
      openCount: open.length,
      closedCount: closed.length,
      total: cv.length,
      statusCounts,
    }
  }

  // Action items
  const ffcActions = variations.filter(v => !v.is_closed && (v.action_by === 'FFC' || v.action_by === 'RSG/FFC'))
  const overdue = variations.filter(v => {
    if (v.is_closed) return false
    const today = new Date().toISOString().split('T')[0]
    return (v.ffc_target_date && v.ffc_target_date < today) ||
           (v.rsg_target_date && v.rsg_target_date < today)
  })

  return { stats, ffcActions, overdue, allVariations: variations }
}

export async function fetchSummary(type) {
  const { data, error } = await supabase.from('variations').select('*')
  if (error) throw error
  return data
}

export function exportToCSV(variations, filename = 'vo-export.csv') {
  const headers = [
    'Contract', 'No', 'VO Ref', 'Description', 'RSG Status',
    'FFC Revised Submission', 'FFC Initial Submission', 'RSG Assessment',
    'FFC Summary', 'To Summary (RSG)', 'Approved On Account',
    'FFC Remarks', 'RSG Remarks', 'Action By',
    'FFC Target Date', 'RSG Target Date', 'Closed'
  ]
  const rows = variations.map(v => [
    v.contract_id, v.no, v.vo_ref, `"${(v.description || '').replace(/"/g, '""')}"`,
    v.rsg_status, v.ffc_revised_submission, v.ffc_initial_submission,
    v.rsg_assessment, v.ffc_summary, v.to_summary, v.approved_on_account,
    `"${(v.ffc_remarks || '').replace(/"/g, '""')}"`,
    `"${(v.rsg_remarks || '').replace(/"/g, '""')}"`,
    v.action_by, v.ffc_target_date, v.rsg_target_date, v.is_closed ? 'Yes' : 'No'
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

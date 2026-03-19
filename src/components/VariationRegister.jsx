import React, { useState, useEffect, useMemo } from 'react'
import { fetchVariations, updateVariation, exportToCSV } from '../utils/api'
import { CONTRACT_LABELS, STATUS_OPTIONS, ACTION_BY_OPTIONS, formatAmount, isNegative, getStatusRowBg } from '../utils/formatters'
import InlineEdit from './InlineEdit'
import ChangeLog from './ChangeLog'
import AddVariation from './AddVariation'

const CONTRACTS = ['R05-A09C07', 'R05-A09C08', 'L09-S01C07']

const COLUMNS = [
  { key: 'no', label: 'No', width: 'w-12' },
  { key: 'vo_ref', label: 'VO Ref', width: 'w-20' },
  { key: 'description', label: 'Description', width: 'w-64' },
  { key: 'rsg_status', label: 'Status', width: 'w-40' },
  { key: 'ffc_revised_submission', label: 'FFC Revised', width: 'w-32', amount: true },
  { key: 'ffc_initial_submission', label: 'FFC Initial', width: 'w-32', amount: true },
  { key: 'rsg_assessment', label: 'RSG Assessment', width: 'w-32', amount: true },
  { key: 'ffc_summary', label: 'FFC Summary', width: 'w-32', amount: true },
  { key: 'to_summary', label: 'To Summary', width: 'w-32', amount: true },
  { key: 'approved_on_account', label: 'Approved OA', width: 'w-32', amount: true },
  { key: 'ffc_remarks', label: 'FFC Remarks', width: 'w-48' },
  { key: 'rsg_remarks', label: 'RSG Remarks', width: 'w-48' },
  { key: 'action_by', label: 'Action By', width: 'w-24' },
  { key: 'ffc_target_date', label: 'FFC Target', width: 'w-28' },
  { key: 'rsg_target_date', label: 'RSG Target', width: 'w-28' },
  { key: 'substantiated_docs', label: 'Subst. Docs', width: 'w-36' },
]

const EDITABLE = [
  'vo_ref', 'description', 'rsg_status',
  'ffc_revised_submission', 'ffc_initial_submission', 'rsg_assessment',
  'ffc_summary', 'to_summary', 'approved_on_account',
  'ffc_remarks', 'rsg_remarks', 'action_by',
  'ffc_target_date', 'rsg_target_date', 'substantiated_docs',
]

export default function VariationRegister() {
  const [contract, setContract] = useState(CONTRACTS[0])
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', actionBy: '', isClosed: '', search: '' })
  const [sortCol, setSortCol] = useState('no')
  const [sortDir, setSortDir] = useState('asc')
  const [logId, setLogId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const loadData = () => {
    setLoading(true)
    fetchVariations(contract, filters).then(data => {
      setVariations(data)
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, [contract, filters])

  const sorted = useMemo(() => {
    return [...variations].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol]
      if (typeof va === 'number' || COLUMNS.find(c => c.key === sortCol)?.amount) {
        va = Number(va) || 0
        vb = Number(vb) || 0
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [variations, sortCol, sortDir])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const handleSave = async (id, field, newValue) => {
    const v = variations.find(v => v.id === id)
    if (!v) return
    const oldValue = v[field]
    // Optimistic update
    setVariations(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: newValue } : item
    ))
    try {
      await updateVariation(id, field, newValue, oldValue)
    } catch (err) {
      // Rollback
      setVariations(prev => prev.map(item =>
        item.id === id ? { ...item, [field]: oldValue } : item
      ))
      alert('Failed to save: ' + err.message)
    }
  }

  // Summary totals
  const totals = useMemo(() => {
    const t = {}
    COLUMNS.filter(c => c.amount).forEach(c => {
      t[c.key] = sorted.reduce((s, v) => s + (Number(v[c.key]) || 0), 0)
    })
    return t
  }, [sorted])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-[#2D3436]">Variation Register</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 text-sm bg-[#9E875D] text-white rounded hover:bg-[#8a7650]"
          >
            + Add Variation
          </button>
          <button
            onClick={() => exportToCSV(sorted, `vo-${contract}.csv`)}
            className="px-3 py-1.5 text-sm bg-[#2D3436] text-white rounded hover:bg-gray-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Contract tabs */}
      <div className="flex gap-1 border-b border-[#EDE6D3]">
        {CONTRACTS.map(c => (
          <button
            key={c}
            onClick={() => setContract(c)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              contract === c
                ? 'border-[#9E875D] text-[#9E875D]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {CONTRACT_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Description, VO Ref, Remarks..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-60"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Action By</label>
          <select
            value={filters.actionBy}
            onChange={e => setFilters(f => ({ ...f, actionBy: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {ACTION_BY_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={filters.isClosed}
            onChange={e => setFilters(f => ({ ...f, isClosed: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="0">Open</option>
            <option value="1">Closed</option>
          </select>
        </div>
        <button
          onClick={() => setFilters({ status: '', actionBy: '', isClosed: '', search: '' })}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#EDE6D3] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#EDE6D3]">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2.5 text-left text-xs font-semibold text-[#2D3436] uppercase tracking-wider cursor-pointer hover:bg-[#e0d8c4] select-none whitespace-nowrap ${col.amount ? 'text-right' : ''}`}
                >
                  {col.label}
                  {sortCol === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
              <th className="px-3 py-2.5 text-xs font-semibold text-[#2D3436] uppercase tracking-wider w-16">Log</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLUMNS.length + 1} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={COLUMNS.length + 1} className="text-center py-8 text-gray-400">No variations found</td></tr>
            ) : (
              sorted.map(v => (
                <tr
                  key={v.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${v.is_closed ? 'opacity-60' : ''}`}
                  style={{ backgroundColor: getStatusRowBg(v.rsg_status) }}
                >
                  {COLUMNS.map(col => (
                    <td key={col.key} className={`px-3 py-2 ${col.amount ? 'text-right' : ''}`}>
                      {EDITABLE.includes(col.key) ? (
                        <InlineEdit
                          value={v[col.key]}
                          field={col.key}
                          onSave={(field, newValue) => handleSave(v.id, field, newValue)}
                        />
                      ) : (
                        <span className="text-xs">{v[col.key]}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => setLogId(v.id)}
                      className="text-xs text-[#9E875D] hover:underline"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))
            )}
            {/* Totals row */}
            {sorted.length > 0 && (
              <tr className="bg-[#EDE6D3] font-semibold">
                <td className="px-3 py-2.5 text-xs" colSpan={4}>TOTAL ({sorted.length} items)</td>
                {COLUMNS.slice(4).map(col => (
                  <td key={col.key} className={`px-3 py-2.5 text-xs ${col.amount ? 'text-right font-mono' : ''}`}>
                    {col.amount ? (
                      <span className={isNegative(totals[col.key]) ? 'text-red-600' : ''}>
                        {formatAmount(totals[col.key])}
                      </span>
                    ) : ''}
                  </td>
                ))}
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {logId && <ChangeLog variationId={logId} onClose={() => setLogId(null)} />}
      {showAdd && (
        <AddVariation
          onClose={() => setShowAdd(false)}
          onCreated={() => loadData()}
        />
      )}
    </div>
  )
}

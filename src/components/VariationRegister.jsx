import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchVariations, updateVariation, exportToCSV } from '../utils/api'
import { CONTRACT_LABELS, STATUS_OPTIONS, ACTION_BY_OPTIONS, formatAmount, isNegative, getStatusRowBg, STATUS_COLORS } from '../utils/formatters'
import InlineEdit from './InlineEdit'
import ChangeLog from './ChangeLog'
import AddVariation from './AddVariation'
import Tooltip from './Tooltip'
import {
  Download, Plus, Filter, X, Search, ArrowUpDown,
  History, ChevronDown, ChevronUp, Building2, Landmark, Factory,
  Eye, EyeOff, Printer, RefreshCw, LayoutGrid
} from 'lucide-react'

const CONTRACTS = ['R05-A09C07', 'R05-A09C08', 'L09-S01C07']
const CONTRACT_ICONS = { 'R05-A09C07': Building2, 'R05-A09C08': Landmark, 'L09-S01C07': Factory }

const COLUMN_GROUPS = [
  {
    id: 'general',
    label: 'General',
    color: 'col-group-general',
    dotColor: 'bg-[#9E875D]',
    columns: [
      { key: 'no', label: '#', width: 'w-10', editable: false },
      { key: 'vo_ref', label: 'VO Ref', width: 'w-20', editable: true },
      { key: 'description', label: 'Description', width: 'min-w-[250px]', editable: true },
      { key: 'rsg_status', label: 'Status', width: 'w-44', editable: true },
    ]
  },
  {
    id: 'ffc',
    label: 'FFC Values',
    color: 'col-group-ffc',
    dotColor: 'bg-emerald-500',
    columns: [
      { key: 'ffc_revised_submission', label: 'Revised', width: 'w-32', amount: true, editable: true },
      { key: 'ffc_initial_submission', label: 'Initial', width: 'w-32', amount: true, editable: true },
      { key: 'ffc_summary', label: 'Summary', width: 'w-32', amount: true, editable: true },
    ]
  },
  {
    id: 'rsg',
    label: 'RSG Values',
    color: 'col-group-rsg',
    dotColor: 'bg-blue-500',
    columns: [
      { key: 'rsg_assessment', label: 'Assessment', width: 'w-32', amount: true, editable: true },
      { key: 'to_summary', label: 'To Summary', width: 'w-32', amount: true, editable: true },
      { key: 'approved_on_account', label: 'Approved OA', width: 'w-32', amount: true, editable: true },
    ]
  },
  {
    id: 'details',
    label: 'Details & Actions',
    color: 'col-group-general',
    dotColor: 'bg-[#9E875D]',
    columns: [
      { key: 'action_by', label: 'Action By', width: 'w-24', editable: true },
      { key: 'ffc_remarks', label: 'FFC Remarks', width: 'min-w-[180px]', editable: true },
      { key: 'rsg_remarks', label: 'RSG Remarks', width: 'min-w-[180px]', editable: true },
      { key: 'ffc_target_date', label: 'FFC Target', width: 'w-28', editable: true },
      { key: 'rsg_target_date', label: 'RSG Target', width: 'w-28', editable: true },
      { key: 'substantiated_docs', label: 'Subst. Docs', width: 'w-36', editable: true },
    ]
  },
]

const ALL_COLUMNS = COLUMN_GROUPS.flatMap(g => g.columns)

export default function VariationRegister() {
  const [contract, setContract] = useState(CONTRACTS[0])
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', actionBy: '', isClosed: '', search: '' })
  const [sortCol, setSortCol] = useState('no')
  const [sortDir, setSortDir] = useState('asc')
  const [logId, setLogId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [hiddenGroups, setHiddenGroups] = useState(new Set())

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
      if (typeof va === 'number' || ALL_COLUMNS.find(c => c.key === sortCol)?.amount) {
        va = Number(va) || 0; vb = Number(vb) || 0
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
    setVariations(prev => prev.map(item => item.id === id ? { ...item, [field]: newValue } : item))
    try {
      await updateVariation(id, field, newValue, oldValue)
    } catch (err) {
      setVariations(prev => prev.map(item => item.id === id ? { ...item, [field]: oldValue } : item))
      alert('Failed to save: ' + err.message)
    }
  }

  const toggleGroup = (groupId) => {
    setHiddenGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const visibleGroups = COLUMN_GROUPS.filter(g => !hiddenGroups.has(g.id))
  const visibleColumns = visibleGroups.flatMap(g => g.columns)

  const totals = useMemo(() => {
    const t = {}
    ALL_COLUMNS.filter(c => c.amount).forEach(c => {
      t[c.key] = sorted.reduce((s, v) => s + (Number(v[c.key]) || 0), 0)
    })
    return t
  }, [sorted])

  const activeFilterCount = [filters.status, filters.actionBy, filters.isClosed, filters.search].filter(Boolean).length

  // Status summary bar
  const statusCounts = {}
  sorted.forEach(v => { statusCounts[v.rsg_status] = (statusCounts[v.rsg_status] || 0) + 1 })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#2D3436] flex items-center gap-2">
            <LayoutGrid className="text-[#9E875D]" size={24} />
            Variation Register
          </h2>
          <p className="text-sm text-gray-400">Click any cell to edit &middot; Changes auto-save</p>
        </div>
        <div className="flex gap-2 no-print">
          <Tooltip content="Add a new variation order">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-[#9E875D] to-[#b8a57a] text-white rounded-lg hover:shadow-lg hover:shadow-[#9E875D]/30 transition-all">
              <Plus size={16} /> Add Variation
            </button>
          </Tooltip>
          <Tooltip content="Export current view to CSV">
            <button onClick={() => exportToCSV(sorted, `vo-${contract}.csv`)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#2D3436] text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Download size={16} /> Export
            </button>
          </Tooltip>
          <Tooltip content="Refresh data">
            <button onClick={loadData} className="p-2 text-gray-400 hover:text-[#9E875D] rounded-lg hover:bg-white transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
          <Tooltip content="Print-friendly view">
            <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-[#9E875D] rounded-lg hover:bg-white transition-all">
              <Printer size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Contract tabs */}
      <div className="flex gap-2 no-print">
        {CONTRACTS.map(c => {
          const Icon = CONTRACT_ICONS[c]
          const isActive = contract === c
          const count = variations.length
          return (
            <Tooltip key={c} content={`${CONTRACT_LABELS[c]}\nContract ID: ${c}`}>
              <button
                onClick={() => setContract(c)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2D3436] to-[#3d4446] text-white shadow-lg'
                    : 'bg-white/60 text-gray-500 hover:bg-white hover:shadow-md border border-[#EDE6D3]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#9E875D]' : ''} />
                <span>{CONTRACT_LABELS[c]}</span>
              </button>
            </Tooltip>
          )
        })}
      </div>

      {/* Status summary bar */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="flex flex-wrap gap-1.5 items-center"
      >
        <span className="text-xs text-gray-400 mr-1">{sorted.length} items:</span>
        {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
          <Tooltip key={status} content={`Filter by: ${status}`}>
            <button
              onClick={() => setFilters(f => ({ ...f, status: f.status === status ? '' : status }))}
              className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium transition-all hover:scale-105 ${
                filters.status === status ? 'ring-2 ring-offset-1 ring-gray-400' : ''
              }`}
              style={{ backgroundColor: STATUS_COLORS[status] || '#999' }}
            >
              {count} {status}
            </button>
          </Tooltip>
        ))}
        {filters.status && (
          <button onClick={() => setFilters(f => ({ ...f, status: '' }))} className="text-xs text-gray-400 hover:text-red-500 ml-1">
            <X size={14} />
          </button>
        )}
      </motion.div>

      {/* Filters */}
      <div className="no-print">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search description, VO ref, remarks..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full border border-[#EDE6D3] rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white/80 focus:bg-white focus:border-[#9E875D] focus:ring-2 focus:ring-[#9E875D]/20 outline-none transition-all"
            />
          </div>
          <Tooltip content="Toggle advanced filters">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-[#9E875D] text-white border-[#9E875D]'
                  : 'bg-white/80 text-gray-500 border-[#EDE6D3] hover:border-[#9E875D]'
              }`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 text-xs bg-white/30 px-1.5 rounded-full">{activeFilterCount}</span>
              )}
            </button>
          </Tooltip>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 items-end mt-3 p-4 bg-white/60 rounded-xl border border-[#EDE6D3]">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Status</label>
                  <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Action By</label>
                  <select value={filters.actionBy} onChange={e => setFilters(f => ({ ...f, actionBy: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">All</option>
                    {ACTION_BY_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Open/Closed</label>
                  <select value={filters.isClosed} onChange={e => setFilters(f => ({ ...f, isClosed: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">All</option>
                    <option value="0">Open</option>
                    <option value="1">Closed</option>
                  </select>
                </div>
                <button
                  onClick={() => setFilters({ status: '', actionBy: '', isClosed: '', search: '' })}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Column group toggles */}
      <div className="flex items-center gap-2 no-print">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Columns:</span>
        {COLUMN_GROUPS.map(g => (
          <Tooltip key={g.id} content={`${hiddenGroups.has(g.id) ? 'Show' : 'Hide'} ${g.label} columns`}>
            <button
              onClick={() => toggleGroup(g.id)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                hiddenGroups.has(g.id)
                  ? 'border-gray-200 text-gray-400 bg-gray-50'
                  : 'border-[#EDE6D3] text-gray-600 bg-white shadow-sm'
              }`}
            >
              {hiddenGroups.has(g.id) ? <EyeOff size={12} /> : <Eye size={12} />}
              <span className={`w-2 h-2 rounded-full ${g.dotColor}`}></span>
              {g.label}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl shadow-lg border border-[#EDE6D3] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Column group headers */}
            <thead className="sticky top-0 z-20">
              <tr>
                {visibleGroups.map(group => (
                  <th
                    key={group.id}
                    colSpan={group.columns.length}
                    className={`px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest ${group.color}`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${group.dotColor}`}></span>
                      {group.label}
                    </div>
                  </th>
                ))}
                <th className="col-group-general px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest w-16">
                  <History size={12} className="mx-auto" />
                </th>
              </tr>
              {/* Individual column headers */}
              <tr className="bg-white/90 backdrop-blur">
                {visibleColumns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors hover:bg-[#EDE6D3]/50 ${col.amount ? 'text-right' : ''} ${col.width}`}
                  >
                    <div className={`flex items-center gap-1 ${col.amount ? 'justify-end' : ''}`}>
                      {col.label}
                      {sortCol === col.key ? (
                        sortDir === 'asc' ? <ChevronUp size={12} className="text-[#9E875D]" /> : <ChevronDown size={12} className="text-[#9E875D]" />
                      ) : (
                        <ArrowUpDown size={10} className="text-gray-300" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {visibleColumns.map((col, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-4 shimmer rounded"></div></td>
                    ))}
                    <td className="px-3 py-3"><div className="h-4 shimmer rounded w-12"></div></td>
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="text-center py-16">
                    <div className="text-gray-300">
                      <Search size={48} className="mx-auto mb-3" />
                      <p className="text-lg font-medium">No variations found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((v, idx) => {
                  const isExpanded = expandedRow === v.id
                  // FFC vs RSG cell backgrounds
                  const ffcCols = new Set(['ffc_revised_submission', 'ffc_initial_submission', 'ffc_summary', 'ffc_remarks', 'ffc_target_date'])
                  const rsgCols = new Set(['rsg_assessment', 'to_summary', 'approved_on_account', 'rsg_remarks', 'rsg_target_date'])

                  return (
                    <React.Fragment key={v.id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`border-b border-gray-100/80 table-row-hover ${v.is_closed ? 'opacity-50' : ''}`}
                        style={{ backgroundColor: getStatusRowBg(v.rsg_status) }}
                      >
                        {visibleColumns.map(col => {
                          let cellBg = ''
                          if (ffcCols.has(col.key)) cellBg = 'bg-emerald-50/30'
                          else if (rsgCols.has(col.key)) cellBg = 'bg-blue-50/30'

                          return (
                            <td key={col.key} className={`px-3 py-2 ${col.amount ? 'text-right' : ''} ${cellBg}`}>
                              {col.editable ? (
                                <InlineEdit
                                  value={v[col.key]}
                                  field={col.key}
                                  onSave={(field, newValue) => handleSave(v.id, field, newValue)}
                                />
                              ) : (
                                <Tooltip content={`Variation #${v.no}`}>
                                  <span className="text-xs font-bold text-[#9E875D]">{v[col.key]}</span>
                                </Tooltip>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <Tooltip content="View change history">
                              <button
                                onClick={() => setLogId(v.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#9E875D] hover:bg-[#EDE6D3] transition-all"
                              >
                                <History size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content={isExpanded ? 'Collapse details' : 'Expand details'}>
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : v.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#9E875D] hover:bg-[#EDE6D3] transition-all"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </motion.tr>
                      {/* Expanded row */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan={visibleColumns.length + 1} className="bg-gradient-to-r from-[#f5f0e5] to-white p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-[#9E875D] uppercase tracking-wider">Variation Info</h4>
                                  <InfoRow label="VO Ref" value={v.vo_ref || '—'} />
                                  <InfoRow label="Status" value={v.rsg_status} />
                                  <InfoRow label="Action By" value={v.action_by || '—'} />
                                  <InfoRow label="Closed" value={v.is_closed ? 'Yes' : 'No'} />
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">FFC Values</h4>
                                  <InfoRow label="Revised" value={`SAR ${formatAmount(v.ffc_revised_submission)}`} neg={isNegative(v.ffc_revised_submission)} />
                                  <InfoRow label="Initial" value={`SAR ${formatAmount(v.ffc_initial_submission)}`} neg={isNegative(v.ffc_initial_submission)} />
                                  <InfoRow label="Summary" value={`SAR ${formatAmount(v.ffc_summary)}`} neg={isNegative(v.ffc_summary)} />
                                  <InfoRow label="Remarks" value={v.ffc_remarks || '—'} />
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">RSG Values</h4>
                                  <InfoRow label="Assessment" value={`SAR ${formatAmount(v.rsg_assessment)}`} neg={isNegative(v.rsg_assessment)} />
                                  <InfoRow label="To Summary" value={`SAR ${formatAmount(v.to_summary)}`} neg={isNegative(v.to_summary)} />
                                  <InfoRow label="Approved OA" value={`SAR ${formatAmount(v.approved_on_account)}`} neg={isNegative(v.approved_on_account)} />
                                  <InfoRow label="Remarks" value={v.rsg_remarks || '—'} />
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  )
                })
              )}
              {/* Totals row */}
              {sorted.length > 0 && (
                <tr className="bg-gradient-to-r from-[#EDE6D3] to-[#e0d8c4] font-semibold sticky bottom-0 z-10">
                  {visibleColumns.map((col, i) => {
                    if (i === 0) {
                      return (
                        <td key={col.key} className="px-3 py-3 text-xs font-bold text-[#2D3436]" colSpan={visibleGroups[0]?.columns.length}>
                          TOTAL ({sorted.length} items)
                        </td>
                      )
                    }
                    // Skip cells already covered by colSpan
                    const firstGroupCols = visibleGroups[0]?.columns || []
                    if (firstGroupCols.findIndex(c => c.key === col.key) > 0) return null

                    return (
                      <td key={col.key} className={`px-3 py-3 text-xs ${col.amount ? 'text-right font-mono' : ''}`}>
                        {col.amount ? (
                          <Tooltip content={`Total: SAR ${formatAmount(totals[col.key])}`}>
                            <span className={`font-bold ${isNegative(totals[col.key]) ? 'text-red-600' : 'text-[#2D3436]'}`}>
                              {formatAmount(totals[col.key])}
                            </span>
                          </Tooltip>
                        ) : ''}
                      </td>
                    )
                  })}
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {logId && <ChangeLog variationId={logId} onClose={() => setLogId(null)} />}
      {showAdd && <AddVariation onClose={() => setShowAdd(false)} onCreated={() => loadData()} />}
    </div>
  )
}

function InfoRow({ label, value, neg }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className={`font-medium ${neg ? 'text-red-500' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

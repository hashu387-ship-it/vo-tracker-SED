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
      { key: 'no', label: '#', width: 'w-[3%]', editable: false },
      { key: 'vo_ref', label: 'VO Ref', width: 'w-[3%]', editable: true },
      { key: 'description', label: 'Description', width: 'w-[54%]', editable: true },
      { key: 'rsg_status', label: 'Status', width: 'w-[5%]', editable: true },
      { key: 'action_by', label: 'Action', width: 'w-[1%]', editable: true },
    ]
  },
  {
    id: 'ffc',
    label: 'FFC Values',
    color: 'col-group-ffc',
    dotColor: 'bg-[#e67e22]',
    columns: [
      { key: 'ffc_submission', label: 'Init / Rev', width: 'w-[8%]', combined: true, editable: false },
      { key: 'ffc_summary', label: 'Summary', width: 'w-[7%]', amount: true, editable: true },
    ]
  },
  {
    id: 'rsg',
    label: 'RSG Values',
    color: 'col-group-rsg',
    dotColor: 'bg-[#6d4c2e]',
    columns: [
      { key: 'rsg_assessment', label: 'Assess.', width: 'w-[8%]', amount: true, editable: true },
      { key: 'to_summary', label: 'To Sum', width: 'w-[8%]', amount: true, editable: true },
      { key: 'approved_on_account', label: 'Appr. OA', width: 'w-[8%]', amount: true, editable: true },
    ]
  },
  {
    id: 'dates',
    label: 'Target Dates',
    color: 'col-group-general',
    dotColor: 'bg-[#9E875D]',
    columns: [
      { key: 'target_dates', label: 'FFC / RSG', width: 'w-[7%]', combinedDate: true, editable: false },
      { key: 'substantiated_docs', label: 'Docs', width: 'w-[5%]', editable: true },
    ]
  },
]

const ALL_COLUMNS = COLUMN_GROUPS.flatMap(g => g.columns)

export default function VariationRegister() {
  const [allData, setAllData] = useState({})
  const [loadingContracts, setLoadingContracts] = useState(new Set(CONTRACTS))
  const [filters, setFilters] = useState({ status: '', actionBy: '', isClosed: '', search: '' })
  const [sortCol, setSortCol] = useState('no')
  const [sortDir, setSortDir] = useState('asc')
  const [logId, setLogId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [hiddenGroups, setHiddenGroups] = useState(new Set())
  const [hoveredRow, setHoveredRow] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const loadData = () => {
    setLoadingContracts(new Set(CONTRACTS))
    CONTRACTS.forEach(contractId => {
      fetchVariations(contractId, filters).then(data => {
        setAllData(prev => ({ ...prev, [contractId]: data }))
        setLoadingContracts(prev => {
          const next = new Set(prev)
          next.delete(contractId)
          return next
        })
      })
    })
  }

  useEffect(() => { loadData() }, [filters])

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol]
      if (typeof va === 'number' || ALL_COLUMNS.find(c => c.key === sortCol)?.amount) {
        va = Number(va) || 0; vb = Number(vb) || 0
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const handleSave = async (contractId, id, field, newValue) => {
    const variations = allData[contractId] || []
    const v = variations.find(v => v.id === id)
    if (!v) return
    const oldValue = v[field]
    setAllData(prev => ({
      ...prev,
      [contractId]: prev[contractId].map(item => item.id === id ? { ...item, [field]: newValue } : item)
    }))
    try {
      await updateVariation(id, field, newValue, oldValue)
    } catch (err) {
      setAllData(prev => ({
        ...prev,
        [contractId]: prev[contractId].map(item => item.id === id ? { ...item, [field]: oldValue } : item)
      }))
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

  const activeFilterCount = [filters.status, filters.actionBy, filters.isClosed, filters.search].filter(Boolean).length

  const loading = loadingContracts.size > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#2D3436] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <LayoutGrid className="text-[#9E875D]" size={18} />
            </div>
            Variation Register
          </h2>
          <p className="text-sm text-gray-400 mt-0.5 ml-12">Click any cell to edit &middot; Changes auto-save</p>
        </div>
        <div className="flex gap-2 no-print">
          <Tooltip content="Add a new variation order">
            <button onClick={() => setShowAdd(true)} className="glass-btn-primary flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium">
              <Plus size={15} /> Add
            </button>
          </Tooltip>
          <Tooltip content="Refresh data">
            <button onClick={loadData} className="glass-btn p-2.5 text-gray-400 hover:text-[#9E875D]">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
          <Tooltip content="Print">
            <button onClick={() => window.print()} className="glass-btn p-2.5 text-gray-400 hover:text-[#9E875D]">
              <Printer size={15} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Filters */}
      <div className="no-print">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search description, VO ref, remarks..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full glass-input pl-11 pr-4 py-2.5 text-sm outline-none"
            />
          </div>
          <Tooltip content="Advanced filters">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-2xl transition-all duration-300 ${
                showFilters || activeFilterCount > 0
                  ? 'glass-btn-primary'
                  : 'glass-btn text-gray-500'
              }`}
            >
              <Filter size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 text-xs bg-white/25 px-1.5 rounded-full">{activeFilterCount}</span>
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
              <div className="flex flex-wrap gap-3 items-end mt-3 p-4 glass-panel">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Status</label>
                  <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="glass-input px-3 py-2 text-sm outline-none">
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Action By</label>
                  <select value={filters.actionBy} onChange={e => setFilters(f => ({ ...f, actionBy: e.target.value }))} className="glass-input px-3 py-2 text-sm outline-none">
                    <option value="">All</option>
                    {ACTION_BY_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Open/Closed</label>
                  <select value={filters.isClosed} onChange={e => setFilters(f => ({ ...f, isClosed: e.target.value }))} className="glass-input px-3 py-2 text-sm outline-none">
                    <option value="">All</option>
                    <option value="0">Open</option>
                    <option value="1">Closed</option>
                  </select>
                </div>
                <button
                  onClick={() => setFilters({ status: '', actionBy: '', isClosed: '', search: '' })}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-600 glass-btn transition-colors"
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
          <Tooltip key={g.id} content={`${hiddenGroups.has(g.id) ? 'Show' : 'Hide'} ${g.label}`}>
            <button
              onClick={() => toggleGroup(g.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all duration-300 ${
                hiddenGroups.has(g.id)
                  ? 'glass-pill text-gray-400 opacity-50'
                  : 'glass-btn text-gray-600'
              }`}
            >
              {hiddenGroups.has(g.id) ? <EyeOff size={11} /> : <Eye size={11} />}
              <span className={`w-2 h-2 rounded-full ${g.dotColor}`}></span>
              {g.label}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* ─── ALL CONTRACT TABLES ─── */}
      {CONTRACTS.map(contractId => {
        const Icon = CONTRACT_ICONS[contractId]
        const contractLoading = loadingContracts.has(contractId)
        const variations = allData[contractId] || []
        const sorted = sortData(variations)

        const totals = {}
        ALL_COLUMNS.filter(c => c.amount).forEach(c => {
          totals[c.key] = sorted.reduce((s, v) => s + (Number(v[c.key]) || 0), 0)
        })
        totals.ffc_initial_submission = sorted.reduce((s, v) => s + (Number(v.ffc_initial_submission) || 0), 0)
        totals.ffc_revised_submission = sorted.reduce((s, v) => s + (Number(v.ffc_revised_submission) || 0), 0)

        const statusCounts = {}
        sorted.forEach(v => { statusCounts[v.rsg_status] = (statusCounts[v.rsg_status] || 0) + 1 })

        return (
          <div key={contractId} className="space-y-3">
            {/* Contract header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl glass-dark flex items-center justify-center">
                  <Icon size={16} className="text-[#c4a96a]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2D3436]">{CONTRACT_LABELS[contractId]}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{contractId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 no-print">
                <Tooltip content={`Export ${CONTRACT_LABELS[contractId]} to CSV`}>
                  <button onClick={() => exportToCSV(sorted, `vo-${contractId}.csv`)} className="glass-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600">
                    <Download size={13} /> Export
                  </button>
                </Tooltip>
                {/* Status chips */}
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-gray-400">{sorted.length} items:</span>
                  {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                    <span
                      key={status}
                      className="text-[9px] px-2 py-0.5 rounded-full text-white font-medium shadow-sm"
                      style={{ backgroundColor: STATUS_COLORS[status] || '#999' }}
                    >
                      {count} {status}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
              <div className="overflow-auto max-h-[70vh] relative z-[1]">
                <table className="w-full text-[11px] table-3d border-separate border-spacing-0 table-fixed">
                  <thead className="sticky top-0 z-30">
                    {/* Group headers */}
                    <tr>
                      {visibleGroups.map(group => (
                        <th
                          key={group.id}
                          colSpan={group.columns.length}
                          className={`px-1.5 py-1.5 text-center text-[9px] font-bold uppercase tracking-widest ${group.color}`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${group.dotColor} shadow-sm`}></span>
                            {group.label}
                          </div>
                        </th>
                      ))}
                      <th className="col-group-general px-1 py-1.5 text-center w-[3%]">
                        <History size={10} className="mx-auto opacity-40" />
                      </th>
                    </tr>
                    {/* Column headers */}
                    <tr className="header-frost">
                      {visibleColumns.map(col => (
                        <th
                          key={col.key}
                          onClick={() => !col.combined && !col.combinedDate && handleSort(col.key)}
                          className={`px-2 py-2 text-left text-[9px] font-bold uppercase tracking-wider select-none whitespace-nowrap transition-all duration-200 hover:bg-white/30 ${col.amount || col.combined || col.combinedDate ? 'text-right' : ''} ${col.combined || col.combinedDate ? '' : 'cursor-pointer'} ${col.width}`}
                        >
                          <div className={`flex items-center gap-1 ${col.amount || col.combined || col.combinedDate ? 'justify-end' : ''}`}>
                            {col.label}
                            {!col.combined && !col.combinedDate && (
                              sortCol === col.key ? (
                                <span className="flex items-center justify-center w-4 h-4 rounded-lg bg-[#9E875D]/10">
                                  {sortDir === 'asc' ? <ChevronUp size={9} className="text-[#9E875D]" /> : <ChevronDown size={9} className="text-[#9E875D]" />}
                                </span>
                              ) : (
                                <ArrowUpDown size={8} className="text-gray-300 opacity-40" />
                              )
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-1 py-2 w-[3%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {visibleColumns.map((col, j) => (
                            <td key={j} className="px-2 py-2"><div className="h-3 shimmer rounded-md"></div></td>
                          ))}
                          <td className="px-1 py-2"><div className="h-3 shimmer rounded-md w-6"></div></td>
                        </tr>
                      ))
                    ) : sorted.length === 0 ? (
                      <tr>
                        <td colSpan={visibleColumns.length + 1} className="text-center py-12">
                          <div className="text-gray-300">
                            <p className="text-sm font-medium text-gray-400">No variations found</p>
                            <p className="text-xs text-gray-300">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sorted.map((v, idx) => {
                        const isExpanded = expandedRow === v.id
                        const ffcCols = new Set(['ffc_submission', 'ffc_summary'])
                        const rsgCols = new Set(['rsg_assessment', 'to_summary', 'approved_on_account'])

                        return (
                          <React.Fragment key={v.id}>
                            <motion.tr
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.01, duration: 0.3 }}
                              onClick={() => setExpandedRow(isExpanded ? null : v.id)}
                              className={`table-row-hover cursor-pointer ${isExpanded ? 'row-expanded' : ''} ${v.is_closed ? 'opacity-50' : ''} ${idx % 2 === 0 ? 'row-even' : 'row-odd'}`}
                              style={{ backgroundColor: getStatusRowBg(v.rsg_status) }}
                              onMouseEnter={() => setHoveredRow(v)}
                              onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                              onMouseLeave={() => setHoveredRow(null)}
                            >
                              {visibleColumns.map(col => {
                                let cellBg = ''
                                if (ffcCols.has(col.key)) cellBg = 'cell-ffc'
                                else if (rsgCols.has(col.key)) cellBg = 'cell-rsg'

                                return (
                                  <td key={col.key} className={`px-2 py-0.5 ${col.amount ? 'text-right' : ''} ${cellBg}`}>
                                    {col.combined ? (
                                      /* Combined Initial / Revised */
                                      <div className="flex flex-col text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[7px] text-gray-400 uppercase font-medium leading-none">I</span>
                                          <InlineEdit
                                            value={v.ffc_initial_submission}
                                            field="ffc_initial_submission"
                                            onSave={(field, newValue) => handleSave(contractId, v.id, field, newValue)}
                                          />
                                        </div>
                                        <div className="border-t border-dashed border-white/40"></div>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[7px] text-[#e67e22] uppercase font-semibold leading-none">R</span>
                                          <InlineEdit
                                            value={v.ffc_revised_submission}
                                            field="ffc_revised_submission"
                                            onSave={(field, newValue) => handleSave(contractId, v.id, field, newValue)}
                                          />
                                        </div>
                                      </div>
                                    ) : col.combinedDate ? (
                                      /* Combined FFC / RSG Target Dates */
                                      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[7px] text-[#e67e22] uppercase font-semibold leading-none">FFC</span>
                                          <InlineEdit
                                            value={v.ffc_target_date}
                                            field="ffc_target_date"
                                            textColor="#e67e22"
                                            onSave={(field, newValue) => handleSave(contractId, v.id, field, newValue)}
                                          />
                                        </div>
                                        <div className="border-t border-dashed border-white/40"></div>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-[7px] text-[#6d4c2e] uppercase font-semibold leading-none">RSG</span>
                                          <InlineEdit
                                            value={v.rsg_target_date}
                                            field="rsg_target_date"
                                            textColor="#6d4c2e"
                                            onSave={(field, newValue) => handleSave(contractId, v.id, field, newValue)}
                                          />
                                        </div>
                                      </div>
                                    ) : col.editable ? (
                                      <InlineEdit
                                        value={v[col.key]}
                                        field={col.key}
                                        onSave={(field, newValue) => handleSave(contractId, v.id, field, newValue)}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center">
                                        <span className="num-badge">{v[col.key]}</span>
                                      </div>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-0.5 py-0.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-0 justify-center">
                                  <Tooltip content="View change history">
                                    <button
                                      onClick={() => setLogId(v.id)}
                                      className="p-1 rounded-lg text-gray-400 hover:text-[#9E875D] hover:bg-white/40 transition-all"
                                    >
                                      <History size={11} />
                                    </button>
                                  </Tooltip>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronDown size={11} className={`transition-colors ${isExpanded ? 'text-[#9E875D]' : 'text-gray-300'}`} />
                                  </motion.div>
                                </div>
                              </td>
                            </motion.tr>
                            {/* Expanded row */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.tr
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <td colSpan={visibleColumns.length + 1} className="p-0">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                                      className="overflow-hidden"
                                    >
                                      <div className="expanded-panel p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                          <div className="expanded-card">
                                            <h4 className="expanded-card-title text-[#9E875D]">Variation Info</h4>
                                            <InfoRow label="VO Ref" value={v.vo_ref || '—'} />
                                            <InfoRow label="Status" value={v.rsg_status} />
                                            <InfoRow label="Action By" value={v.action_by || '—'} />
                                            <InfoRow label="Closed" value={v.is_closed ? 'Yes' : 'No'} />
                                          </div>
                                          <div className="expanded-card">
                                            <h4 className="expanded-card-title text-[#e67e22]">FFC Values</h4>
                                            <InfoRow label="Revised" value={`SAR ${formatAmount(v.ffc_revised_submission)}`} neg={isNegative(v.ffc_revised_submission)} />
                                            <InfoRow label="Initial" value={`SAR ${formatAmount(v.ffc_initial_submission)}`} neg={isNegative(v.ffc_initial_submission)} />
                                            <InfoRow label="Summary" value={`SAR ${formatAmount(v.ffc_summary)}`} neg={isNegative(v.ffc_summary)} />
                                          </div>
                                          <div className="expanded-card">
                                            <h4 className="expanded-card-title text-[#6d4c2e]">RSG Values</h4>
                                            <InfoRow label="Assessment" value={`SAR ${formatAmount(v.rsg_assessment)}`} neg={isNegative(v.rsg_assessment)} />
                                            <InfoRow label="To Summary" value={`SAR ${formatAmount(v.to_summary)}`} neg={isNegative(v.to_summary)} />
                                            <InfoRow label="Approved OA" value={`SAR ${formatAmount(v.approved_on_account)}`} neg={isNegative(v.approved_on_account)} />
                                          </div>
                                          <div className="expanded-card" onClick={(e) => e.stopPropagation()}>
                                            <h4 className="expanded-card-title text-gray-500">Remarks</h4>
                                            <div className="space-y-2">
                                              <div className="text-xs">
                                                <span className="inline-flex items-center gap-1 text-[#e67e22] font-semibold mb-1"><span className="w-1.5 h-1.5 rounded-full bg-[#e67e22]"></span>FFC:</span>
                                                <InlineEdit value={v.ffc_remarks} field="ffc_remarks" onSave={(field, newValue) => handleSave(contractId, v.id, field, newValue)} />
                                              </div>
                                              <div className="text-xs">
                                                <span className="inline-flex items-center gap-1 text-[#6d4c2e] font-semibold mb-1"><span className="w-1.5 h-1.5 rounded-full bg-[#6d4c2e]"></span>RSG:</span>
                                                <InlineEdit value={v.rsg_remarks} field="rsg_remarks" onSave={(field, newValue) => handleSave(contractId, v.id, field, newValue)} />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
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
                      <tr className="totals-row sticky bottom-0 z-10">
                        {visibleColumns.map((col, i) => {
                          if (i === 0) {
                            return (
                              <td key={col.key} className="px-2 py-2 text-[10px] font-black text-[#2D3436] uppercase tracking-wider" colSpan={visibleGroups[0]?.columns.length}>
                                Total ({sorted.length})
                              </td>
                            )
                          }
                          const firstGroupCols = visibleGroups[0]?.columns || []
                          if (firstGroupCols.findIndex(c => c.key === col.key) > 0) return null

                          return (
                            <td key={col.key} className={`px-2 py-2 text-[10px] ${(col.amount || col.combined) ? 'text-right font-numbers' : ''}`}>
                              {col.combined ? (
                                <div className="flex flex-col text-right">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[7px] text-gray-400 font-medium">I</span>
                                    <span className={`font-black text-[10px] ${isNegative(totals.ffc_initial_submission) ? 'text-red-600' : 'text-[#2D3436]'}`}>
                                      {formatAmount(totals.ffc_initial_submission)}
                                    </span>
                                  </div>
                                  <div className="border-t border-dashed border-[#9E875D]/15"></div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[7px] text-[#e67e22] font-semibold">R</span>
                                    <span className={`font-black text-[10px] ${isNegative(totals.ffc_revised_submission) ? 'text-red-600' : 'text-[#2D3436]'}`}>
                                      {formatAmount(totals.ffc_revised_submission)}
                                    </span>
                                  </div>
                                </div>
                              ) : col.amount ? (
                                <Tooltip content={`Total: SAR ${formatAmount(totals[col.key])}`}>
                                  <span className={`font-black text-[10px] ${isNegative(totals[col.key]) ? 'text-red-600' : 'text-[#2D3436]'}`}>
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
          </div>
        )
      })}

      {/* Row hover tooltip */}
      <AnimatePresence>
        {hoveredRow && (hoveredRow.ffc_remarks || hoveredRow.rsg_remarks) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] pointer-events-none"
            style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 10 }}
          >
            <div className="glass-dark text-white px-4 py-3 rounded-2xl text-xs leading-relaxed max-w-[380px] space-y-2">
              <p className="font-semibold text-[#c4a96a] border-b border-white/10 pb-1.5">
                #{hoveredRow.no} — {hoveredRow.description?.substring(0, 60)}{hoveredRow.description?.length > 60 ? '...' : ''}
              </p>
              {hoveredRow.ffc_remarks && (
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#e67e22] mr-1.5 align-middle"></span>
                  <span className="text-[#e67e22] font-semibold">FFC:</span>
                  <p className="text-gray-300 mt-0.5 pl-3.5">{hoveredRow.ffc_remarks}</p>
                </div>
              )}
              {hoveredRow.rsg_remarks && (
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#a0764e] mr-1.5 align-middle"></span>
                  <span className="text-[#a0764e] font-semibold">RSG:</span>
                  <p className="text-gray-300 mt-0.5 pl-3.5">{hoveredRow.rsg_remarks}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {logId && <ChangeLog variationId={logId} onClose={() => setLogId(null)} />}
      {showAdd && <AddVariation onClose={() => setShowAdd(false)} onCreated={() => loadData()} />}
    </div>
  )
}

function InfoRow({ label, value, neg }) {
  return (
    <div className="flex items-start gap-1.5 text-[10px]">
      <span className="text-gray-400 w-16 flex-shrink-0">{label}</span>
      <span className={`font-medium ${neg ? 'text-red-500' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

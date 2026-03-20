import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchSummary, exportToCSV } from '../utils/api'
import { STATUS_OPTIONS, STATUS_COLORS, CONTRACT_LABELS, formatAmount, isNegative } from '../utils/formatters'
import StatusBadge from './StatusBadge'
import Tooltip from './Tooltip'
import { BarChart3, Download, Printer, TrendingUp, Target, AlertTriangle } from 'lucide-react'

const CONTRACTS = ['R05-A09C07', 'R05-A09C08', 'L09-S01C07']

export default function SummaryTables() {
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('ffc')

  useEffect(() => {
    fetchSummary().then(data => { setVariations(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 shimmer rounded-2xl w-64"></div>
        <div className="h-96 shimmer rounded-2xl"></div>
      </div>
    )
  }

  const amountField = type === 'ffc' ? 'ffc_summary' : 'to_summary'

  const summary = {}
  STATUS_OPTIONS.forEach(status => {
    summary[status] = {}
    CONTRACTS.forEach(cid => {
      const matching = variations.filter(v => v.contract_id === cid && v.rsg_status === status)
      summary[status][cid] = {
        count: matching.length,
        amount: matching.reduce((s, v) => s + (Number(v[amountField]) || 0), 0),
      }
    })
    summary[status].totalCount = CONTRACTS.reduce((s, c) => s + summary[status][c].count, 0)
    summary[status].totalAmount = CONTRACTS.reduce((s, c) => s + summary[status][c].amount, 0)
  })

  const grandTotals = {}
  CONTRACTS.forEach(cid => {
    grandTotals[cid] = {
      count: variations.filter(v => v.contract_id === cid).length,
      amount: variations.filter(v => v.contract_id === cid).reduce((s, v) => s + (Number(v[amountField]) || 0), 0),
    }
  })
  grandTotals.totalCount = variations.length
  grandTotals.totalAmount = variations.reduce((s, v) => s + (Number(v[amountField]) || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#2D3436] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <BarChart3 className="text-[#9E875D]" size={18} />
            </div>
            Summary Tables
          </h2>
          <p className="text-sm text-gray-400 ml-12">Status-wise breakdown across all contracts</p>
        </div>
        <div className="flex gap-2 no-print">
          <div className="flex glass-panel p-1 rounded-2xl">
            <Tooltip content="Show FFC Summary amounts">
              <button
                onClick={() => setType('ffc')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                  type === 'ffc'
                    ? 'bg-gradient-to-r from-[#e67e22] to-[#d35400] text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp size={14} /> FFC
              </button>
            </Tooltip>
            <Tooltip content="Show RSG To Summary amounts">
              <button
                onClick={() => setType('rsg')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                  type === 'rsg'
                    ? 'bg-gradient-to-r from-[#6d4c2e] to-[#5a3e24] text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Target size={14} /> RSG
              </button>
            </Tooltip>
          </div>
          <Tooltip content="Export all data to CSV">
            <button onClick={() => exportToCSV(variations, 'summary-all.csv')} className="glass-btn flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600">
              <Download size={14} /> Export
            </button>
          </Tooltip>
          <Tooltip content="Print summary">
            <button onClick={() => window.print()} className="glass-btn p-2.5 text-gray-400 hover:text-[#9E875D]">
              <Printer size={15} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Main summary table */}
      <div className="glass-heavy rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="glass-dark">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-300 uppercase tracking-wider">Status</th>
                {CONTRACTS.map(cid => (
                  <th key={cid} className="px-4 py-3 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider border-l border-white/5" colSpan={2}>
                    <Tooltip content={CONTRACT_LABELS[cid]}>
                      <span>{cid.split('-').pop()}</span>
                    </Tooltip>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-[10px] font-bold text-[#c4a96a] uppercase tracking-wider border-l border-white/5" colSpan={2}>
                  Total
                </th>
              </tr>
              <tr className="glass-subtle">
                <th className="px-4 py-1.5"></th>
                {[...CONTRACTS, 'total'].map(c => (
                  <React.Fragment key={c}>
                    <th className="px-4 py-1.5 text-center text-[10px] text-gray-400 font-medium">Count</th>
                    <th className="px-4 py-1.5 text-right text-[10px] text-gray-400 font-medium">Amount (SAR)</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATUS_OPTIONS.filter(status => summary[status].totalCount > 0).map((status, idx) => (
                <motion.tr
                  key={status}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-black/[0.03] hover:bg-white/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <StatusBadge status={status} />
                  </td>
                  {CONTRACTS.map(cid => (
                    <React.Fragment key={cid}>
                      <td className="px-4 py-3 text-center">
                        {summary[status][cid].count > 0 && (
                          <span className="text-xs font-semibold glass-pill px-2.5 py-0.5">{summary[status][cid].count}</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-numbers ${isNegative(summary[status][cid].amount) ? 'text-red-500 font-semibold' : 'text-gray-700'}`}>
                        {summary[status][cid].count > 0 ? formatAmount(summary[status][cid].amount) : ''}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="px-4 py-3 text-center border-l border-black/[0.03]">
                    <span className="text-xs font-bold glass-pill px-2.5 py-0.5 text-[#9E875D]">{summary[status].totalCount}</span>
                  </td>
                  <td className={`px-4 py-3 text-right text-xs font-numbers font-bold ${isNegative(summary[status].totalAmount) ? 'text-red-500' : 'text-[#2D3436]'}`}>
                    {formatAmount(summary[status].totalAmount)}
                  </td>
                </motion.tr>
              ))}
              {/* Grand total */}
              <tr className="totals-row font-semibold">
                <td className="px-4 py-4 text-xs font-bold text-[#2D3436] uppercase tracking-wider">Grand Total</td>
                {CONTRACTS.map(cid => (
                  <React.Fragment key={cid}>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold">{grandTotals[cid].count}</span>
                    </td>
                    <td className={`px-4 py-4 text-right text-xs font-numbers font-bold ${isNegative(grandTotals[cid].amount) ? 'text-red-500' : ''}`}>
                      {formatAmount(grandTotals[cid].amount)}
                    </td>
                  </React.Fragment>
                ))}
                <td className="px-4 py-4 text-center border-l border-[#9E875D]/10">
                  <span className="text-sm font-bold text-[#9E875D]">{grandTotals.totalCount}</span>
                </td>
                <td className={`px-4 py-4 text-right text-sm font-numbers font-bold ${isNegative(grandTotals.totalAmount) ? 'text-red-500' : 'text-[#2D3436]'}`}>
                  {formatAmount(grandTotals.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancy Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-bold text-[#2D3436] mt-8 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          Discrepancy Analysis
          <span className="text-xs font-normal text-gray-400 ml-2">FFC Summary vs RSG To Summary</span>
        </h3>
        <div className="glass-heavy rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="glass-dark">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-300 uppercase tracking-wider">Contract</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-[#e67e22] uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#e67e22]"></div>
                    FFC Summary
                  </div>
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-[#a0764e] uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#6d4c2e]"></div>
                    RSG To Summary
                  </div>
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1.5">
                    <AlertTriangle size={10} />
                    Discrepancy
                  </div>
                </th>
                <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">Count</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACTS.map((cid, idx) => {
                const cv = variations.filter(v => v.contract_id === cid)
                const ffc = cv.reduce((s, v) => s + (Number(v.ffc_summary) || 0), 0)
                const to = cv.reduce((s, v) => s + (Number(v.to_summary) || 0), 0)
                const disc = ffc - to
                return (
                  <motion.tr
                    key={cid}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-b border-black/[0.03] hover:bg-white/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-bold text-[#9E875D]">{cid}</span>
                      <span className="text-xs text-gray-400 ml-2">{CONTRACT_LABELS[cid]}</span>
                    </td>
                    <td className={`px-5 py-4 text-right font-numbers text-sm ${isNegative(ffc) ? 'text-red-500 font-bold' : ''}`}>
                      <span className="bg-orange-50/50 px-2.5 py-1 rounded-xl">{formatAmount(ffc)}</span>
                    </td>
                    <td className={`px-5 py-4 text-right font-numbers text-sm ${isNegative(to) ? 'text-red-500 font-bold' : ''}`}>
                      <span className="bg-amber-50/50 px-2.5 py-1 rounded-xl">{formatAmount(to)}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-numbers text-sm font-bold">
                      {disc !== 0 ? (
                        <span className={`px-3 py-1 rounded-xl ${disc > 0 ? 'bg-orange-50/60 text-orange-700' : 'bg-red-50/60 text-red-600'}`}>
                          {formatAmount(disc)}
                        </span>
                      ) : (
                        <span className="text-green-500 bg-green-50/50 px-3 py-1 rounded-xl">0.00</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-bold glass-pill px-3 py-1">{cv.length}</span>
                    </td>
                  </motion.tr>
                )
              })}
              <tr className="totals-row font-bold">
                <td className="px-5 py-4 text-xs uppercase tracking-wider">Total</td>
                {(() => {
                  const ffc = variations.reduce((s, v) => s + (Number(v.ffc_summary) || 0), 0)
                  const to = variations.reduce((s, v) => s + (Number(v.to_summary) || 0), 0)
                  const disc = ffc - to
                  return (
                    <>
                      <td className={`px-5 py-4 text-right font-numbers text-sm ${isNegative(ffc) ? 'text-red-500' : ''}`}>{formatAmount(ffc)}</td>
                      <td className={`px-5 py-4 text-right font-numbers text-sm ${isNegative(to) ? 'text-red-500' : ''}`}>{formatAmount(to)}</td>
                      <td className={`px-5 py-4 text-right font-numbers text-sm ${disc !== 0 ? 'text-orange-700' : 'text-green-600'}`}>{formatAmount(disc)}</td>
                    </>
                  )
                })()}
                <td className="px-5 py-4 text-center text-sm">{variations.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}

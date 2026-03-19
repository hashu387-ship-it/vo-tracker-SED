import React, { useEffect, useState } from 'react'
import { fetchSummary, exportToCSV } from '../utils/api'
import { STATUS_OPTIONS, STATUS_COLORS, CONTRACT_LABELS, formatAmount, isNegative } from '../utils/formatters'
import StatusBadge from './StatusBadge'

const CONTRACTS = ['R05-A09C07', 'R05-A09C08', 'L09-S01C07']

export default function SummaryTables() {
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('ffc') // 'ffc' or 'rsg'

  useEffect(() => {
    fetchSummary().then(data => { setVariations(data); setLoading(false) })
  }, [])

  if (loading) return <div className="text-center py-12 text-[#9E875D]">Loading summary...</div>

  const amountField = type === 'ffc' ? 'ffc_summary' : 'to_summary'
  const title = type === 'ffc' ? 'FFC Summary' : 'RSG Summary (To Summary)'

  // Build summary: status → contract → { count, amount }
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

  // Grand totals
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2D3436]">Summary Tables</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setType('ffc')}
            className={`px-4 py-1.5 text-sm rounded ${type === 'ffc' ? 'bg-[#9E875D] text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
          >
            FFC Summary
          </button>
          <button
            onClick={() => setType('rsg')}
            className={`px-4 py-1.5 text-sm rounded ${type === 'rsg' ? 'bg-[#9E875D] text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
          >
            RSG Summary
          </button>
          <button
            onClick={() => exportToCSV(variations, `summary-all.csv`)}
            className="px-3 py-1.5 text-sm bg-[#2D3436] text-white rounded hover:bg-gray-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#EDE6D3] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#EDE6D3]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2D3436] uppercase tracking-wider">Status</th>
              {CONTRACTS.map(cid => (
                <th key={cid} className="px-4 py-3 text-center text-xs font-semibold text-[#2D3436] uppercase tracking-wider" colSpan={2}>
                  {CONTRACT_LABELS[cid]}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#2D3436] uppercase tracking-wider" colSpan={2}>Total</th>
            </tr>
            <tr className="bg-[#f5f0e5]">
              <th className="px-4 py-1.5 text-left text-xs text-gray-500"></th>
              {[...CONTRACTS, 'total'].map(c => (
                <React.Fragment key={c}>
                  <th className="px-4 py-1.5 text-center text-xs text-gray-500">Count</th>
                  <th className="px-4 py-1.5 text-right text-xs text-gray-500">Amount (SAR)</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATUS_OPTIONS.filter(status => summary[status].totalCount > 0).map(status => (
              <tr key={status} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5"><StatusBadge status={status} /></td>
                {CONTRACTS.map(cid => (
                  <React.Fragment key={cid}>
                    <td className="px-4 py-2.5 text-center text-xs">
                      {summary[status][cid].count || ''}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-xs font-mono ${isNegative(summary[status][cid].amount) ? 'text-red-600' : ''}`}>
                      {summary[status][cid].count > 0 ? formatAmount(summary[status][cid].amount) : ''}
                    </td>
                  </React.Fragment>
                ))}
                <td className="px-4 py-2.5 text-center text-xs font-medium">{summary[status].totalCount}</td>
                <td className={`px-4 py-2.5 text-right text-xs font-mono font-medium ${isNegative(summary[status].totalAmount) ? 'text-red-600' : ''}`}>
                  {formatAmount(summary[status].totalAmount)}
                </td>
              </tr>
            ))}
            {/* Grand total */}
            <tr className="bg-[#EDE6D3] font-semibold">
              <td className="px-4 py-3 text-xs font-bold">GRAND TOTAL</td>
              {CONTRACTS.map(cid => (
                <React.Fragment key={cid}>
                  <td className="px-4 py-3 text-center text-xs">{grandTotals[cid].count}</td>
                  <td className={`px-4 py-3 text-right text-xs font-mono ${isNegative(grandTotals[cid].amount) ? 'text-red-600' : ''}`}>
                    {formatAmount(grandTotals[cid].amount)}
                  </td>
                </React.Fragment>
              ))}
              <td className="px-4 py-3 text-center text-xs">{grandTotals.totalCount}</td>
              <td className={`px-4 py-3 text-right text-xs font-mono ${isNegative(grandTotals.totalAmount) ? 'text-red-600' : ''}`}>
                {formatAmount(grandTotals.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-contract breakdown */}
      <h3 className="text-lg font-bold text-[#2D3436] mt-8">{title} — Discrepancy View</h3>
      <div className="bg-white rounded-lg shadow-sm border border-[#EDE6D3] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#EDE6D3]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2D3436] uppercase">Contract</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#2D3436] uppercase">FFC Summary</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#2D3436] uppercase">To Summary (RSG)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#2D3436] uppercase">Discrepancy</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#2D3436] uppercase">Count</th>
            </tr>
          </thead>
          <tbody>
            {CONTRACTS.map(cid => {
              const cv = variations.filter(v => v.contract_id === cid)
              const ffc = cv.reduce((s, v) => s + (Number(v.ffc_summary) || 0), 0)
              const to = cv.reduce((s, v) => s + (Number(v.to_summary) || 0), 0)
              const disc = ffc - to
              return (
                <tr key={cid} className="border-b border-gray-100">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-[#9E875D]">{cid}</span>
                    <span className="text-xs text-gray-400 ml-2">{CONTRACT_LABELS[cid]}</span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono text-xs ${isNegative(ffc) ? 'text-red-600' : ''}`}>{formatAmount(ffc)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono text-xs ${isNegative(to) ? 'text-red-600' : ''}`}>{formatAmount(to)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono text-xs font-medium ${disc !== 0 ? 'text-orange-600 bg-orange-50' : ''}`}>
                    {formatAmount(disc)}
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs">{cv.length}</td>
                </tr>
              )
            })}
            <tr className="bg-[#EDE6D3] font-semibold">
              <td className="px-4 py-3 text-xs font-bold">TOTAL</td>
              {(() => {
                const ffc = variations.reduce((s, v) => s + (Number(v.ffc_summary) || 0), 0)
                const to = variations.reduce((s, v) => s + (Number(v.to_summary) || 0), 0)
                const disc = ffc - to
                return (
                  <>
                    <td className={`px-4 py-3 text-right font-mono text-xs ${isNegative(ffc) ? 'text-red-600' : ''}`}>{formatAmount(ffc)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-xs ${isNegative(to) ? 'text-red-600' : ''}`}>{formatAmount(to)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-xs ${disc !== 0 ? 'text-orange-600' : ''}`}>{formatAmount(disc)}</td>
                  </>
                )
              })()}
              <td className="px-4 py-3 text-center text-xs">{variations.length}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

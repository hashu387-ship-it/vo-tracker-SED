import React, { useEffect, useState } from 'react'
import { fetchDashboardStats } from '../utils/api'
import { formatAmountWithSAR, isNegative, CONTRACT_LABELS, STATUS_COLORS } from '../utils/formatters'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats().then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="text-center py-12 text-[#9E875D] font-medium">Loading dashboard...</div>
  if (!data) return null

  const { stats, ffcActions, overdue, allVariations } = data
  const contractIds = ['R05-A09C07', 'R05-A09C08', 'L09-S01C07']

  // Combined totals
  const combinedFFC = contractIds.reduce((s, c) => s + stats[c].ffcTotal, 0)
  const combinedTO = contractIds.reduce((s, c) => s + stats[c].toTotal, 0)
  const combinedOpen = contractIds.reduce((s, c) => s + stats[c].openCount, 0)
  const combinedClosed = contractIds.reduce((s, c) => s + stats[c].closedCount, 0)

  // Combined status counts for pie chart
  const combinedStatus = {}
  contractIds.forEach(c => {
    Object.entries(stats[c].statusCounts).forEach(([status, count]) => {
      combinedStatus[status] = (combinedStatus[status] || 0) + count
    })
  })
  const pieData = Object.entries(combinedStatus).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#2D3436]">Dashboard Overview</h2>

      {/* Combined Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total FFC Summary" value={formatAmountWithSAR(combinedFFC)} negative={combinedFFC < 0} />
        <StatCard label="Total To Summary (RSG)" value={formatAmountWithSAR(combinedTO)} negative={combinedTO < 0} />
        <StatCard
          label="Total Discrepancy"
          value={formatAmountWithSAR(combinedFFC - combinedTO)}
          negative={combinedFFC - combinedTO < 0}
          highlight={combinedFFC - combinedTO !== 0}
        />
        <StatCard label="Open / Closed" value={`${combinedOpen} / ${combinedClosed}`} />
      </div>

      {/* Per-contract cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {contractIds.map(cid => {
          const s = stats[cid]
          return (
            <div key={cid} className="bg-white rounded-lg shadow-sm border border-[#EDE6D3] p-5">
              <h3 className="font-semibold text-[#9E875D] text-sm mb-1">{cid}</h3>
              <p className="text-xs text-gray-500 mb-3">{CONTRACT_LABELS[cid]}</p>
              <div className="space-y-2 text-sm">
                <Row label="FFC Summary" value={formatAmountWithSAR(s.ffcTotal)} neg={s.ffcTotal < 0} />
                <Row label="To Summary (RSG)" value={formatAmountWithSAR(s.toTotal)} neg={s.toTotal < 0} />
                <Row
                  label="Discrepancy"
                  value={formatAmountWithSAR(s.discrepancy)}
                  neg={s.discrepancy < 0}
                  highlight={s.discrepancy !== 0}
                />
                <Row label="Open / Closed" value={`${s.openCount} / ${s.closedCount}`} />
              </div>
              {/* Mini status breakdown */}
              <div className="mt-3 pt-3 border-t border-[#EDE6D3]">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(s.statusCounts).map(([status, count]) => (
                    <span
                      key={status}
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: STATUS_COLORS[status] || '#999' }}
                    >
                      {count} {status}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts + Action Items row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-[#EDE6D3] p-5">
          <h3 className="font-semibold text-[#2D3436] mb-3">Status Distribution (All Contracts)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${value}`}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || '#999'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Action Items */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-[#EDE6D3] p-5">
            <h3 className="font-semibold text-[#2D3436] mb-3">
              Items Needing FFC Action
              <span className="ml-2 text-xs bg-[#FF9800] text-white px-2 py-0.5 rounded-full">{ffcActions.length}</span>
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {ffcActions.length === 0 && <p className="text-sm text-gray-400">No pending FFC actions</p>}
              {ffcActions.map(v => (
                <div key={v.id} className="text-xs flex gap-2 items-baseline">
                  <span className="text-[#9E875D] font-medium whitespace-nowrap">{v.contract_id}</span>
                  <span className="text-gray-500">#{v.no}</span>
                  <span className="truncate">{v.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#EDE6D3] p-5">
            <h3 className="font-semibold text-[#2D3436] mb-3">
              Overdue Items
              <span className="ml-2 text-xs bg-[#F44336] text-white px-2 py-0.5 rounded-full">{overdue.length}</span>
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {overdue.length === 0 && <p className="text-sm text-gray-400">No overdue items</p>}
              {overdue.map(v => (
                <div key={v.id} className="text-xs flex gap-2 items-baseline">
                  <span className="text-[#9E875D] font-medium whitespace-nowrap">{v.contract_id}</span>
                  <span className="text-gray-500">#{v.no}</span>
                  <span className="truncate">{v.description}</span>
                  <span className="text-red-500 whitespace-nowrap ml-auto">
                    {v.ffc_target_date || v.rsg_target_date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, negative, highlight }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-5 ${highlight ? 'border-[#FF9800]' : 'border-[#EDE6D3]'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold mt-1 ${negative ? 'text-red-600' : 'text-[#2D3436]'}`}>{value}</p>
    </div>
  )
}

function Row({ label, value, neg, highlight }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${neg ? 'text-red-600' : ''} ${highlight ? 'bg-yellow-100 px-1 rounded' : ''}`}>{value}</span>
    </div>
  )
}

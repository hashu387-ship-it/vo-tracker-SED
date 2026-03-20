import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { fetchDashboardStats } from '../utils/api'
import { formatAmountWithSAR, formatAmount, isNegative, CONTRACT_LABELS, STATUS_COLORS } from '../utils/formatters'
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock,
  FileWarning, ArrowUpRight, Activity, Target,
  Building2, Landmark, Factory, CircleDot, BarChart3
} from 'lucide-react'
import Tooltip from './Tooltip'

const CONTRACT_ICONS = {
  'R05-A09C07': Building2,
  'R05-A09C08': Landmark,
  'L09-S01C07': Factory,
}

function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = Number(value) || 0
    const duration = 1200
    const start = performance.now()
    const animate = (time) => {
      const elapsed = time - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(0 + (target - 0) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  const formatted = Math.abs(display).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const neg = display < 0

  return (
    <span className={`${className} ${neg ? 'text-red-500' : ''}`}>
      {neg ? `${prefix}(${formatted})${suffix}` : `${prefix}${formatted}${suffix}`}
    </span>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats().then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 rounded-2xl shimmer"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 rounded-2xl shimmer"></div>
          ))}
        </div>
      </div>
    )
  }
  if (!data) return null

  const { stats, ffcActions, overdue, allVariations } = data
  const contractIds = ['R05-A09C07', 'R05-A09C08', 'L09-S01C07']

  const combinedFFC = contractIds.reduce((s, c) => s + stats[c].ffcTotal, 0)
  const combinedTO = contractIds.reduce((s, c) => s + stats[c].toTotal, 0)
  const combinedOpen = contractIds.reduce((s, c) => s + stats[c].openCount, 0)
  const combinedClosed = contractIds.reduce((s, c) => s + stats[c].closedCount, 0)
  const combinedApproved = allVariations.reduce((s, v) => s + (Number(v.approved_on_account) || 0), 0)

  const combinedStatus = {}
  contractIds.forEach(c => {
    Object.entries(stats[c].statusCounts).forEach(([status, count]) => {
      combinedStatus[status] = (combinedStatus[status] || 0) + count
    })
  })
  const pieData = Object.entries(combinedStatus)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const barData = contractIds.map(cid => ({
    name: cid.split('-').pop(),
    'FFC Summary': stats[cid].ffcTotal,
    'RSG Summary': stats[cid].toTotal,
    'Approved OA': allVariations.filter(v => v.contract_id === cid).reduce((s, v) => s + (Number(v.approved_on_account) || 0), 0),
  }))

  const totalVOs = combinedOpen + combinedClosed
  const closedPct = totalVOs > 0 ? Math.round((combinedClosed / totalVOs) * 100) : 0

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2D3436] flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <Activity className="text-[#9E875D]" size={18} />
            </div>
            Dashboard Overview
          </h2>
          <p className="text-sm text-gray-400 mt-0.5 ml-12">Real-time variation order tracking across all contracts</p>
        </div>
        <Tooltip content={`${combinedOpen} open, ${combinedClosed} closed — ${closedPct}% completion rate`}>
          <div className="glass-heavy rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="relative w-11 h-11">
              <svg className="w-11 h-11 -rotate-90">
                <circle cx="22" cy="22" r="17" stroke="rgba(158,135,93,0.15)" strokeWidth="4" fill="none" />
                <circle cx="22" cy="22" r="17" stroke="#9E875D" strokeWidth="4" fill="none"
                  strokeDasharray={`${closedPct} ${100 - closedPct}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#9E875D]">{closedPct}%</span>
            </div>
            <div className="text-xs">
              <p className="font-semibold text-[#2D3436]">Completion</p>
              <p className="text-gray-400">{combinedClosed}/{totalVOs} VOs</p>
            </div>
          </div>
        </Tooltip>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard
          label="FFC Summary"
          value={combinedFFC}
          icon={<TrendingUp size={16} />}
          color="from-[#e67e22] to-[#d35400]"
          accentBg="orange"
          tooltip="Total FFC assessed value across all contracts"
        />
        <KPICard
          label="RSG Summary"
          value={combinedTO}
          icon={<Target size={16} />}
          color="from-[#6d4c2e] to-[#5a3e24]"
          accentBg="blue"
          tooltip="Total RSG To Summary (approved) across all contracts"
        />
        <KPICard
          label="Discrepancy"
          value={combinedFFC - combinedTO}
          icon={combinedFFC - combinedTO !== 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          color={combinedFFC - combinedTO !== 0 ? 'from-orange-500 to-amber-500' : 'from-green-500 to-green-600'}
          accentBg="orange"
          tooltip="Difference between FFC Summary and RSG To Summary"
          highlight={combinedFFC - combinedTO !== 0}
        />
        <KPICard
          label="Approved OA"
          value={combinedApproved}
          icon={<CheckCircle2 size={16} />}
          color="from-violet-500 to-purple-600"
          accentBg="purple"
          tooltip="Total approved on account payments"
        />
        <KPICard
          label="Open / Closed"
          customValue={
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-[#2D3436]">{combinedOpen}</span>
              <span className="text-gray-300">/</span>
              <span className="text-lg font-medium text-gray-400">{combinedClosed}</span>
            </div>
          }
          icon={<CircleDot size={16} />}
          color="from-[#9E875D] to-[#b8a57a]"
          accentBg="bronze"
          tooltip={`${combinedOpen} variations still open, ${combinedClosed} closed`}
        />
      </motion.div>

      {/* Per-contract cards */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {contractIds.map((cid, idx) => {
          const s = stats[cid]
          const Icon = CONTRACT_ICONS[cid]
          const contractVariations = allVariations.filter(v => v.contract_id === cid)
          const oa = contractVariations.reduce((sum, v) => sum + (Number(v.approved_on_account) || 0), 0)

          return (
            <motion.div
              key={cid}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="glass-heavy rounded-2xl overflow-hidden card-hover"
            >
              {/* Card header */}
              <div className="glass-dark px-5 py-3 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#9E875D]/15 flex items-center justify-center backdrop-blur-sm">
                    <Icon size={15} className="text-[#c4a96a]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{cid}</h3>
                    <p className="text-[10px] text-gray-400">{CONTRACT_LABELS[cid]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-green-400 font-medium">{s.openCount} open</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-xs text-gray-400">{s.closedCount} closed</span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 space-y-2.5">
                <MetricRow label="FFC Summary" value={s.ffcTotal} dot="bg-[#e67e22]" bg="bg-orange-50/50" text="text-[#d35400]" />
                <MetricRow label="RSG Summary" value={s.toTotal} dot="bg-[#6d4c2e]" bg="bg-amber-50/50" text="text-[#6d4c2e]" />
                {s.discrepancy !== 0 && (
                  <MetricRow label="Discrepancy" value={s.discrepancy} icon={<AlertTriangle size={11} className="text-orange-500" />} bg="bg-orange-50/50" text="text-orange-700" />
                )}
                {oa > 0 && (
                  <MetricRow label="Approved OA" value={oa} dot="bg-violet-500" bg="bg-violet-50/50" text="text-violet-700" />
                )}

                {/* Status badges */}
                <div className="pt-2.5 border-t border-black/[0.04]">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Status Breakdown</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(s.statusCounts).map(([status, count]) => (
                      <Tooltip key={status} content={`${count} variation(s) with status: ${status}`}>
                        <span
                          className="status-badge text-[10px] px-2 py-0.5 rounded-full text-white font-medium shadow-sm"
                          style={{ backgroundColor: STATUS_COLORS[status] || '#999' }}
                        >
                          {count} {status.length > 20 ? status.substring(0, 18) + '...' : status}
                        </span>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="glass-heavy rounded-2xl p-5 card-hover">
          <h3 className="font-semibold text-[#2D3436] mb-1 flex items-center gap-2">
            <BarChart3 size={15} className="text-[#9E875D]" />
            Status Distribution
          </h3>
          <p className="text-xs text-gray-400 mb-3">All contracts combined</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={55}
                paddingAngle={2}
                label={({ name, value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ strokeWidth: 1 }}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || '#999'} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
                ))}
              </Pie>
              <RTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const { name, value } = payload[0].payload
                  return (
                    <div className="glass-dark text-white px-3 py-2 rounded-xl text-xs shadow-lg">
                      <p className="font-semibold">{name}</p>
                      <p className="text-gray-300">{value} variation(s)</p>
                    </div>
                  )
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => <span className="text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="glass-heavy rounded-2xl p-5 card-hover">
          <h3 className="font-semibold text-[#2D3436] mb-1 flex items-center gap-2">
            <BarChart3 size={15} className="text-[#9E875D]" />
            Contract Comparison
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-[#e67e22] mr-1"></span>FFC
            <span className="inline-block w-2 h-2 rounded-full bg-[#6d4c2e] ml-3 mr-1"></span>RSG
            <span className="inline-block w-2 h-2 rounded-full bg-violet-500 ml-3 mr-1"></span>Approved OA
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(158,135,93,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(1) + 'M'} />
              <RTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="glass-dark text-white px-3 py-2 rounded-xl text-xs shadow-lg">
                      <p className="font-semibold mb-1">{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} style={{ color: p.color }}>
                          {p.name}: SAR {formatAmount(p.value)}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Bar dataKey="FFC Summary" fill="#e67e22" radius={[6, 6, 0, 0]} />
              <Bar dataKey="RSG Summary" fill="#6d4c2e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Approved OA" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Action items */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FFC Actions */}
        <div className="glass-heavy rounded-2xl overflow-hidden card-hover">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileWarning size={15} />
              Items Needing FFC Action
            </h3>
            <span className={`text-sm font-bold bg-white/20 backdrop-blur-sm px-3 py-0.5 rounded-full text-white ${ffcActions.length > 0 ? 'pulse-glow' : ''}`}>
              {ffcActions.length}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto p-3 space-y-1.5">
            {ffcActions.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 size={32} className="mx-auto text-emerald-200 mb-2" />
                <p className="text-sm text-gray-400">No pending FFC actions</p>
              </div>
            )}
            {ffcActions.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-orange-50/50 transition-colors group"
              >
                <span className="text-[10px] text-orange-500 font-bold bg-orange-100/70 px-1.5 py-0.5 rounded-lg mt-0.5">#{v.no}</span>
                <div className="flex-1 min-w-0">
                  <Tooltip content={`${v.description}\n\nContract: ${v.contract_id}\nAction By: ${v.action_by}`}>
                    <p className="text-xs text-gray-700 truncate">{v.description}</p>
                  </Tooltip>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#9E875D] font-medium">{v.contract_id}</span>
                    <span className="text-[10px] px-1.5 py-0 rounded-full text-white font-medium"
                      style={{ backgroundColor: STATUS_COLORS[v.rsg_status] || '#999', fontSize: '9px' }}>
                      {v.rsg_status}
                    </span>
                  </div>
                </div>
                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Overdue Items */}
        <div className="glass-heavy rounded-2xl overflow-hidden card-hover">
          <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock size={15} />
              Overdue Items
            </h3>
            <span className={`text-sm font-bold bg-white/20 backdrop-blur-sm px-3 py-0.5 rounded-full text-white ${overdue.length > 0 ? 'pulse-glow' : ''}`}>
              {overdue.length}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto p-3 space-y-1.5">
            {overdue.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 size={32} className="mx-auto text-emerald-200 mb-2" />
                <p className="text-sm text-gray-400">No overdue items</p>
              </div>
            )}
            {overdue.map((v, i) => {
              const dueDate = v.ffc_target_date || v.rsg_target_date
              const daysOverdue = Math.floor((new Date() - new Date(dueDate)) / 86400000)
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-red-50/50 transition-colors group"
                >
                  <span className="text-[10px] text-red-500 font-bold bg-red-100/70 px-1.5 py-0.5 rounded-lg mt-0.5">#{v.no}</span>
                  <div className="flex-1 min-w-0">
                    <Tooltip content={`${v.description}\n\nDue: ${dueDate}\n${daysOverdue} days overdue`}>
                      <p className="text-xs text-gray-700 truncate">{v.description}</p>
                    </Tooltip>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#9E875D] font-medium">{v.contract_id}</span>
                      <span className="text-[10px] text-red-500 font-medium">{daysOverdue}d overdue</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-red-400 whitespace-nowrap font-numbers flex-shrink-0 mt-0.5">{dueDate}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function MetricRow({ label, value, dot, icon, bg, text }) {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-xl ${bg} border border-white/50`}>
      <div className="flex items-center gap-2">
        {icon || <div className={`w-2 h-2 rounded-full ${dot}`}></div>}
        <span className={`text-xs font-medium ${text}`}>{label}</span>
      </div>
      <span className={`text-sm font-bold font-numbers ${isNegative(value) ? 'text-red-500' : text}`}>
        {formatAmount(value)}
      </span>
    </div>
  )
}

function KPICard({ label, value, customValue, icon, color, accentBg, tooltip, highlight }) {
  return (
    <Tooltip content={tooltip}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className={`glass-heavy rounded-2xl overflow-hidden ${highlight ? 'ring-2 ring-orange-300/50 ring-offset-2 ring-offset-transparent' : ''}`}
      >
        <div className={`bg-gradient-to-r ${color} px-4 py-2 flex items-center gap-2`}>
          <span className="text-white/80">{icon}</span>
          <span className="text-[11px] text-white/90 font-medium">{label}</span>
        </div>
        <div className="px-4 py-3">
          {customValue || (
            <AnimatedNumber
              value={value}
              prefix="SAR "
              className="text-lg font-bold font-numbers"
            />
          )}
        </div>
      </motion.div>
    </Tooltip>
  )
}

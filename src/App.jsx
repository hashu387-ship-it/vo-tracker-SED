import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Table2, BarChart3,
  Menu, X, Sparkles
} from 'lucide-react'
import Dashboard from './components/Dashboard'
import VariationRegister from './components/VariationRegister'
import SummaryTables from './components/SummaryTables'
import Tooltip from './components/Tooltip'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & key metrics' },
  { id: 'register', label: 'Register', icon: Table2, desc: 'Full editable variation register' },
  { id: 'summary', label: 'Summary', icon: BarChart3, desc: 'Status breakdowns & analysis' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── TOP BAR: Dark glass ─── */}
      <header className="glass-dark px-6 py-2.5 flex items-center justify-between z-50 no-print sticky top-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9E875D] to-[#c4a96a] flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-[#9E875D]/20">
              VO
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight text-white">VO Tracker</h1>
              <p className="text-[10px] text-[#c4a96a] font-medium tracking-widest uppercase">SED / MTH Contracts</p>
            </div>
          </div>
        </div>

        {/* Center nav — glass pills */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Tooltip key={tab.id} content={tab.desc} placement="bottom">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#9E875D]/90 to-[#b8a57a]/90 text-white shadow-lg shadow-[#9E875D]/25 backdrop-blur-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              </Tooltip>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Tooltip content="Red Sea Global — Senior QS Tool" placement="bottom">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-gray-400">
                {now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-[#c4a96a]">
                {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </Tooltip>
          <Tooltip content="Mohamed Roomy — Sr. Quantity Surveyor" placement="bottom-end">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9E875D] to-[#c4a96a] flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-[#9E875D]/20">
              MR
            </div>
          </Tooltip>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden flex gap-1 p-2 glass-subtle overflow-x-auto no-print">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'glass-btn-primary'
                  : 'glass-pill text-gray-500'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1920px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'register' && <VariationRegister />}
            {activeTab === 'summary' && <SummaryTables />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="glass-dark text-gray-500 text-[10px] px-6 py-2.5 flex items-center justify-between no-print">
        <span>&copy; {new Date().getFullYear()} Red Sea Global &mdash; MEP Variation Order Management</span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
          Live &middot; All Rights Reserved Mohamed Roomy Mohamed Hassan Sr. Quantity Surveyor FFC
        </span>
        <span>Last sync: {now.toLocaleTimeString('en-GB')}</span>
      </footer>
    </div>
  )
}

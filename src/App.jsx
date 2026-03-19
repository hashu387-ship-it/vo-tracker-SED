import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Table2, BarChart3, Settings, ChevronRight,
  Sun, Moon, Bell, HelpCircle, Menu, X
} from 'lucide-react'
import Dashboard from './components/Dashboard'
import VariationRegister from './components/VariationRegister'
import SummaryTables from './components/SummaryTables'
import Tooltip from './components/Tooltip'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview of all contracts & key metrics' },
  { id: 'register', label: 'Variation Register', icon: Table2, desc: 'Full editable register with all variations' },
  { id: 'summary', label: 'Summary Tables', icon: BarChart3, desc: 'FFC & RSG summary breakdowns' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header bar */}
      <header className="bg-gradient-to-r from-[#1a1a2e] via-[#2D3436] to-[#1a1a2e] text-white px-6 py-2.5 flex items-center justify-between shadow-xl z-50 no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 hover:bg-white/10 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#9E875D] to-[#c4a96a] flex items-center justify-center font-bold text-sm shadow-lg">
              RSG
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight">VO Tracker</h1>
              <p className="text-[10px] text-[#9E875D] font-medium tracking-widest uppercase">SED / MTH Contracts</p>
            </div>
          </div>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Tooltip key={tab.id} content={tab.desc} placement="bottom">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#9E875D] to-[#b8a57a] text-white shadow-lg shadow-[#9E875D]/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
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
              <p className="text-xs text-gray-400">
                {now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-[#9E875D]">
                {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </Tooltip>
          <Tooltip content="Mohamed Roomy — Sr. Quantity Surveyor" placement="bottom-end">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9E875D] to-[#c4a96a] flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform">
              MR
            </div>
          </Tooltip>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden flex gap-1 p-2 bg-white/80 backdrop-blur border-b border-[#EDE6D3] overflow-x-auto no-print">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#9E875D] text-white'
                  : 'text-gray-500 bg-gray-100'
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'register' && <VariationRegister />}
            {activeTab === 'summary' && <SummaryTables />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#1a1a2e] via-[#2D3436] to-[#1a1a2e] text-gray-500 text-[10px] px-6 py-2.5 flex items-center justify-between no-print">
        <span>© {new Date().getFullYear()} Red Sea Global — MEP Variation Order Management</span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Live &middot; All Rights Reserved Mohamed Roomy Mohamed Hassan Sr. Quantity Surveyor FFC
        </span>
        <span>Last sync: {now.toLocaleTimeString('en-GB')}</span>
      </footer>
    </div>
  )
}

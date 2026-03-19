import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import VariationRegister from './components/VariationRegister'
import SummaryTables from './components/SummaryTables'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'register', label: 'Variation Register' },
  { id: 'summary', label: 'Summary Tables' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#2D3436] text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#9E875D] flex items-center justify-center font-bold text-lg">
            RSG
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">VO Tracker</h1>
            <p className="text-xs text-gray-400">SED / MTH Variation Order Management</p>
          </div>
        </div>
        <nav className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#9E875D] text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 max-w-[1800px] mx-auto w-full">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'register' && <VariationRegister />}
        {activeTab === 'summary' && <SummaryTables />}
      </main>

      {/* Footer */}
      <footer className="bg-[#2D3436] text-gray-400 text-xs px-6 py-3 text-center">
        Red Sea Global — MEP Variation Order Management &middot; Last updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </footer>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchChangeLog } from '../utils/api'
import { X, History, ArrowRight, Clock } from 'lucide-react'

export default function ChangeLog({ variationId, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChangeLog(variationId).then(data => {
      setLogs(data)
      setLoading(false)
    })
  }, [variationId])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="modal-glass max-w-lg w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="glass-dark px-6 py-4 flex justify-between items-center rounded-t-[28px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#9E875D]/15 flex items-center justify-center backdrop-blur-sm">
                <History size={15} className="text-[#c4a96a]" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Change History</h3>
                <p className="text-[10px] text-gray-400">{logs.length} changes recorded</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 shimmer rounded-2xl"></div>)}
              </div>
            )}
            {!loading && logs.length === 0 && (
              <div className="text-center py-12">
                <Clock size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No changes recorded yet</p>
                <p className="text-xs text-gray-300 mt-1">Changes will appear here when you edit this variation</p>
              </div>
            )}
            <div className="space-y-3">
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-6 pb-3 border-l-2 border-[#EDE6D3]/50 last:border-l-0"
                >
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-[#9E875D]"></div>

                  <div className="glass rounded-2xl p-3 hover:bg-white/50 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#9E875D] glass-pill px-2 py-0.5">
                        {log.field_name.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(log.changed_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-400 bg-red-50/50 px-2 py-1 rounded-xl line-through max-w-[40%] truncate">
                        {log.old_value || '(empty)'}
                      </span>
                      <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                      <span className="text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-xl font-medium max-w-[40%] truncate">
                        {log.new_value || '(empty)'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

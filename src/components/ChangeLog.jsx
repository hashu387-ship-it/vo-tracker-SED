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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2D3436] to-[#3d4446] px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#9E875D]/20 flex items-center justify-center">
                <History size={16} className="text-[#9E875D]" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Change History</h3>
                <p className="text-[10px] text-gray-400">{logs.length} changes recorded</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 shimmer rounded-xl"></div>)}
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
                  className="relative pl-6 pb-3 border-l-2 border-[#EDE6D3] last:border-l-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-[#9E875D]"></div>

                  <div className="bg-gray-50 rounded-xl p-3 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#9E875D] bg-[#9E875D]/10 px-2 py-0.5 rounded-md">
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
                      <span className="text-red-400 bg-red-50 px-2 py-1 rounded-md line-through max-w-[40%] truncate">
                        {log.old_value || '(empty)'}
                      </span>
                      <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md font-medium max-w-[40%] truncate">
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

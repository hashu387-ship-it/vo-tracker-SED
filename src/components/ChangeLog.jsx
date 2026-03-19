import React, { useEffect, useState } from 'react'
import { fetchChangeLog } from '../utils/api'

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-[#EDE6D3] flex justify-between items-center">
          <h3 className="font-semibold text-[#2D3436]">Change History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading && <p className="text-sm text-gray-400">Loading...</p>}
          {!loading && logs.length === 0 && <p className="text-sm text-gray-400">No changes recorded</p>}
          {logs.map(log => (
            <div key={log.id} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="flex justify-between text-xs text-gray-400">
                <span className="font-medium text-[#9E875D]">{log.field_name}</span>
                <span>{new Date(log.changed_at).toLocaleString('en-GB')}</span>
              </div>
              <div className="mt-1 text-xs">
                <span className="text-red-400 line-through">{log.old_value || '(empty)'}</span>
                <span className="mx-2 text-gray-300">&rarr;</span>
                <span className="text-green-600">{log.new_value || '(empty)'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

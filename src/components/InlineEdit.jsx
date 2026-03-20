import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STATUS_OPTIONS, ACTION_BY_OPTIONS, formatAmount, isNegative } from '../utils/formatters'
import StatusBadge from './StatusBadge'
import Tooltip from './Tooltip'
import { Pencil, Check, X } from 'lucide-react'

const AMOUNT_FIELDS = [
  'ffc_revised_submission', 'ffc_initial_submission', 'rsg_assessment',
  'ffc_summary', 'to_summary', 'approved_on_account'
]
const DATE_FIELDS = ['ffc_target_date', 'rsg_target_date']

const FIELD_TOOLTIPS = {
  ffc_revised_submission: 'FFC Revised Submission Amount (SAR)',
  ffc_initial_submission: 'FFC Initial Submission Amount (SAR)',
  rsg_assessment: 'RSG Assessment Amount (SAR)',
  ffc_summary: 'FFC Summary (agreed amount from FFC side)',
  to_summary: 'To Summary (RSG approved amount)',
  approved_on_account: 'Amount approved on account / interim payment',
  rsg_status: 'Current RSG status — click to change',
  action_by: 'Party responsible for next action',
  ffc_remarks: 'FFC internal remarks — click to edit',
  rsg_remarks: 'RSG remarks / comments — click to edit',
  ffc_target_date: 'FFC target completion date',
  rsg_target_date: 'RSG target completion date',
  substantiated_docs: 'Substantiated documentation reference',
  description: 'Variation description — click to edit',
  vo_ref: 'Variation Order reference number',
}

export default function InlineEdit({ value, field, onSave, onClick }) {
  const stopProp = (e) => e.stopPropagation()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.select) inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleSave = async () => {
    if (editValue === value) {
      setEditing(false)
      return
    }
    let finalValue = editValue
    if (AMOUNT_FIELDS.includes(field)) {
      finalValue = parseFloat(String(editValue).replace(/[^0-9.\-]/g, '')) || 0
    }
    setSaving(true)
    await onSave(field, finalValue)
    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const tooltip = FIELD_TOOLTIPS[field] || 'Click to edit'

  if (!editing) {
    // Display mode
    if (field === 'rsg_status') {
      return (
        <div onClick={(e) => { stopProp(e); setEditing(true) }} className="cursor-pointer group relative">
          <StatusBadge status={value} />
          <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil size={8} className="text-[#9E875D]" />
          </span>
        </div>
      )
    }
    if (AMOUNT_FIELDS.includes(field)) {
      const neg = isNegative(value)
      return (
        <Tooltip content={tooltip}>
          <div
            onClick={(e) => { stopProp(e); setEditing(true) }}
            className={`cursor-pointer text-right font-numbers text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded-lg transition-all hover:bg-white/50 hover:shadow-sm group relative ${neg ? 'text-red-600 font-semibold' : 'text-gray-700'}`}
          >
            {formatAmount(value)}
            <Pencil size={7} className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-40 text-[#9E875D]" />
          </div>
        </Tooltip>
      )
    }
    if (field === 'action_by') {
      const colors = {
        'FFC': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'RSG': 'bg-blue-100 text-blue-700 border-blue-200',
        'RSG/FFC': 'bg-purple-100 text-purple-700 border-purple-200',
      }
      return (
        <Tooltip content={tooltip}>
          <div onClick={(e) => { stopProp(e); setEditing(true) }} className="cursor-pointer group relative">
            {value ? (
              <span className={`inline-block text-[9px] px-1.5 py-0 rounded font-semibold border ${colors[value] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {value}
              </span>
            ) : (
              <span className="text-gray-300 text-xs">—</span>
            )}
            <Pencil size={7} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-40 text-[#9E875D]" />
          </div>
        </Tooltip>
      )
    }
    if (DATE_FIELDS.includes(field)) {
      const isOverdue = value && new Date(value) < new Date()
      return (
        <Tooltip content={`${tooltip}${isOverdue ? '\n⚠️ OVERDUE' : ''}`}>
          <div
            onClick={(e) => { stopProp(e); setEditing(true) }}
            className={`cursor-pointer text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded-lg transition-all hover:bg-white/50 hover:shadow-sm group relative ${
              isOverdue ? 'text-red-500 font-semibold bg-red-50/50' : ''
            }`}
          >
            {value ? formatDateDisplay(value) : <span className="text-gray-300">—</span>}
            <Pencil size={7} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-40 text-[#9E875D]" />
          </div>
        </Tooltip>
      )
    }
    // Text fields
    const isDescription = field === 'description'
    return (
      <Tooltip content={value ? `${tooltip}\n\n${value}` : tooltip}>
        <div
          onClick={(e) => { stopProp(e); setEditing(true) }}
          className={`cursor-pointer text-[10px] px-1.5 py-0.5 rounded-lg transition-all hover:bg-white/50 hover:shadow-sm group relative overflow-hidden`}
        >
          <span className={isDescription ? 'line-clamp-2 text-[11px] leading-tight font-medium text-gray-800' : 'truncate block leading-tight'}>{value || <span className="text-gray-300">—</span>}</span>
          <Pencil size={9} className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-40 text-[#9E875D]" />
        </div>
      </Tooltip>
    )
  }

  // Edit mode
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {field === 'rsg_status' ? (
          <select ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} className="inline-edit-input text-[10px]">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : field === 'action_by' ? (
          <select ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} className="inline-edit-input text-[10px]">
            {ACTION_BY_OPTIONS.map(s => <option key={s} value={s}>{s || '(blank)'}</option>)}
          </select>
        ) : DATE_FIELDS.includes(field) ? (
          <input ref={inputRef} type="date" value={editValue || ''} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className="inline-edit-input text-[10px]" />
        ) : AMOUNT_FIELDS.includes(field) ? (
          <input ref={inputRef} type="text" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className="inline-edit-input text-[10px] text-right font-numbers" />
        ) : (field === 'ffc_remarks' || field === 'rsg_remarks') ? (
          <div>
            <textarea ref={inputRef} value={editValue || ''} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') handleCancel() }} className="inline-edit-input text-[10px] min-h-[60px] resize-y" rows={2} />
            <div className="flex justify-end gap-1 mt-0.5">
              <button onClick={handleCancel} className="p-0.5 rounded bg-gray-100 hover:bg-gray-200"><X size={10} /></button>
              <button onClick={handleSave} className="p-0.5 rounded bg-[#9E875D] text-white hover:bg-[#8a7650]"><Check size={10} /></button>
            </div>
          </div>
        ) : (
          <input ref={inputRef} type="text" value={editValue || ''} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className="inline-edit-input text-[10px]" />
        )}
        {saving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/70 flex items-center justify-center rounded"
          >
            <div className="w-4 h-4 border-2 border-[#9E875D] border-t-transparent rounded-full animate-spin"></div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

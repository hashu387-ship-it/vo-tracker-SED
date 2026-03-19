import React, { useState, useRef, useEffect } from 'react'
import { STATUS_OPTIONS, ACTION_BY_OPTIONS, formatAmount, isNegative } from '../utils/formatters'
import StatusBadge from './StatusBadge'

const AMOUNT_FIELDS = [
  'ffc_revised_submission', 'ffc_initial_submission', 'rsg_assessment',
  'ffc_summary', 'to_summary', 'approved_on_account'
]

const DATE_FIELDS = ['ffc_target_date', 'rsg_target_date']
const TEXT_FIELDS = ['ffc_remarks', 'rsg_remarks', 'substantiated_docs', 'description', 'vo_ref']

export default function InlineEdit({ value, field, onSave }) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  const handleSave = () => {
    setEditing(false)
    if (editValue !== value) {
      let finalValue = editValue
      if (AMOUNT_FIELDS.includes(field)) {
        finalValue = parseFloat(String(editValue).replace(/[^0-9.\-]/g, '')) || 0
      }
      onSave(field, finalValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setEditValue(value); setEditing(false) }
  }

  if (!editing) {
    // Display mode
    if (field === 'rsg_status') {
      return (
        <div onClick={() => setEditing(true)} className="cursor-pointer">
          <StatusBadge status={value} />
        </div>
      )
    }
    if (AMOUNT_FIELDS.includes(field)) {
      const neg = isNegative(value)
      return (
        <div
          onClick={() => setEditing(true)}
          className={`cursor-pointer text-right font-mono text-xs whitespace-nowrap ${neg ? 'text-red-600 font-medium' : ''}`}
        >
          {formatAmount(value)}
        </div>
      )
    }
    if (DATE_FIELDS.includes(field)) {
      return (
        <div onClick={() => setEditing(true)} className="cursor-pointer text-xs whitespace-nowrap">
          {value || <span className="text-gray-300">—</span>}
        </div>
      )
    }
    // Text fields
    return (
      <div
        onClick={() => setEditing(true)}
        className="cursor-pointer text-xs max-w-[200px] truncate"
        title={value}
      >
        {value || <span className="text-gray-300">—</span>}
      </div>
    )
  }

  // Edit mode
  if (field === 'rsg_status') {
    return (
      <select
        ref={inputRef}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        className="inline-edit-input text-xs"
      >
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    )
  }

  if (field === 'action_by') {
    return (
      <select
        ref={inputRef}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        className="inline-edit-input text-xs"
      >
        {ACTION_BY_OPTIONS.map(s => <option key={s} value={s}>{s || '(blank)'}</option>)}
      </select>
    )
  }

  if (DATE_FIELDS.includes(field)) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={editValue || ''}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="inline-edit-input text-xs"
      />
    )
  }

  if (AMOUNT_FIELDS.includes(field)) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="inline-edit-input text-xs text-right font-mono"
      />
    )
  }

  // Text fields - use textarea for remarks
  if (field === 'ffc_remarks' || field === 'rsg_remarks') {
    return (
      <textarea
        ref={inputRef}
        value={editValue || ''}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => { if (e.key === 'Escape') { setEditValue(value); setEditing(false) } }}
        className="inline-edit-input text-xs min-h-[60px] resize-y"
        rows={3}
      />
    )
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue || ''}
      onChange={e => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="inline-edit-input text-xs"
    />
  )
}

import React, { useState } from 'react'
import { createVariation } from '../utils/api'
import { STATUS_OPTIONS, ACTION_BY_OPTIONS } from '../utils/formatters'

const INITIAL = {
  contract_id: 'R05-A09C07',
  no: '',
  vo_ref: '',
  description: '',
  rsg_status: 'Potential/ Not Submitted',
  ffc_revised_submission: 0,
  ffc_initial_submission: 0,
  rsg_assessment: 0,
  ffc_summary: 0,
  to_summary: 0,
  approved_on_account: 0,
  ffc_remarks: '',
  rsg_remarks: '',
  action_by: '',
  ffc_target_date: '',
  rsg_target_date: '',
  substantiated_docs: '',
  is_closed: 0,
}

export default function AddVariation({ onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description) return alert('Description is required')
    setSaving(true)
    try {
      const v = await createVariation({
        ...form,
        no: Number(form.no) || 0,
        ffc_revised_submission: Number(form.ffc_revised_submission) || 0,
        ffc_initial_submission: Number(form.ffc_initial_submission) || 0,
        rsg_assessment: Number(form.rsg_assessment) || 0,
        ffc_summary: Number(form.ffc_summary) || 0,
        to_summary: Number(form.to_summary) || 0,
        approved_on_account: Number(form.approved_on_account) || 0,
      })
      onCreated(v)
      onClose()
    } catch (err) {
      alert('Error creating variation: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-[#EDE6D3] flex justify-between items-center">
          <h3 className="font-semibold text-[#2D3436]">Add New Variation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contract</label>
              <select value={form.contract_id} onChange={e => set('contract_id', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm">
                <option value="R05-A09C07">R05-A09C07 — C07 Buildings (SED)</option>
                <option value="R05-A09C08">R05-A09C08 — C08 Infra (SED)</option>
                <option value="L09-S01C07">L09-S01C07 — C07 Buildings (MTH)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">No</label>
              <input type="number" value={form.no} onChange={e => set('no', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">VO Ref</label>
              <input type="text" value={form.vo_ref} onChange={e => set('vo_ref', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.rsg_status} onChange={e => set('rsg_status', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <input type="text" value={form.description} onChange={e => set('description', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {['ffc_revised_submission', 'ffc_initial_submission', 'rsg_assessment', 'ffc_summary', 'to_summary', 'approved_on_account'].map(f => (
              <div key={f}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                <input type="number" step="0.01" value={form[f]} onChange={e => set(f, e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Action By</label>
              <select value={form.action_by} onChange={e => set('action_by', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm">
                {ACTION_BY_OPTIONS.map(s => <option key={s} value={s}>{s || '(blank)'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Substantiated Docs</label>
              <input type="text" value={form.substantiated_docs} onChange={e => set('substantiated_docs', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">FFC Target Date</label>
              <input type="date" value={form.ffc_target_date} onChange={e => set('ffc_target_date', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">RSG Target Date</label>
              <input type="date" value={form.rsg_target_date} onChange={e => set('rsg_target_date', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">FFC Remarks</label>
            <textarea value={form.ffc_remarks} onChange={e => set('ffc_remarks', e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">RSG Remarks</label>
            <textarea value={form.rsg_remarks} onChange={e => set('rsg_remarks', e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-[#9E875D] text-white rounded hover:bg-[#8a7650] disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Variation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

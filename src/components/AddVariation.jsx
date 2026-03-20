import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createVariation } from '../utils/api'
import { STATUS_OPTIONS, ACTION_BY_OPTIONS } from '../utils/formatters'
import { X, Plus, FileText, DollarSign, MessageSquare } from 'lucide-react'

const INITIAL = {
  contract_id: 'R05-A09C07', no: '', vo_ref: '', description: '',
  rsg_status: 'Potential/ Not Submitted',
  ffc_revised_submission: 0, ffc_initial_submission: 0, rsg_assessment: 0,
  ffc_summary: 0, to_summary: 0, approved_on_account: 0,
  ffc_remarks: '', rsg_remarks: '', action_by: '',
  ffc_target_date: '', rsg_target_date: '', substantiated_docs: '', is_closed: 0,
}

export default function AddVariation({ onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)

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
    } finally { setSaving(false) }
  }

  const steps = [
    { label: 'Basic Info', icon: FileText },
    { label: 'Amounts', icon: DollarSign },
    { label: 'Details', icon: MessageSquare },
  ]

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
          className="modal-glass max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="glass-dark px-6 py-4 flex justify-between items-center rounded-t-[28px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#9E875D]/15 flex items-center justify-center backdrop-blur-sm">
                <Plus size={15} className="text-[#c4a96a]" />
              </div>
              <h3 className="font-semibold text-white">Add New Variation</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 px-6 py-3 glass-subtle">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <React.Fragment key={i}>
                  <button
                    onClick={() => setStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                      step === i ? 'glass-btn-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/30'
                    }`}
                  >
                    <Icon size={13} />
                    {s.label}
                  </button>
                  {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200/50"></div>}
                </React.Fragment>
              )
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Contract">
                      <select value={form.contract_id} onChange={e => set('contract_id', e.target.value)}>
                        <option value="R05-A09C07">R05-A09C07 — C07 Buildings (SED)</option>
                        <option value="R05-A09C08">R05-A09C08 — C08 Infra (SED)</option>
                        <option value="L09-S01C07">L09-S01C07 — C07 Buildings (MTH)</option>
                      </select>
                    </Field>
                    <Field label="No">
                      <input type="number" value={form.no} onChange={e => set('no', e.target.value)} placeholder="e.g. 50" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="VO Ref">
                      <input type="text" value={form.vo_ref} onChange={e => set('vo_ref', e.target.value)} placeholder="e.g. VO-12" />
                    </Field>
                    <Field label="Status">
                      <select value={form.rsg_status} onChange={e => set('rsg_status', e.target.value)}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Description *">
                    <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Enter variation description..." required />
                  </Field>
                  <Field label="Action By">
                    <select value={form.action_by} onChange={e => set('action_by', e.target.value)}>
                      {ACTION_BY_OPTIONS.map(s => <option key={s} value={s}>{s || '(blank)'}</option>)}
                    </select>
                  </Field>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    FFC Values (SAR)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['ffc_revised_submission', 'ffc_initial_submission', 'ffc_summary'].map(f => (
                      <Field key={f} label={f.replace('ffc_', '').replace(/_/g, ' ')}>
                        <input type="number" step="0.01" value={form[f]} onChange={e => set(f, e.target.value)} className="font-numbers text-right" />
                      </Field>
                    ))}
                  </div>
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 pt-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    RSG Values (SAR)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['rsg_assessment', 'to_summary', 'approved_on_account'].map(f => (
                      <Field key={f} label={f.replace('rsg_', '').replace(/_/g, ' ')}>
                        <input type="number" step="0.01" value={form[f]} onChange={e => set(f, e.target.value)} className="font-numbers text-right" />
                      </Field>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="FFC Target Date">
                      <input type="date" value={form.ffc_target_date} onChange={e => set('ffc_target_date', e.target.value)} />
                    </Field>
                    <Field label="RSG Target Date">
                      <input type="date" value={form.rsg_target_date} onChange={e => set('rsg_target_date', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="FFC Remarks">
                    <textarea value={form.ffc_remarks} onChange={e => set('ffc_remarks', e.target.value)} rows={3} placeholder="FFC internal remarks..." />
                  </Field>
                  <Field label="RSG Remarks">
                    <textarea value={form.rsg_remarks} onChange={e => set('rsg_remarks', e.target.value)} rows={3} placeholder="RSG remarks / comments..." />
                  </Field>
                  <Field label="Substantiated Docs">
                    <input type="text" value={form.substantiated_docs} onChange={e => set('substantiated_docs', e.target.value)} placeholder="Document references..." />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 glass-subtle rounded-b-[28px]">
            <div className="flex gap-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(step - 1)} className="glass-btn px-4 py-2 text-sm text-gray-500">
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="glass-btn px-4 py-2 text-sm text-gray-500">
                Cancel
              </button>
              {step < 2 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="glass-btn-primary px-5 py-2 text-sm font-medium">
                  Next
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={saving} className="glass-btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  ) : 'Create Variation'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {React.cloneElement(children, {
        className: (children.props.className || '') + ' w-full glass-input px-3 py-2.5 text-sm outline-none'
      })}
    </div>
  )
}

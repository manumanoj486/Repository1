import React, { useState } from 'react'
import { useData } from '../../context/DataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmationModal from '../shared/ConfirmationModal'
import FormInput from '../shared/FormInput'
import FormSelect from '../shared/FormSelect'
import SuccessAlert from '../shared/SuccessAlert'
import { formatINR } from '../../lib/finance'

const CATEGORIES = ['Spa', 'Laundry', 'Transport', 'Concierge', 'Gym', 'Pool', 'Room Service', 'Other'].map((v) => ({ value: v, label: v }))
const EMPTY = { name: '', category: 'Other', price: '', description: '' }

export default function ServiceManagementTable() {
  const { services, addService, updateService, deleteService } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [success, setSuccess] = useState('')

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Service name is required'
    if (!form.price || isNaN(form.price) || +form.price < 0) e.price = 'Enter a valid price'
    return e
  }

  const openAdd = () => { setForm(EMPTY); setEditing(null); setErrors({}); setModalOpen(true) }
  const openEdit = (svc) => { setForm({ ...svc }); setEditing(svc); setErrors({}); setModalOpen(true) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = { ...form, price: parseFloat(form.price) }
    if (editing) { updateService(editing.id, payload); setSuccess('Service updated.') }
    else { addService(payload); setSuccess('Service added.') }
    setModalOpen(false)
  }

  return (
    <div>
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}
      <div className="flex items-center justify-between mb-4 mt-2">
        <p className="text-sm text-gray-500">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        <Button onClick={openAdd} size="sm">+ Add Service</Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🛎️</div>
          <p className="font-semibold text-gray-600">No services yet</p>
          <p className="text-sm mt-1">Add services guests can book.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Service Name', 'Category', 'Price', 'Description', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((svc, i) => (
                <tr key={svc.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{svc.name}</td>
                  <td className="px-4 py-3 text-gray-700">{svc.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatINR(svc.price)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{svc.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(svc)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(svc)} className="!text-red-500 hover:!bg-red-50">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'Add Service'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Service Name" value={form.name} onChange={set('name')} required error={errors.name} placeholder="Spa Treatment" />
            <FormSelect label="Category" value={form.category} onChange={set('category')} options={CATEGORIES} required />
          </div>
          <FormInput label="Price (₹)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required error={errors.price} placeholder="500" />
          <FormInput label="Description" value={form.description} onChange={set('description')} placeholder="Brief description of the service…" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Add Service'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteService(deleteTarget.id); setDeleteTarget(null); setSuccess('Service deleted.') }}
        title="Delete Service"
        message={`Remove "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  )
}

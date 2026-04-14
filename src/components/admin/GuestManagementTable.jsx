import React, { useState } from 'react'
import { useData } from '../../context/DataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmationModal from '../shared/ConfirmationModal'
import FormInput from '../shared/FormInput'
import FormSelect from '../shared/FormSelect'
import SuccessAlert from '../shared/SuccessAlert'
import { statusBadge } from '../shared/Badge'

const ID_TYPES = ['Aadhaar', 'Passport', 'Driving License', 'Voter ID', 'PAN Card'].map((v) => ({ value: v, label: v }))
const EMPTY = { name: '', email: '', phone: '', idType: 'Aadhaar', idNumber: '', address: '', status: 'active' }

export default function GuestManagementTable() {
  const { guests, addGuest, updateGuest, deleteGuest } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [success, setSuccess] = useState('')

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.idNumber.trim()) e.idNumber = 'ID number is required'
    return e
  }

  const openAdd = () => { setForm(EMPTY); setEditing(null); setErrors({}); setModalOpen(true) }
  const openEdit = (g) => { setForm({ ...g }); setEditing(g); setErrors({}); setModalOpen(true) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (editing) { updateGuest(editing.id, form); setSuccess('Guest record updated.') }
    else { addGuest(form); setSuccess('Guest added successfully.') }
    setModalOpen(false)
  }

  return (
    <div>
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}
      <div className="flex items-center justify-between mb-4 mt-2">
        <p className="text-sm text-gray-500">{guests.length} guest{guests.length !== 1 ? 's' : ''} registered</p>
        <Button onClick={openAdd} size="sm">+ Add Guest</Button>
      </div>

      {guests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="font-semibold text-gray-600">No guests registered</p>
          <p className="text-sm mt-1">Add guest records manually for check-in management.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Phone', 'ID Type', 'ID Number', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guests.map((g, i) => (
                <tr key={g.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{g.name}</td>
                  <td className="px-4 py-3 text-gray-700">{g.email}</td>
                  <td className="px-4 py-3 text-gray-700">{g.phone}</td>
                  <td className="px-4 py-3 text-gray-700">{g.idType}</td>
                  <td className="px-4 py-3 text-gray-500">{g.idNumber}</td>
                  <td className="px-4 py-3">{statusBadge(g.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(g)} className="!text-red-500 hover:!bg-red-50">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Guest' : 'Add Guest'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Full Name" value={form.name} onChange={set('name')} required error={errors.name} placeholder="Rajan Sharma" />
            <FormInput label="Email" type="email" value={form.email} onChange={set('email')} required error={errors.email} placeholder="rajan@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Phone" type="tel" value={form.phone} onChange={set('phone')} required error={errors.phone} placeholder="9876543210" />
            <FormSelect label="ID Type" value={form.idType} onChange={set('idType')} options={ID_TYPES} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="ID Number" value={form.idNumber} onChange={set('idNumber')} required error={errors.idNumber} placeholder="Document number" />
            <FormSelect label="Status" value={form.status} onChange={set('status')} options={[{ value: 'active', label: 'Active' }, { value: 'checked-out', label: 'Checked Out' }]} />
          </div>
          <FormInput label="Address" value={form.address} onChange={set('address')} placeholder="Full address (optional)" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update Guest' : 'Add Guest'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteGuest(deleteTarget.id); setDeleteTarget(null); setSuccess('Guest record deleted.') }}
        title="Delete Guest"
        message={`Remove ${deleteTarget?.name}'s record? This cannot be undone.`}
      />
    </div>
  )
}

import React, { useState } from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import { useData } from '../context/DataContext'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import FormInput from '../components/shared/FormInput'
import FormSelect from '../components/shared/FormSelect'
import EmptyState from '../components/shared/EmptyState'
import SuccessAlert from '../components/shared/SuccessAlert'
import Badge from '../components/shared/Badge'

const empty = { number: '', type: 'Standard', price_per_night: '', capacity: '2', status: 'available', description: '', amenities: '' }
const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential Suite']
const statusColors = { available: 'green', occupied: 'red', maintenance: 'yellow' }

export default function AdminRooms() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useData()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [filterType, setFilterType] = useState('')

  const filtered = rooms.filter(r => !filterType || r.type === filterType)

  const validate = () => {
    const e = {}
    if (!form.number.trim()) e.number = 'Room number is required'
    if (!form.price_per_night || isNaN(Number(form.price_per_night)) || Number(form.price_per_night) <= 0) e.price_per_night = 'Enter a valid price'
    return e
  }

  const openAdd = () => { setForm(empty); setErrors({}); setModal('add') }
  const openEdit = (r) => { setForm({ number: r.number, type: r.type, price_per_night: String(r.price_per_night), capacity: String(r.capacity), status: r.status, description: r.description || '', amenities: r.amenities || '' }); setEditing(r); setErrors({}); setModal('edit') }
  const closeModal = () => { setModal(null); setEditing(null) }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const data = { ...form, price_per_night: Math.round(Number(form.price_per_night) * 100), capacity: Number(form.capacity) }
    if (modal === 'add') { addRoom(data); setSuccess('Room added successfully') }
    else { updateRoom(editing.id, data); setSuccess('Room updated') }
    closeModal()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDelete = (r) => {
    deleteRoom(r.id); setSuccess('Room removed')
    setTimeout(() => setSuccess(''), 3000)
  }

  const set = (f) => (e) => { setForm(x => ({ ...x, [f]: e.target.value })); setErrors(x => ({ ...x, [f]: '' })) }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">{rooms.length} total · {rooms.filter(r=>r.status==='available').length} available</p>
        </div>
        <Button onClick={openAdd}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Room
        </Button>
      </div>
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} className="mb-4" />}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option>
            {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No rooms found" description="Add your first room to start accepting bookings" action={<Button onClick={openAdd} size="sm">Add Room</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Room No.', 'Type', 'Price/Night', 'Capacity', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-900">#{r.number}</td>
                    <td className="px-6 py-4 text-gray-600">{r.type}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{((r.price_per_night||0)/100).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-gray-600">{r.capacity} guests</td>
                    <td className="px-6 py-4"><Badge color={statusColors[r.status] || 'gray'}>{r.status}</Badge></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                        <button onClick={() => handleDelete(r)} className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal === 'add' || modal === 'edit'} onClose={closeModal} title={modal === 'add' ? 'Add Room' : 'Edit Room'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Room Number" required value={form.number} onChange={set('number')} error={errors.number} placeholder="101" />
            <FormSelect label="Room Type" value={form.type} onChange={set('type')} options={roomTypes.map(t=>({value:t,label:t}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Price per Night (₹)" required type="number" min="0" value={form.price_per_night} onChange={set('price_per_night')} error={errors.price_per_night} placeholder="2500" />
            <FormInput label="Capacity" type="number" min="1" value={form.capacity} onChange={set('capacity')} placeholder="2" />
          </div>
          <FormSelect label="Status" value={form.status} onChange={set('status')} options={['available','occupied','maintenance'].map(s=>({value:s,label:s.charAt(0).toUpperCase()+s.slice(1)}))} />
          <FormInput label="Description" value={form.description} onChange={set('description')} placeholder="Brief description of the room" />
          <FormInput label="Amenities" value={form.amenities} onChange={set('amenities')} placeholder="WiFi, AC, TV, Mini Bar..." />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1">{modal === 'add' ? 'Add Room' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}

import React, { useState } from 'react'
import { useData } from '../../context/DataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmationModal from '../shared/ConfirmationModal'
import FormInput from '../shared/FormInput'
import FormSelect from '../shared/FormSelect'
import Badge, { statusBadge } from '../shared/Badge'
import SuccessAlert from '../shared/SuccessAlert'
import { formatINR } from '../../lib/finance'

const ROOM_TYPES = ['Single', 'Double', 'Suite', 'Deluxe', 'Family'].map((v) => ({ value: v, label: v }))
const STATUSES = ['available', 'occupied', 'maintenance'].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))
const EMPTY = { roomNumber: '', type: 'Single', pricePerNight: '', capacity: '', amenities: '', status: 'available' }

export default function RoomManagementTable() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [success, setSuccess] = useState('')

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.roomNumber.trim()) e.roomNumber = 'Room number is required'
    if (!form.pricePerNight || isNaN(form.pricePerNight) || +form.pricePerNight <= 0) e.pricePerNight = 'Enter a valid price'
    if (!form.capacity || isNaN(form.capacity) || +form.capacity <= 0) e.capacity = 'Enter a valid capacity'
    if (rooms.some((r) => r.roomNumber === form.roomNumber && r.id !== editing?.id)) e.roomNumber = 'Room number already exists'
    return e
  }

  const openAdd = () => { setForm(EMPTY); setEditing(null); setErrors({}); setModalOpen(true) }
  const openEdit = (room) => { setForm({ ...room }); setEditing(room); setErrors({}); setModalOpen(true) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = { ...form, pricePerNight: parseFloat(form.pricePerNight), capacity: parseInt(form.capacity, 10) }
    if (editing) { updateRoom(editing.id, payload); setSuccess('Room updated successfully.') }
    else { addRoom(payload); setSuccess('Room added successfully.') }
    setModalOpen(false)
  }

  return (
    <div>
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}
      <div className="flex items-center justify-between mb-4 mt-2">
        <p className="text-sm text-gray-500">{rooms.length} room{rooms.length !== 1 ? 's' : ''} registered</p>
        <Button onClick={openAdd} size="sm">+ Add Room</Button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🛏️</div>
          <p className="font-semibold text-gray-600">No rooms yet</p>
          <p className="text-sm mt-1">Add your first room to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Room No.', 'Type', 'Capacity', 'Price / Night', 'Amenities', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((room, i) => (
                <tr key={room.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-bold text-gray-900">{room.roomNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{room.type}</td>
                  <td className="px-4 py-3 text-gray-700">{room.capacity}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatINR(room.pricePerNight)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{room.amenities || '—'}</td>
                  <td className="px-4 py-3">{statusBadge(room.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(room)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(room)} className="!text-red-500 hover:!bg-red-50">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Room Number" value={form.roomNumber} onChange={set('roomNumber')} required error={errors.roomNumber} placeholder="101" />
            <FormSelect label="Type" value={form.type} onChange={set('type')} options={ROOM_TYPES} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Price / Night (₹)" type="number" min="1" step="0.01" value={form.pricePerNight} onChange={set('pricePerNight')} required error={errors.pricePerNight} placeholder="2500" />
            <FormInput label="Capacity (persons)" type="number" min="1" max="20" value={form.capacity} onChange={set('capacity')} required error={errors.capacity} placeholder="2" />
          </div>
          <FormInput label="Amenities" value={form.amenities} onChange={set('amenities')} placeholder="AC, Wi-Fi, TV, Mini-bar…" />
          <FormSelect label="Status" value={form.status} onChange={set('status')} options={STATUSES} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update Room' : 'Add Room'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteRoom(deleteTarget.id); setDeleteTarget(null); setSuccess('Room deleted.') }}
        title="Delete Room"
        message={`Remove room ${deleteTarget?.roomNumber}? This action cannot be undone.`}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { callFunction, parseApiError } from '../../lib/api'
import { formatINR } from '../../lib/finance'
import Modal from '../../components/shared/Modal'
import Button from '../../components/shared/Button'
import FormInput from '../../components/shared/FormInput'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ErrorAlert from '../../components/shared/ErrorAlert'

const ROOM_TYPES = ['standard', 'deluxe', 'suite', 'penthouse', 'family']
const STATUS_OPTIONS = ['available', 'occupied', 'maintenance']
const STATUS_COLORS = { available: 'bg-green-100 text-green-700', occupied: 'bg-red-100 text-red-700', maintenance: 'bg-amber-100 text-amber-700' }

const emptyForm = { room_number: '', room_type: 'standard', price_per_night: '', capacity: '1', description: '', amenities: '', status: 'available' }

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  async function loadRooms() {
    try {
      const res = await callFunction('admin-rooms', { action: 'list' })
      setRooms(res.rooms || [])
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadRooms() }, [])

  function openAdd() { setEditItem(null); setForm(emptyForm); setModalOpen(true); setError('') }
  function openEdit(room) {
    setEditItem(room)
    setForm({
      room_number: room.room_number,
      room_type: room.room_type,
      price_per_night: String(room.price_per_night / 100), // paise → rupees
      capacity: String(room.capacity),
      description: room.description || '',
      amenities: room.amenities || '',
      status: room.status,
    })
    setModalOpen(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.room_number.trim()) { setError('Room number is required'); return }
    if (!form.price_per_night || isNaN(Number(form.price_per_night))) { setError('Valid price required'); return }

    setSubmitting(true); setError('')
    try {
      const payload = {
        action: editItem ? 'update' : 'create',
        id: editItem?.id,
        room_number: form.room_number.trim(),
        room_type: form.room_type,
        price_per_night: Math.round(Number(form.price_per_night) * 100), // rupees → paise
        capacity: Number(form.capacity) || 1,
        description: form.description,
        amenities: form.amenities,
        status: form.status,
      }
      await callFunction('admin-rooms', payload)
      setSuccess(editItem ? 'Room updated.' : 'Room added.')
      setModalOpen(false)
      loadRooms()
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id) {
    try {
      await callFunction('admin-rooms', { action: 'delete', id })
      setSuccess('Room deleted.')
      setDeleteId(null)
      loadRooms()
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rooms</h2>
          <p className="text-sm text-gray-500 mt-1">Manage hotel rooms and pricing.</p>
        </div>
        <Button onClick={openAdd}>+ Add Room</Button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-4xl mb-2">🛏️</p>
          <p className="text-gray-600 font-medium">No rooms yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first room to get started.</p>
          <Button className="mt-4" onClick={openAdd}>+ Add Room</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Room #', 'Type', 'Price / Night', 'Capacity', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.map(room => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-900">{room.room_number}</td>
                    <td className="px-5 py-3 capitalize text-gray-700">{room.room_type}</td>
                    <td className="px-5 py-3 text-gray-900">{formatINR(room.price_per_night / 100)}</td>
                    <td className="px-5 py-3 text-gray-700">{room.capacity} pax</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[room.status]}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(room)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                        <button onClick={() => setDeleteId(room.id)} className="text-red-600 hover:underline text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Room' : 'Add New Room'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} onClose={() => setError('')} />}
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Room Number" required placeholder="101" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Type</label>
              <select value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROOM_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Price per Night (₹)" required type="number" min="0" placeholder="2000" value={form.price_per_night} onChange={e => setForm(f => ({ ...f, price_per_night: e.target.value }))} />
            <FormInput label="Capacity (persons)" type="number" min="1" placeholder="2" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
          </div>
          <FormInput label="Description" placeholder="Brief room description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <FormInput label="Amenities" placeholder="e.g. WiFi, AC, TV" value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} />
          {editItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">{editItem ? 'Save Changes' : 'Add Room'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Room" size="sm">
        <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this room? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteId)} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

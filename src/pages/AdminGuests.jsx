import React, { useState } from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import { useData } from '../context/DataContext'
import Button from '../components/shared/Button'
import Modal from '../components/shared/Modal'
import FormInput from '../components/shared/FormInput'
import FormSelect from '../components/shared/FormSelect'
import EmptyState from '../components/shared/EmptyState'
import ErrorAlert from '../components/shared/ErrorAlert'
import SuccessAlert from '../components/shared/SuccessAlert'
import Badge from '../components/shared/Badge'

const empty = { name: '', email: '', phone: '', address: '', id_type: '', id_number: '' }

export default function AdminGuests() {
  const { guests, addGuest, updateGuest, deleteGuest } = useData()
  const [modal, setModal] = useState(null) // null | 'add' | 'edit' | 'delete'
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const filtered = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.email.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search)
  )

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    return e
  }

  const openAdd = () => { setForm(empty); setErrors({}); setModal('add') }
  const openEdit = (g) => { setForm({ name: g.name, email: g.email, phone: g.phone || '', address: g.address || '', id_type: g.id_type || '', id_number: g.id_number || '' }); setEditing(g); setErrors({}); setModal('edit') }
  const openDelete = (g) => { setEditing(g); setModal('delete') }
  const closeModal = () => { setModal(null); setEditing(null) }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (modal === 'add') {
      addGuest(form)
      setSuccess('Guest added successfully')
    } else {
      updateGuest(editing.id, form)
      setSuccess('Guest updated successfully')
    }
    closeModal()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDelete = () => {
    deleteGuest(editing.id)
    setSuccess('Guest removed')
    closeModal()
    setTimeout(() => setSuccess(''), 3000)
  }

  const set = (f) => (e) => { setForm(x => ({ ...x, [f]: e.target.value })); setErrors(x => ({ ...x, [f]: '' })) }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
          <p className="text-gray-500 text-sm mt-1">{guests.length} total guests</p>
        </div>
        <Button onClick={openAdd}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Guest
        </Button>
      </div>

      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} className="mb-4" />}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <input
            type="search"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No guests found" description={search ? 'Try a different search term' : 'Add your first guest to get started'} action={!search && <Button onClick={openAdd} size="sm">Add Guest</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Email', 'Phone', 'ID Type', 'Registered', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {g.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{g.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{g.email}</td>
                    <td className="px-6 py-4 text-gray-600">{g.phone || '—'}</td>
                    <td className="px-6 py-4">{g.id_type ? <Badge color="blue">{g.id_type}</Badge> : '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(g.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(g)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                        <button onClick={() => openDelete(g)} className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal === 'add' || modal === 'edit'} onClose={closeModal} title={modal === 'add' ? 'Add Guest' : 'Edit Guest'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Full Name" required value={form.name} onChange={set('name')} error={errors.name} placeholder="John Smith" />
            <FormInput label="Phone" required value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+91 98765 43210" />
          </div>
          <FormInput label="Email" required type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="guest@example.com" />
          <FormInput label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="ID Type" value={form.id_type} onChange={set('id_type')} options={[{value:'Passport',label:'Passport'},{value:'Aadhaar',label:'Aadhaar'},{value:'PAN',label:'PAN'},{value:'Driving License',label:'Driving License'}]} />
            <FormInput label="ID Number" value={form.id_number} onChange={set('id_number')} placeholder="ID number" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1">{modal === 'add' ? 'Add Guest' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === 'delete'} onClose={closeModal} title="Delete Guest" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to remove <strong>{editing?.name}</strong>? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </AdminLayout>
  )
}

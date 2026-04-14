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

const empty = { name: '', description: '', price: '', category: 'Wellness' }
const categories = ['Wellness', 'Transport', 'Housekeeping', 'Entertainment', 'Business', 'Other']

export default function AdminServices() {
  const { services, addService, updateService, deleteService } = useData()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = 'Enter a valid price'
    return e
  }

  const openAdd = () => { setForm(empty); setErrors({}); setModal('add') }
  const openEdit = (s) => { setForm({ name: s.name, description: s.description || '', price: String(s.price / 100), category: s.category }); setEditing(s); setErrors({}); setModal('edit') }
  const closeModal = () => { setModal(null); setEditing(null) }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const data = { ...form, price: Math.round(Number(form.price) * 100) }
    if (modal === 'add') { addService(data); setSuccess('Service added') }
    else { updateService(editing.id, data); setSuccess('Service updated') }
    closeModal()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDelete = (s) => { deleteService(s.id); setSuccess('Service removed'); setTimeout(() => setSuccess(''), 3000) }
  const set = (f) => (e) => { setForm(x => ({ ...x, [f]: e.target.value })); setErrors(x => ({ ...x, [f]: '' })) }

  const catColors = { Wellness: 'purple', Transport: 'blue', Housekeeping: 'green', Entertainment: 'yellow', Business: 'gray', Other: 'gray' }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500 text-sm mt-1">{services.length} services available</p>
        </div>
        <Button onClick={openAdd}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Service
        </Button>
      </div>
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} className="mb-4" />}

      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState title="No services yet" description="Add services like spa, laundry, airport transfer, etc." action={<Button onClick={openAdd} size="sm">Add Service</Button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <Badge color={catColors[s.category] || 'gray'} className="mt-1">{s.category}</Badge>
                </div>
                <span className="font-bold text-gray-900">₹{(s.price/100).toLocaleString('en-IN')}</span>
              </div>
              {s.description && <p className="text-sm text-gray-500 mb-4">{s.description}</p>}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(s)} className="flex-1 text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1 rounded hover:bg-blue-50">Edit</button>
                <button onClick={() => handleDelete(s)} className="flex-1 text-center text-sm text-red-600 hover:text-red-800 font-medium py-1 rounded hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal === 'add' || modal === 'edit'} onClose={closeModal} title={modal === 'add' ? 'Add Service' : 'Edit Service'}>
        <div className="space-y-4">
          <FormInput label="Service Name" required value={form.name} onChange={set('name')} error={errors.name} placeholder="Spa Treatment" />
          <FormInput label="Description" value={form.description} onChange={set('description')} placeholder="Brief description" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Price (₹)" required type="number" min="0" value={form.price} onChange={set('price')} error={errors.price} placeholder="500" />
            <FormSelect label="Category" value={form.category} onChange={set('category')} options={categories.map(c=>({value:c,label:c}))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1">{modal === 'add' ? 'Add Service' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}

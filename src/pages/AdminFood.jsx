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

const empty = { name: '', description: '', price: '', category: 'Main Course', is_available: true }
const categories = ['Breakfast', 'Main Course', 'Starters', 'Desserts', 'Beverages', 'Special']

export default function AdminFood() {
  const { foodItems, addFoodItem, updateFoodItem, deleteFoodItem } = useData()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const filtered = foodItems.filter(f => !filterCat || f.category === filterCat)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = 'Enter a valid price'
    return e
  }

  const openAdd = () => { setForm(empty); setErrors({}); setModal('add') }
  const openEdit = (f) => { setForm({ name: f.name, description: f.description || '', price: String(f.price / 100), category: f.category, is_available: f.is_available !== false }); setEditing(f); setErrors({}); setModal('edit') }
  const closeModal = () => { setModal(null); setEditing(null) }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const data = { ...form, price: Math.round(Number(form.price) * 100), is_available: form.is_available }
    if (modal === 'add') { addFoodItem(data); setSuccess('Food item added') }
    else { updateFoodItem(editing.id, data); setSuccess('Food item updated') }
    closeModal()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDelete = (f) => { deleteFoodItem(f.id); setSuccess('Item removed'); setTimeout(() => setSuccess(''), 3000) }
  const set = (field) => (e) => { setForm(x => ({ ...x, [field]: e.target.value })); setErrors(x => ({ ...x, [field]: '' })) }

  const catColors = { Breakfast: 'yellow', 'Main Course': 'green', Starters: 'blue', Desserts: 'purple', Beverages: 'blue', Special: 'red' }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Food & Dining</h1>
          <p className="text-gray-500 text-sm mt-1">{foodItems.length} items · {foodItems.filter(f=>f.is_available!==false).length} available</p>
        </div>
        <Button onClick={openAdd}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Item
        </Button>
      </div>
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} className="mb-4" />}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex gap-3">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No food items found" description="Add items to your hotel dining menu" action={<Button onClick={openAdd} size="sm">Add Item</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Item', 'Category', 'Price', 'Available', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{f.name}</p>
                      {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                    </td>
                    <td className="px-6 py-4"><Badge color={catColors[f.category] || 'gray'}>{f.category}</Badge></td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{(f.price/100).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => updateFoodItem(f.id, { is_available: !f.is_available })} className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${f.is_available !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${f.is_available !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(f)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                        <button onClick={() => handleDelete(f)} className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal === 'add' || modal === 'edit'} onClose={closeModal} title={modal === 'add' ? 'Add Food Item' : 'Edit Food Item'}>
        <div className="space-y-4">
          <FormInput label="Item Name" required value={form.name} onChange={set('name')} error={errors.name} placeholder="Masala Dosa" />
          <FormInput label="Description" value={form.description} onChange={set('description')} placeholder="Short description" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Price (₹)" required type="number" min="0" value={form.price} onChange={set('price')} error={errors.price} placeholder="150" />
            <FormSelect label="Category" value={form.category} onChange={set('category')} options={categories.map(c=>({value:c,label:c}))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_available} onChange={e => setForm(x => ({ ...x, is_available: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm font-medium text-gray-700">Available for ordering</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1">{modal === 'add' ? 'Add Item' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}

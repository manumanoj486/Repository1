import React, { useState } from 'react'
import { useData } from '../../context/DataContext'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import ConfirmationModal from '../shared/ConfirmationModal'
import FormInput from '../shared/FormInput'
import FormSelect from '../shared/FormSelect'
import SuccessAlert from '../shared/SuccessAlert'
import { formatINR } from '../../lib/finance'

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts', 'Other'].map((v) => ({ value: v, label: v }))
const EMPTY = { name: '', category: 'Breakfast', price: '', description: '', isVeg: true }

export default function FoodManagementTable() {
  const { foodItems, addFoodItem, updateFoodItem, deleteFoodItem } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [success, setSuccess] = useState('')

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Item name is required'
    if (!form.price || isNaN(form.price) || +form.price < 0) e.price = 'Enter a valid price'
    return e
  }

  const openAdd = () => { setForm(EMPTY); setEditing(null); setErrors({}); setModalOpen(true) }
  const openEdit = (item) => { setForm({ ...item }); setEditing(item); setErrors({}); setModalOpen(true) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const payload = { ...form, price: parseFloat(form.price) }
    if (editing) { updateFoodItem(editing.id, payload); setSuccess('Food item updated.') }
    else { addFoodItem(payload); setSuccess('Food item added.') }
    setModalOpen(false)
  }

  return (
    <div>
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}
      <div className="flex items-center justify-between mb-4 mt-2">
        <p className="text-sm text-gray-500">{foodItems.length} item{foodItems.length !== 1 ? 's' : ''} on menu</p>
        <Button onClick={openAdd} size="sm">+ Add Item</Button>
      </div>

      {foodItems.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="font-semibold text-gray-600">No food items yet</p>
          <p className="text-sm mt-1">Add items to the menu for guests to order.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Item Name', 'Category', 'Price', 'Type', 'Description', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {foodItems.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-700">{item.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatINR(item.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5
                      ${item.isVeg !== false ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                      {item.isVeg !== false ? 'Veg' : 'Non-Veg'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{item.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)} className="!text-red-500 hover:!bg-red-50">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Food Item' : 'Add Food Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Item Name" value={form.name} onChange={set('name')} required error={errors.name} placeholder="Masala Dosa" />
            <FormSelect label="Category" value={form.category} onChange={set('category')} options={CATEGORIES} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Price (₹)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required error={errors.price} placeholder="150" />
            <FormSelect
              label="Type"
              value={form.isVeg === false ? 'non-veg' : 'veg'}
              onChange={(e) => setForm((p) => ({ ...p, isVeg: e.target.value !== 'non-veg' }))}
              options={[{ value: 'veg', label: '🟢 Vegetarian' }, { value: 'non-veg', label: '🔴 Non-Vegetarian' }]}
            />
          </div>
          <FormInput label="Description" value={form.description} onChange={set('description')} placeholder="Brief description…" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Add Item'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteFoodItem(deleteTarget.id); setDeleteTarget(null); setSuccess('Food item deleted.') }}
        title="Delete Food Item"
        message={`Remove "${deleteTarget?.name}" from the menu?`}
      />
    </div>
  )
}

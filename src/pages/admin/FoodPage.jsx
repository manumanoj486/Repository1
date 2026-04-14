import { useEffect, useState } from 'react'
import { callFunction, parseApiError } from '../../lib/api'
import { formatINR } from '../../lib/finance'
import Modal from '../../components/shared/Modal'
import Button from '../../components/shared/Button'
import FormInput from '../../components/shared/FormInput'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ErrorAlert from '../../components/shared/ErrorAlert'

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts', 'general']
const emptyForm = { name: '', description: '', price: '', category: 'general', is_available: true }

export default function FoodPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [filterCat, setFilterCat] = useState('all')

  async function loadItems() {
    try {
      const res = await callFunction('admin-food', { action: 'list' })
      setItems(res.food_items || [])
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadItems() }, [])

  function openAdd() { setEditItem(null); setForm(emptyForm); setModalOpen(true); setError('') }
  function openEdit(item) {
    setEditItem(item)
    setForm({ name: item.name, description: item.description || '', price: String(item.price / 100), category: item.category || 'general', is_available: item.is_available })
    setModalOpen(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Item name is required'); return }
    if (!form.price || isNaN(Number(form.price))) { setError('Valid price is required'); return }

    setSubmitting(true); setError('')
    try {
      await callFunction('admin-food', {
        action: editItem ? 'update' : 'create',
        id: editItem?.id,
        name: form.name.trim(),
        description: form.description,
        price: Math.round(Number(form.price) * 100),
        category: form.category,
        is_available: form.is_available,
      })
      setSuccess(editItem ? 'Item updated.' : 'Item added to menu.')
      setModalOpen(false)
      loadItems()
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id) {
    try {
      await callFunction('admin-food', { action: 'delete', id })
      setSuccess('Food item deleted.')
      setDeleteId(null)
      loadItems()
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    }
  }

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat)
  const existingCats = [...new Set(items.map(i => i.category))].filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Food Menu</h2>
          <p className="text-sm text-gray-500 mt-1">Manage dining options available to guests.</p>
        </div>
        <Button onClick={openAdd}>+ Add Item</Button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{success}</div>}

      {/* Category filter */}
      {existingCats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {['all', ...existingCats].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filterCat === cat ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {cat === 'all' ? 'All Items' : cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-gray-600 font-medium">No food items yet</p>
          <Button className="mt-4" onClick={openAdd}>+ Add Item</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Item', 'Category', 'Price', 'Available', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-600">{item.category}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{formatINR(item.price / 100)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                        <button onClick={() => setDeleteId(item.id)} className="text-red-600 hover:underline text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Food Item' : 'Add Food Item'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} onClose={() => setError('')} />}
          <FormInput label="Item Name" required placeholder="e.g. Masala Dosa" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <FormInput label="Description" placeholder="Brief description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Price (₹)" required type="number" min="0" placeholder="150" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} className="w-4 h-4 rounded text-blue-600" />
            <span className="text-sm text-gray-700">Available (visible to guests)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">{editItem ? 'Save Changes' : 'Add Item'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Food Item" size="sm">
        <p className="text-sm text-gray-600 mb-5">Are you sure you want to remove this item from the menu?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteId)} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

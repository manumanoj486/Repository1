import { useEffect, useState } from 'react'
import { callFunction, parseApiError } from '../../lib/api'
import Modal from '../../components/shared/Modal'
import Button from '../../components/shared/Button'
import FormInput from '../../components/shared/FormInput'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import ErrorAlert from '../../components/shared/ErrorAlert'

const emptyForm = { full_name: '', email: '', phone: '', password: '', confirmPassword: '' }

export default function GuestsPage() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  async function loadGuests() {
    try {
      const res = await callFunction('admin-guests', { action: 'list' })
      setGuests(res.guests || [])
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadGuests() }, [])

  function openAdd() { setEditItem(null); setForm(emptyForm); setModalOpen(true); setError('') }
  function openEdit(g) {
    setEditItem(g)
    setForm({ full_name: g.full_name || '', email: g.email || '', phone: g.phone || '', password: '', confirmPassword: '' })
    setModalOpen(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    if (!editItem && !form.email.trim()) { setError('Email is required'); return }
    if (!editItem && form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!editItem && form.password !== form.confirmPassword) { setError('Passwords do not match'); return }

    setSubmitting(true); setError('')
    try {
      if (editItem) {
        await callFunction('admin-guests', { action: 'update', id: editItem.id, full_name: form.full_name.trim(), phone: form.phone })
        setSuccess('Guest updated.')
      } else {
        await callFunction('admin-guests', { action: 'create', email: form.email.trim(), password: form.password, full_name: form.full_name.trim(), phone: form.phone })
        setSuccess('Guest account created.')
      }
      setModalOpen(false)
      loadGuests()
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id) {
    try {
      await callFunction('admin-guests', { action: 'delete', id })
      setSuccess('Guest deleted.')
      setDeleteId(null)
      loadGuests()
    } catch (err) {
      const m = parseApiError(err); if (m) setError(m)
    }
  }

  const filtered = guests.filter(g =>
    !search || (g.full_name || '').toLowerCase().includes(search.toLowerCase()) || (g.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Guests</h2>
          <p className="text-sm text-gray-500 mt-1">Manage registered guest accounts.</p>
        </div>
        <Button onClick={openAdd}>+ Add Guest</Button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{success}</div>}

      <div>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-4xl mb-2">👥</p>
          <p className="text-gray-600 font-medium">{search ? 'No guests match your search' : 'No guests yet'}</p>
          {!search && <Button className="mt-4" onClick={openAdd}>+ Add Guest</Button>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Phone', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{g.full_name || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{g.email}</td>
                    <td className="px-5 py-3 text-gray-600">{g.phone || '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(g.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(g)} className="text-blue-600 hover:underline text-xs font-medium">Edit</button>
                        <button onClick={() => setDeleteId(g.id)} className="text-red-600 hover:underline text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Guest' : 'Add New Guest'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} onClose={() => setError('')} />}
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Full Name" required placeholder="John Smith" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <FormInput label="Phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          {!editItem && (
            <>
              <FormInput label="Email" type="email" required placeholder="guest@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Password" type="password" required placeholder="Min 6 chars" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <FormInput label="Confirm Password" type="password" required placeholder="Repeat" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">{editItem ? 'Save Changes' : 'Add Guest'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Guest" size="sm">
        <p className="text-sm text-gray-600 mb-5">Are you sure? This will permanently delete the guest account and all associated data.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteId)} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

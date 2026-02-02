import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Rocket, 
  Users, 
  Key, 
  FolderOpen, 
  History, 
  Settings,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown,
  Zap,
  Building2,
  Target,
  TrendingUp,
  AlertCircle,
  X,
  Search
} from 'lucide-react'
import clsx from 'clsx'

// API helper
const api = {
  get: async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  post: async (url, data) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  delete: async (url) => {
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

// Sidebar component
function Sidebar() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/launch', icon: Rocket, label: 'Launch Campaign' },
    { to: '/accounts', icon: Users, label: 'Ad Accounts' },
    { to: '/tokens', icon: Key, label: 'Access Tokens' },
    { to: '/organizations', icon: Building2, label: 'Organizations' },
    { to: '/templates', icon: FolderOpen, label: 'Templates' },
    { to: '/history', icon: History, label: 'Launch History' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-nb-dark/80 backdrop-blur-xl border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nb-red to-nb-accent flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-wide">NEWSBREAK</h1>
            <p className="text-xs text-gray-500 -mt-1">Ad Launcher</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              isActive 
                ? 'bg-nb-red/20 text-nb-red border border-nb-red/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-500 text-center">
          v1.0.0 • NewsBreak API
        </div>
      </div>
    </aside>
  )
}

// Stats card component
function StatCard({ icon: Icon, label, value, color = 'nb-red' }) {
  return (
    <div className="card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          `bg-${color}/20`
        )}>
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
      </div>
    </div>
  )
}

// Modal component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="bg-nb-dark rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Toast notification
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={clsx(
      'fixed bottom-4 right-4 px-6 py-4 rounded-xl shadow-lg animate-slide-in flex items-center gap-3 z-50',
      type === 'success' && 'bg-emerald-600',
      type === 'error' && 'bg-red-600',
      type === 'info' && 'bg-blue-600'
    )}>
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {type === 'error' && <XCircle className="w-5 h-5" />}
      {type === 'info' && <AlertCircle className="w-5 h-5" />}
      <span>{message}</span>
    </div>
  )
}

// Dashboard page
function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-nb-red" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your NewsBreak advertising accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Ad Accounts" 
          value={stats?.total_accounts || 0}
          color="nb-red"
        />
        <StatCard 
          icon={Key} 
          label="Access Tokens" 
          value={stats?.total_tokens || 0}
          color="emerald-500"
        />
        <StatCard 
          icon={Building2} 
          label="Organizations" 
          value={stats?.total_organizations || 0}
          color="blue-500"
        />
        <StatCard 
          icon={Rocket} 
          label="Total Launches" 
          value={stats?.total_launches || 0}
          color="amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-nb-red" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <NavLink to="/launch" className="btn-primary w-full flex items-center justify-center gap-2">
              <Rocket className="w-5 h-5" />
              Launch New Campaign
            </NavLink>
            <NavLink to="/tokens" className="btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Add Access Token
            </NavLink>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Getting Started
          </h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-nb-red/20 text-nb-red flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <p>Add your NewsBreak API access token(s) in the Tokens section</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-nb-red/20 text-nb-red flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <p>Refresh accounts to pull your ad accounts from NewsBreak</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-nb-red/20 text-nb-red flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <p>Create organizations to group accounts for easy management</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-nb-red/20 text-nb-red flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <p>Launch campaigns across multiple accounts at once!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Access Tokens page
function TokensPage() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [refreshing, setRefreshing] = useState(null)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({ name: '', token: '', organization_id: '' })
  const [organizations, setOrganizations] = useState([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tokensData, orgsData] = await Promise.all([
        api.get('/api/tokens'),
        api.get('/api/organizations')
      ])
      setTokens(tokensData)
      setOrganizations(orgsData)
    } catch (err) {
      setToast({ message: 'Failed to load tokens', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/tokens', {
        ...formData,
        organization_id: formData.organization_id ? parseInt(formData.organization_id) : null
      })
      setToast({ message: 'Token added successfully', type: 'success' })
      setShowModal(false)
      setFormData({ name: '', token: '', organization_id: '' })
      loadData()
    } catch (err) {
      setToast({ message: 'Failed to add token', type: 'error' })
    }
  }

  const handleRefresh = async (tokenId) => {
    setRefreshing(tokenId)
    try {
      const result = await api.post(`/api/tokens/${tokenId}/refresh-accounts`)
      setToast({ message: result.message, type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to refresh accounts', type: 'error' })
    } finally {
      setRefreshing(null)
    }
  }

  const handleDelete = async (tokenId) => {
    if (!confirm('Delete this token?')) return
    try {
      await api.delete(`/api/tokens/${tokenId}`)
      setToast({ message: 'Token deleted', type: 'success' })
      loadData()
    } catch (err) {
      setToast({ message: 'Failed to delete token', type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Access Tokens</h1>
          <p className="text-gray-400">Manage your NewsBreak API access tokens</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Token
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-nb-red" />
        </div>
      ) : tokens.length === 0 ? (
        <div className="card text-center py-12">
          <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Access Tokens</h3>
          <p className="text-gray-400 mb-6">Add your first NewsBreak API token to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Your First Token
          </button>
        </div>
      ) : (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Last Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(token => (
                <tr key={token.id}>
                  <td className="font-medium">{token.name}</td>
                  <td>
                    {organizations.find(o => o.id === token.organization_id)?.name || (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className={clsx('badge', token.is_active ? 'badge-success' : 'badge-error')}>
                      {token.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-gray-400">
                    {token.last_used ? new Date(token.last_used).toLocaleDateString() : 'Never'}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRefresh(token.id)}
                        disabled={refreshing === token.id}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Refresh Accounts"
                      >
                        <RefreshCw className={clsx('w-4 h-4', refreshing === token.id && 'animate-spin')} />
                      </button>
                      <button 
                        onClick={() => handleDelete(token.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Access Token">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Production Token"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Access Token</label>
            <input
              type="password"
              className="input"
              placeholder="Paste your NewsBreak API token"
              value={formData.token}
              onChange={e => setFormData({ ...formData, token: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Organization (optional)</label>
            <select
              className="select"
              value={formData.organization_id}
              onChange={e => setFormData({ ...formData, organization_id: e.target.value })}
            >
              <option value="">Select organization...</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Add Token
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Organizations page
function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/organizations')
      setOrganizations(data)
    } catch (err) {
      setToast({ message: 'Failed to load organizations', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/organizations', formData)
      setToast({ message: 'Organization created', type: 'success' })
      setShowModal(false)
      setFormData({ name: '', description: '' })
      loadData()
    } catch (err) {
      setToast({ message: 'Failed to create organization', type: 'error' })
    }
  }

  const handleDelete = async (orgId) => {
    if (!confirm('Delete this organization?')) return
    try {
      await api.delete(`/api/organizations/${orgId}`)
      setToast({ message: 'Organization deleted', type: 'success' })
      loadData()
    } catch (err) {
      setToast({ message: 'Failed to delete organization', type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Organizations</h1>
          <p className="text-gray-400">Group your ad accounts for easier management</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Organization
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-nb-red" />
        </div>
      ) : organizations.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Organizations</h3>
          <p className="text-gray-400 mb-6">Create organizations to group your ad accounts</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Your First Organization
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map(org => (
            <div key={org.id} className="card group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nb-red to-nb-accent flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <button 
                  onClick={() => handleDelete(org.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-semibold mb-2">{org.name}</h3>
              <p className="text-gray-400 text-sm">{org.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Organization">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Main Client"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Brief description..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Create
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Ad Accounts page
function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/accounts')
      setAccounts(data)
    } catch (err) {
      setToast({ message: 'Failed to load accounts', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredAccounts = accounts.filter(acc => 
    acc.name?.toLowerCase().includes(filter.toLowerCase()) ||
    acc.organization_name?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ad Accounts</h1>
          <p className="text-gray-400">All connected NewsBreak ad accounts</p>
        </div>
      </div>

      {/* Search/Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          className="input pl-12"
          placeholder="Search accounts by name or organization..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-nb-red" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Ad Accounts</h3>
          <p className="text-gray-400 mb-6">Add access tokens and refresh to pull your accounts</p>
          <NavLink to="/tokens" className="btn-primary">
            Go to Tokens
          </NavLink>
        </div>
      ) : (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>NewsBreak ID</th>
                <th>Organization</th>
                <th>Token</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(acc => (
                <tr key={acc.id}>
                  <td className="font-medium">{acc.name || 'Unnamed'}</td>
                  <td className="text-gray-400 font-mono text-sm">{acc.newsbreak_account_id}</td>
                  <td>
                    {acc.organization_name ? (
                      <span className="badge badge-info">{acc.organization_name}</span>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="text-gray-400">{acc.token_name}</td>
                  <td>
                    <span className={clsx(
                      'badge',
                      acc.status === 'active' ? 'badge-success' : 'badge-warning'
                    )}>
                      {acc.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Campaign Launcher page
function LaunchPage() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState(false)
  const [toast, setToast] = useState(null)
  const [results, setResults] = useState(null)
  const [campaign, setCampaign] = useState({
    name: '',
    objective: 2, // TRAFFIC
    daily_budget: '',
    status: 1
  })

  useEffect(() => {
    api.get('/api/accounts')
      .then(setAccounts)
      .catch(err => setToast({ message: 'Failed to load accounts', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  const toggleAccount = (id) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(accounts.map(a => a.id))
    }
  }

  const handleLaunch = async () => {
    if (selectedAccounts.length === 0) {
      setToast({ message: 'Select at least one account', type: 'error' })
      return
    }
    if (!campaign.name.trim()) {
      setToast({ message: 'Enter a campaign name', type: 'error' })
      return
    }

    setLaunching(true)
    setResults(null)
    try {
      const result = await api.post('/api/bulk-launch', {
        account_ids: selectedAccounts,
        campaign: {
          ...campaign,
          daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : null
        }
      })
      setResults(result)
      setToast({ 
        message: `Launched to ${result.succeeded.length} accounts`, 
        type: result.failed.length > 0 ? 'warning' : 'success' 
      })
    } catch (err) {
      setToast({ message: 'Launch failed', type: 'error' })
    } finally {
      setLaunching(false)
    }
  }

  const objectives = [
    { value: 1, label: 'Awareness' },
    { value: 2, label: 'Traffic' },
    { value: 3, label: 'App Install' },
    { value: 4, label: 'Lead Generation' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Launch Campaign</h1>
        <p className="text-gray-400">Create campaigns across multiple ad accounts at once</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-nb-red" />
              Campaign Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Summer Sale 2025"
                  value={campaign.name}
                  onChange={e => setCampaign({ ...campaign, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Objective</label>
                <select
                  className="select"
                  value={campaign.objective}
                  onChange={e => setCampaign({ ...campaign, objective: parseInt(e.target.value) })}
                >
                  {objectives.map(obj => (
                    <option key={obj.value} value={obj.value}>{obj.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Daily Budget (optional)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g., 100.00"
                  value={campaign.daily_budget}
                  onChange={e => setCampaign({ ...campaign, daily_budget: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="status"
                  className="checkbox"
                  checked={campaign.status === 1}
                  onChange={e => setCampaign({ ...campaign, status: e.target.checked ? 1 : 2 })}
                />
                <label htmlFor="status" className="text-sm">Start campaign immediately</label>
              </div>
            </div>
          </div>

          <button
            onClick={handleLaunch}
            disabled={launching || selectedAccounts.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {launching ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Launch to {selectedAccounts.length} Account{selectedAccounts.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Account Selection */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-nb-red" />
                Select Accounts
              </h3>
              <button 
                onClick={selectAll}
                className="text-sm text-nb-red hover:text-nb-accent transition-colors"
              >
                {selectedAccounts.length === accounts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-nb-red" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No accounts available. Add tokens and refresh first.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {accounts.map(acc => (
                  <label
                    key={acc.id}
                    className={clsx(
                      'flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all',
                      selectedAccounts.includes(acc.id)
                        ? 'bg-nb-red/20 border border-nb-red/30'
                        : 'bg-white/5 border border-transparent hover:border-white/10'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedAccounts.includes(acc.id)}
                      onChange={() => toggleAccount(acc.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{acc.name || 'Unnamed Account'}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {acc.organization_name || 'No organization'} • ID: {acc.newsbreak_account_id}
                      </p>
                    </div>
                    <span className={clsx('badge', acc.status === 'active' ? 'badge-success' : 'badge-warning')}>
                      {acc.status || 'Unknown'}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="card animate-slide-in">
          <h3 className="text-lg font-semibold mb-4">Launch Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.succeeded.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Succeeded ({results.succeeded.length})
                </h4>
                <div className="space-y-2">
                  {results.succeeded.map((r, i) => (
                    <div key={i} className="text-sm p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="font-medium">{r.account_name}</span>
                      <span className="text-gray-400"> • Campaign ID: {r.campaign_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.failed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Failed ({results.failed.length})
                </h4>
                <div className="space-y-2">
                  {results.failed.map((r, i) => (
                    <div key={i} className="text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="font-medium">{r.account_name || `Account ${r.account_id}`}</span>
                      <p className="text-red-400 text-xs mt-1">{r.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Templates page
function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: 2,
    daily_budget: '',
    billing_event: 1,
    bid_amount: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.get('/api/templates')
      setTemplates(data)
    } catch (err) {
      setToast({ message: 'Failed to load templates', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/templates', {
        ...formData,
        daily_budget: formData.daily_budget ? parseFloat(formData.daily_budget) : null,
        bid_amount: formData.bid_amount ? parseFloat(formData.bid_amount) : null
      })
      setToast({ message: 'Template created', type: 'success' })
      setShowModal(false)
      setFormData({ name: '', description: '', objective: 2, daily_budget: '', billing_event: 1, bid_amount: '' })
      loadData()
    } catch (err) {
      setToast({ message: 'Failed to create template', type: 'error' })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return
    try {
      await api.delete(`/api/templates/${id}`)
      setToast({ message: 'Template deleted', type: 'success' })
      loadData()
    } catch (err) {
      setToast({ message: 'Failed to delete template', type: 'error' })
    }
  }

  const objectives = {
    1: 'Awareness',
    2: 'Traffic',
    3: 'App Install',
    4: 'Lead Generation'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaign Templates</h1>
          <p className="text-gray-400">Save and reuse campaign configurations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-nb-red" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Templates</h3>
          <p className="text-gray-400 mb-6">Create templates to quickly launch campaigns</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <div key={t.id} className="card group">
              <div className="flex items-start justify-between mb-4">
                <span className="badge badge-info">{objectives[t.objective]}</span>
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{t.description || 'No description'}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {t.daily_budget && <span>Budget: ${t.daily_budget}/day</span>}
                {t.bid_amount && <span>Bid: ${t.bid_amount}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Template">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Standard Traffic Campaign"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Template description..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Objective</label>
              <select
                className="select"
                value={formData.objective}
                onChange={e => setFormData({ ...formData, objective: parseInt(e.target.value) })}
              >
                <option value={1}>Awareness</option>
                <option value={2}>Traffic</option>
                <option value={3}>App Install</option>
                <option value={4}>Lead Generation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Billing Event</label>
              <select
                className="select"
                value={formData.billing_event}
                onChange={e => setFormData({ ...formData, billing_event: parseInt(e.target.value) })}
              >
                <option value={1}>CPC</option>
                <option value={2}>CPM</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Daily Budget</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="100.00"
                value={formData.daily_budget}
                onChange={e => setFormData({ ...formData, daily_budget: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bid Amount</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="1.50"
                value={formData.bid_amount}
                onChange={e => setFormData({ ...formData, bid_amount: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Create Template
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Launch History page
function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.get('/api/history')
      .then(setHistory)
      .catch(err => setToast({ message: 'Failed to load history', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Launch History</h1>
        <p className="text-gray-400">View past campaign launches</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-nb-red" />
        </div>
      ) : history.length === 0 ? (
        <div className="card text-center py-12">
          <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Launch History</h3>
          <p className="text-gray-400 mb-6">Your campaign launches will appear here</p>
          <NavLink to="/launch" className="btn-primary">
            Launch Your First Campaign
          </NavLink>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(h => (
            <div key={h.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{h.campaign_name}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(h.launched_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {h.accounts_succeeded.length > 0 && (
                    <span className="badge badge-success">
                      {h.accounts_succeeded.length} succeeded
                    </span>
                  )}
                  {h.accounts_failed.length > 0 && (
                    <span className="badge badge-error">
                      {h.accounts_failed.length} failed
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Targeted {h.accounts_targeted.length} account{h.accounts_targeted.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

// Main App component
export default function App() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-64 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/launch" element={<LaunchPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  )
}

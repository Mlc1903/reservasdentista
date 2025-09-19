'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, dateFns } from '@/components/ui/calendar'
import { 
  Users, 
  UserCheck, 
  Stethoscope, 
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Search,
  Menu,
  X,
  LogOut,
  User,
  Phone,
  Mail,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Auth form states
  const [isLogin, setIsLogin] = useState(true)
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' })
  
  // Data states
  const [dentists, setDentists] = useState([])
  const [patients, setPatients] = useState([])
  const [treatments, setTreatments] = useState([])
  const [appointments, setAppointments] = useState([])
  
  // Form states
  const [selectedItem, setSelectedItem] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  // Check authentication on load
  useEffect(() => {
    checkAuth()
  }, [])

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData()
    }
  }, [isAuthenticated])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user')
      const data = await response.json()
      if (data.user) {
        setCurrentUser(data.user)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCurrentUser(data.user)
        setIsAuthenticated(true)
        toast.success(isLogin ? 'Logged in successfully!' : 'Account created successfully!')
      } else {
        toast.error(data.error || 'Authentication failed')
      }
    } catch (error) {
      toast.error('Authentication error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsAuthenticated(false)
      setCurrentUser(null)
      setCurrentSection('dashboard')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const loadAllData = async () => {
    try {
      const [dentistsRes, patientsRes, treatmentsRes, appointmentsRes] = await Promise.all([
        fetch('/api/dentists'),
        fetch('/api/patients'),
        fetch('/api/treatments'),
        fetch('/api/appointments')
      ])
      
      setDentists(await dentistsRes.json())
      setPatients(await patientsRes.json())
      setTreatments(await treatmentsRes.json())
      setAppointments(await appointmentsRes.json())
    } catch (error) {
      toast.error('Failed to load data')
    }
  }

  const handleCreate = async (section, data) => {
    try {
      const response = await fetch(`/api/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        loadAllData()
        setDialogOpen(false)
        setFormData({})
        toast.success(`${section.slice(0, -1)} created successfully!`)
      }
    } catch (error) {
      toast.error('Failed to create item')
    }
  }

  const handleUpdate = async (section, id, data) => {
    try {
      const response = await fetch(`/api/${section}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        loadAllData()
        setDialogOpen(false)
        setSelectedItem(null)
        setFormData({})
        toast.success(`${section.slice(0, -1)} updated successfully!`)
      }
    } catch (error) {
      toast.error('Failed to update item')
    }
  }

  const handleDelete = async (section, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      const response = await fetch(`/api/${section}/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadAllData()
        toast.success(`${section.slice(0, -1)} deleted successfully!`)
      }
    } catch (error) {
      toast.error('Failed to delete item')
    }
  }

  // Auth form component
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to your dental clinic dashboard' : 'Join our dental clinic management system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
              
              {isLogin && (
                <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">Demo Credentials:</p>
                  <p className="text-xs text-blue-600">Email: admin@clinic.com</p>
                  <p className="text-xs text-blue-600">Password: admin123</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Stethoscope },
    { id: 'dentists', label: 'Dentists', icon: UserCheck },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'treatments', label: 'Treatments', icon: FileText },
    { id: 'appointments', label: 'Appointments', icon: CalendarIcon }
  ]

  // Dashboard component
  const DashboardContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Dentists</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{dentists.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{patients.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Treatments Available</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{treatments.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Scheduled Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{appointment.patients?.fullName}</p>
                    <p className="text-sm text-gray-600">{appointment.treatments?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{appointment.appointmentDate}</p>
                    <p className="text-sm text-gray-600">{appointment.appointmentTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Available Dentists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dentists.slice(0, 5).map((dentist) => (
                <div key={dentist.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {dentist.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{dentist.fullName}</p>
                    <p className="text-sm text-gray-600">{dentist.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Data table components
  const renderDataTable = (section) => {
    let data, columns, createForm

    switch (section) {
      case 'dentists':
        data = dentists.filter(item => 
          item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
        columns = ['Full Name', 'Specialty', 'Email', 'Phone', 'Actions']
        createForm = (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Dr. John Smith"
              />
            </div>
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                value={formData.specialty || ''}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="General Dentist"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@clinic.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0123"
              />
            </div>
          </div>
        )
        break

      case 'patients':
        data = patients.filter(item => 
          item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        columns = ['Full Name', 'Email', 'Phone', 'Actions']
        createForm = (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-1234"
              />
            </div>
          </div>
        )
        break

      case 'treatments':
        data = treatments.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        columns = ['Name', 'Cost', 'Duration', 'Description', 'Actions']
        createForm = (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Treatment Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dental Cleaning"
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                placeholder="120.00"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="60 minutes"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the treatment"
              />
            </div>
          </div>
        )
        break

      case 'appointments':
        data = appointments.filter(item => 
          item.patients?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.dentists?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        columns = ['Patient', 'Dentist', 'Treatment', 'Date', 'Time', 'Status', 'Actions']
        createForm = (
          <div className="space-y-4">
            <div>
              <Label htmlFor="patientId">Patient</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dentistId">Dentist</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, dentistId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dentist" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id}>
                      {dentist.fullName} - {dentist.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="treatmentId">Treatment</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, treatmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a treatment" />
                </SelectTrigger>
                <SelectContent>
                  {treatments.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id}>
                      {treatment.name} - ${treatment.cost}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appointmentDate">Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={formData.appointmentDate || ''}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="appointmentTime">Time</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={formData.appointmentTime || ''}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes for the appointment"
              />
            </div>
          </div>
        )
        break
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{section}</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedItem(null); setFormData({}) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add {section.slice(0, -1)}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem ? 'Edit' : 'Add'} {section.slice(0, -1)}
                </DialogTitle>
              </DialogHeader>
              {createForm}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  if (selectedItem) {
                    handleUpdate(section, selectedItem.id, formData)
                  } else {
                    handleCreate(section, formData)
                  }
                }}>
                  {selectedItem ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={`Search ${section}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    {section === 'dentists' && (
                      <>
                        <TableCell className="font-medium">{item.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.specialty}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {item.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {item.phone}
                          </div>
                        </TableCell>
                      </>
                    )}
                    {section === 'patients' && (
                      <>
                        <TableCell className="font-medium">{item.fullName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {item.email || 'Not provided'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {item.phone}
                          </div>
                        </TableCell>
                      </>
                    )}
                    {section === 'treatments' && (
                      <>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            ${item.cost.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            {item.duration}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      </>
                    )}
                    {section === 'appointments' && (
                      <>
                        <TableCell className="font-medium">{item.patients?.fullName}</TableCell>
                        <TableCell>{item.dentists?.fullName}</TableCell>
                        <TableCell>{item.treatments?.name}</TableCell>
                        <TableCell>{item.appointmentDate}</TableCell>
                        <TableCell>{item.appointmentTime}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'scheduled' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setFormData(item)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(section, item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Stethoscope className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">SmileAdmin</h2>
              <p className="text-sm text-gray-500">Dental Clinic</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentSection(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentSection === item.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 capitalize">
                  {currentSection === 'dashboard' ? 'Dashboard' : currentSection}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentSection === 'dashboard' 
                    ? 'Welcome to your dental clinic management system'
                    : `Manage your clinic's ${currentSection}`
                  }
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {currentSection === 'dashboard' && <DashboardContent />}
          {currentSection !== 'dashboard' && renderDataTable(currentSection)}
        </main>
      </div>
    </div>
  )
}
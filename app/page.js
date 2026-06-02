'use client'
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

const Tooth = ({ number, state, onFaceClick, onToothClick }) => {
  const getFaceColor = (face) => {
    const faceState = state?.[face]
    if (faceState === 'caries') return 'fill-red-500 hover:fill-red-600'
    if (faceState === 'resina') return 'fill-blue-500 hover:fill-blue-600'
    return 'fill-white hover:fill-gray-100'
  }

  const getToothStatusBorder = () => {
    if (state?.status === 'corona') return 'border-yellow-400 border-2'
    return 'border-gray-200'
  }

  return (
    <div className="flex flex-col items-center p-1 bg-white rounded border border-gray-100 shadow-sm w-[46px]">
      <span className="text-[10px] font-bold text-gray-500 mb-1">{number}</span>
      
      <div 
        className={`relative w-9 h-9 flex items-center justify-center rounded cursor-pointer border ${getToothStatusBorder()}`}
        onClick={onToothClick}
        title={`Diente ${number}`}
      >
        {state?.status === 'ausente' ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
            <span className="text-red-600 font-extrabold text-xl leading-none">X</span>
          </div>
        ) : null}

        {state?.status === 'implante' ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
            <span className="text-xs leading-none" title="Implante">🔩</span>
          </div>
        ) : null}

        <svg viewBox="0 0 100 100" className="w-8 h-8">
          <polygon
            points="0,0 100,0 80,20 20,20"
            className={`${getFaceColor('top')} stroke-gray-300 stroke-[1.5] transition-colors`}
            onClick={(e) => { e.stopPropagation(); onFaceClick('top'); }}
          />
          <polygon
            points="100,0 100,100 80,80 80,20"
            className={`${getFaceColor('right')} stroke-gray-300 stroke-[1.5] transition-colors`}
            onClick={(e) => { e.stopPropagation(); onFaceClick('right'); }}
          />
          <polygon
            points="100,100 0,100 20,80 80,80"
            className={`${getFaceColor('bottom')} stroke-gray-300 stroke-[1.5] transition-colors`}
            onClick={(e) => { e.stopPropagation(); onFaceClick('bottom'); }}
          />
          <polygon
            points="0,0 0,100 20,80 20,20"
            className={`${getFaceColor('left')} stroke-gray-300 stroke-[1.5] transition-colors`}
            onClick={(e) => { e.stopPropagation(); onFaceClick('left'); }}
          />
          <polygon
            points="20,20 80,20 80,80 20,80"
            className={`${getFaceColor('center')} stroke-gray-300 stroke-[1.5] transition-colors`}
            onClick={(e) => { e.stopPropagation(); onFaceClick('center'); }}
          />
        </svg>
      </div>
    </div>
  )
}

const translateSection = (sec) => {
  const map = {
    dashboard: 'Panel',
    dentists: 'Dentistas',
    patients: 'Pacientes',
    treatments: 'Tratamientos',
    appointments: 'Citas',
    dentist: 'Dentista',
    patient: 'Paciente',
    treatment: 'Tratamiento',
    appointment: 'Cita'
  }
  return map[sec] || sec
}

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
  const [calendarEvents, setCalendarEvents] = useState([])

  // Form states
  const [selectedItem, setSelectedItem] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Clinical Records states
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [clinicalRecords, setClinicalRecords] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [newRecordData, setNewRecordData] = useState({ diagnosis: '', treatmentNotes: '', teethNotes: '' })
  const [addingRecord, setAddingRecord] = useState(false)

  // Odontograma states
  const [selectedTool, setSelectedTool] = useState('caries')
  const [patientOdontoState, setPatientOdontoState] = useState({})
  const [isSavingOdonto, setIsSavingOdonto] = useState(false)

  // Auto-sync odontograma when selectedPatient changes
  useEffect(() => {
    if (selectedPatient) {
      const odonto = selectedPatient.odontograma
      if (odonto) {
        setPatientOdontoState(typeof odonto === 'string' ? JSON.parse(odonto) : odonto)
      } else {
        setPatientOdontoState({})
      }
    }
  }, [selectedPatient])

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
        if (data.needsConfirmation) {
          toast.info('¡Registro exitoso! Por favor revisa tu correo electrónico para confirmar tu cuenta.')
          setIsLogin(true)
        } else {
          setCurrentUser(data.user)
          setIsAuthenticated(true)
          toast.success(isLogin ? '¡Inicio de sesión exitoso!' : '¡Cuenta creada correctamente!')
        }
      } else {
        toast.error(data.error || 'Credenciales o autenticación incorrectas')
      }
    } catch (error) {
      toast.error('Error de autenticación')
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
      toast.success('Sesión cerrada correctamente')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  const loadClinicalRecords = async (patientId) => {
    try {
      const res = await fetch(`/api/clinical-records?patientId=${patientId}`)
      const data = await res.json()
      setClinicalRecords(data)
    } catch (error) {
      toast.error('Error al cargar historial clínico')
    }
  }

  const handleCreateRecord = async (e) => {
    e.preventDefault()
    if (!newRecordData.diagnosis || !newRecordData.treatmentNotes) {
      toast.error('Por favor complete los campos obligatorios')
      return
    }

    try {
      const response = await fetch('/api/clinical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          dentistId: currentUser?.role === 'dentist' ? currentUser.dentistId : (dentists[0]?.id || null),
          date: new Date().toISOString().split('T')[0],
          diagnosis: newRecordData.diagnosis,
          treatmentNotes: newRecordData.treatmentNotes,
          teethNotes: newRecordData.teethNotes
        })
      })

      if (response.ok) {
        loadClinicalRecords(selectedPatient.id)
        setNewRecordData({ diagnosis: '', treatmentNotes: '', teethNotes: '' })
        setAddingRecord(false)
        toast.success('Ficha médica agregada correctamente')
      } else {
        toast.error('Error al crear registro clínico')
      }
    } catch (error) {
      toast.error('Error de red')
    }
  }

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('¿Está seguro de eliminar este registro clínico?')) return

    try {
      const response = await fetch(`/api/clinical-records/${recordId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadClinicalRecords(selectedPatient.id)
        toast.success('Registro eliminado')
      } else {
        toast.error('Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de red')
    }
  }

  const handleFaceClick = (toothNum, face) => {
    setPatientOdontoState(prev => {
      const toothState = prev[toothNum] || {}
      
      if (selectedTool === 'limpiar') {
        const { [face]: _, ...rest } = toothState
        return {
          ...prev,
          [toothNum]: rest
        }
      }
      
      if (selectedTool === 'caries' || selectedTool === 'resina') {
        return {
          ...prev,
          [toothNum]: {
            ...toothState,
            [face]: selectedTool
          }
        }
      }
      
      return prev
    })
  }

  const handleToothClick = (toothNum) => {
    setPatientOdontoState(prev => {
      const toothState = prev[toothNum] || {}
      
      if (selectedTool === 'limpiar') {
        return {
          ...prev,
          [toothNum]: {}
        }
      }
      
      if (['corona', 'implante', 'ausente'].includes(selectedTool)) {
        return {
          ...prev,
          [toothNum]: {
            ...toothState,
            status: toothState.status === selectedTool ? null : selectedTool
          }
        }
      }
      
      return prev
    })
  }

  const handleSaveOdontograma = async () => {
    if (!selectedPatient) return

    setIsSavingOdonto(true)
    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odontograma: patientOdontoState
        })
      })

      if (response.ok) {
        // Update our local patients list state so the dashboard/table has the new patient state
        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, odontograma: patientOdontoState } : p))
        setSelectedPatient(prev => ({ ...prev, odontograma: patientOdontoState }))
        toast.success('Odontograma guardado correctamente')
      } else {
        toast.error('Error al guardar el odontograma')
      }
    } catch (error) {
      toast.error('Error de red al guardar')
    } finally {
      setIsSavingOdonto(false)
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
      
      const dentistsData = await dentistsRes.json()
      const patientsData = await patientsRes.json()
      const treatmentsData = await treatmentsRes.json()
      const appointmentsData = await appointmentsRes.json()

      setDentists(dentistsData)
      setPatients(patientsData)
      setTreatments(treatmentsData)
      setAppointments(appointmentsData)
      
      setCalendarEvents(
        appointmentsData.map((a) => ({
          id: a.id,
          title: `${a.treatments?.name || 'Treatment'} - ${a.patients?.fullName || 'Patient'}`,
          start: `${a.appointmentDate}T${a.appointmentTime}`,
          backgroundColor: "#3B82F6",
          borderColor: "#2563EB",
        }))
      )

    } catch (error) {
      console.error('Failed to load data:', error)
      // toast.error('Failed to load data')
    }
  }

  // Auto-refresh data every 30 seconds to catch WhatsApp appointments
  useEffect(() => {
    let interval;
    if (isAuthenticated) {
      interval = setInterval(() => {
        loadAllData();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
        toast.success(`¡${translateSection(section.slice(0, -1))} creado correctamente!`)
      }
    } catch (error) {
      toast.error('Error al crear el elemento')
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
        toast.success(`¡${translateSection(section.slice(0, -1))} actualizado correctamente!`)
      }
    } catch (error) {
      toast.error('Error al actualizar el elemento')
    }
  }

  const handleDelete = async (section, id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento?')) return
    
    try {
      const response = await fetch(`/api/${section}/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadAllData()
        toast.success(`¡${translateSection(section.slice(0, -1))} eliminado correctamente!`)
      }
    } catch (error) {
      toast.error('Error al eliminar el elemento')
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
              {isLogin ? 'Bienvenido de Nuevo' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Inicia sesión en el panel de control de tu clínica dental' : 'Regístrate en el sistema de gestión de clínica dental'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ingresa tu nombre completo"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "¿No tienes una cuenta? Regístrate" : '¿Ya tienes una cuenta? Inicia sesión'}
                </button>
              </div>
              
              {isLogin && (
                <div className="text-center mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">Credenciales de Demostración:</p>
                  <p className="text-xs text-blue-600">Email: admin@clinic.com</p>
                  <p className="text-xs text-blue-600">Contraseña: admin123</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Inicio', icon: Stethoscope },
    { id: 'dentists', label: 'Dentistas', icon: UserCheck },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'treatments', label: 'Tratamientos', icon: FileText },
    { id: 'appointments', label: 'Citas', icon: CalendarIcon }
  ]

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (currentUser?.role === 'receptionist' || currentUser?.role === 'dentist') {
      return item.id !== 'dentists' && item.id !== 'treatments'
    }
    return true
  })

  // Dashboard component
 const DashboardContent = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Vista General del Dashboard</h1>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Dentists */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">Dentistas</CardTitle>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <UserCheck className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{dentists.length}</div>
          <p className="text-xs text-gray-500 mt-1">Activos en la clínica</p>
        </CardContent>
      </Card>

      {/* Total Patients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">Pacientes</CardTitle>
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{patients.length}</div>
          <p className="text-xs text-gray-500 mt-1">Registrados en el sistema</p>
        </CardContent>
      </Card>

      {/* Total Treatments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">Tratamientos</CardTitle>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <FileText className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{treatments.length}</div>
          <p className="text-xs text-gray-500 mt-1">Servicios en catálogo</p>
        </CardContent>
      </Card>

      {/* Total Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">Citas Totales</CardTitle>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <CalendarIcon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
          <p className="text-xs text-gray-500 mt-1">Agendadas e integradas</p>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Citas Recientes
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

      {/* Available Dentists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Dentistas Disponibles
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

    {/* <-- Aquí agregamos el calendario --> */}
    <div className="mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            <CalendarIcon className="h-5 w-5 mr-2 inline-block text-blue-600" />
            Calendario de Citas
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadAllData}>
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="calendar-container overflow-x-auto">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
              events={calendarEvents}
              locale="es"
              headerToolbar={{
                left: isMobile ? 'prev,next' : 'prev,next today',
                center: 'title',
                right: isMobile ? 'timeGridDay,listWeek' : 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              height="auto"
              handleWindowResize={true}
              stickyHeaderDates={true}
              eventClick={(info) => {
                const appt = appointments.find(a => a.id === info.event.id);
                if (appt) {
                  setSelectedItem(appt);
                  setFormData(appt);
                  setCurrentSection('appointments');
                  setDialogOpen(true);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

  // Data table components
  const renderDataTable = (section) => {
    let data, columns, createForm

    switch (section) {
      case 'dentists':
        data = dentists.filter(item => 
          item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
        columns = ['Nombre Completo', 'Especialidad', 'Email', 'Teléfono', 'Acciones']
        createForm = (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Dr. Juan Pérez"
              />
            </div>
            <div>
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                value={formData.specialty || ''}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="Odontólogo General"
              />
            </div>
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@clinica.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+56912345678"
              />
            </div>
          </div>
        )
        break

      case 'patients':
        data = patients.filter(item => 
          item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        columns = ['Nombre Completo', 'Email', 'Teléfono', 'Acciones']
        createForm = (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="paciente@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+56912345678"
              />
            </div>
          </div>
        )
        break

      case 'treatments':
        data = treatments.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        columns = ['Nombre', 'Costo', 'Duración', 'Descripción', 'Acciones']
        createForm = (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Tratamiento</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Limpieza Dental"
              />
            </div>
            <div>
              <Label htmlFor="cost">Costo ($)</Label>
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
              <Label htmlFor="duration">Duración</Label>
              <Input
                id="duration"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="60 minutos"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción del tratamiento"
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
        columns = ['Paciente', 'Dentista', 'Tratamiento', 'Fecha', 'Hora', 'Estado', 'Acciones']
        createForm = (
          <div className="space-y-4">
            <div>
              <Label htmlFor="patientId">Paciente</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar un paciente" />
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
              <Label htmlFor="dentistId">Dentista</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, dentistId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar un dentista" />
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
              <Label htmlFor="treatmentId">Tratamiento</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, treatmentId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar un tratamiento" />
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
              <Label htmlFor="appointmentDate">Fecha</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={formData.appointmentDate || ''}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="appointmentTime">Hora</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={formData.appointmentTime || ''}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales para la cita"
              />
            </div>
          </div>
        )
        break
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{translateSection(section)}</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedItem(null); setFormData({}) }}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar {translateSection(section.slice(0, -1))}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem ? 'Editar' : 'Agregar'} {translateSection(section.slice(0, -1))}
                </DialogTitle>
              </DialogHeader>
              {createForm}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  if (selectedItem) {
                    handleUpdate(section, selectedItem.id, formData)
                  } else {
                    handleCreate(section, formData)
                  }
                }}>
                  {selectedItem ? 'Guardar' : 'Crear'}
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
                  placeholder={`Buscar ${translateSection(section).toLowerCase()}...`}
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
                            {item.email || 'No provisto'}
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
                        {section === 'patients' && currentUser?.role !== 'receptionist' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(item)
                              loadClinicalRecords(item.id)
                              setHistoryOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-1 px-2 h-8"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Historial
                          </Button>
                        )}
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
                        {currentUser?.role !== 'receptionist' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(section, item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
              <p className="text-sm text-gray-500">Clínica Dental</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {filteredSidebarItems.map((item) => {
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
                {currentUser?.name || 'Administrador'}
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
                  {currentSection === 'dashboard' ? 'Panel Principal' : translateSection(currentSection)}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentSection === 'dashboard' 
                    ? 'Bienvenido al sistema de gestión de tu clínica dental'
                    : `Gestiona los ${translateSection(currentSection).toLowerCase()} de tu clínica`
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

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial Clínico y Odontograma - {selectedPatient?.fullName}</DialogTitle>
            <DialogDescription>
              Fichas de diagnóstico, tratamientos dentales y visualización del odontograma
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="history">Ficha Clínica</TabsTrigger>
              <TabsTrigger value="odontograma">Odontograma</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-4">
              {/* Form to add a new record (Admins and Dentists only) */}
              {currentUser?.role !== 'receptionist' && (
                <div className="border-b pb-4 mb-4">
                  {!addingRecord ? (
                    <Button onClick={() => setAddingRecord(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Ficha Clínica
                    </Button>
                  ) : (
                    <form onSubmit={handleCreateRecord} className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900">Agregar Nueva Ficha</h3>
                      <div>
                        <Label htmlFor="diagnosis">Diagnóstico *</Label>
                        <Input
                          id="diagnosis"
                          value={newRecordData.diagnosis}
                          onChange={(e) => setNewRecordData({ ...newRecordData, diagnosis: e.target.value })}
                          placeholder="Ej. Caries profunda en pieza 46"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="treatmentNotes">Tratamiento Realizado *</Label>
                        <Textarea
                          id="treatmentNotes"
                          value={newRecordData.treatmentNotes}
                          onChange={(e) => setNewRecordData({ ...newRecordData, treatmentNotes: e.target.value })}
                          placeholder="Ej. Se realiza endodoncia y reconstrucción..."
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="teethNotes">Pieza Dental / Notas adicionales (Opcional)</Label>
                        <Input
                          id="teethNotes"
                          value={newRecordData.teethNotes}
                          onChange={(e) => setNewRecordData({ ...newRecordData, teethNotes: e.target.value })}
                          placeholder="Ej. Pieza 46 (molar inferior derecho)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Guardar Ficha</Button>
                        <Button variant="outline" type="button" onClick={() => { setAddingRecord(false); setNewRecordData({ diagnosis: '', treatmentNotes: '', teethNotes: '' }); }}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* List of past records */}
              <div className="space-y-4 mt-4">
                <h3 className="font-semibold text-gray-900">Fichas Clínicas Anteriores</h3>
                {clinicalRecords.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay registros clínicos para este paciente.</p>
                ) : (
                  clinicalRecords.map((record) => (
                    <div key={record.id} className="border p-4 rounded-lg space-y-2 bg-white relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-600 font-semibold">{record.date}</span>
                        <span className="text-xs text-gray-500">Dr. {record.dentists?.fullName || 'Desconocido'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">Diagnóstico:</span> {record.diagnosis}
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">Tratamiento:</span> {record.treatmentNotes}
                      </div>
                      {record.teethNotes && (
                        <div className="text-xs text-gray-500 italic">
                          Nota dental: {record.teethNotes}
                        </div>
                      )}
                      {currentUser?.role !== 'receptionist' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="odontograma" className="space-y-6">
              {/* Tool Palette */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Paleta de Diagnóstico</h3>
                <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {[
                    { id: 'caries', name: 'Caries', color: 'bg-red-500' },
                    { id: 'resina', name: 'Resina', color: 'bg-blue-500' },
                    { id: 'corona', name: 'Corona', color: 'bg-yellow-400 border border-yellow-600' },
                    { id: 'implante', name: 'Implante', color: 'bg-gray-500' },
                    { id: 'ausente', name: 'Ausente', color: 'bg-red-700' },
                    { id: 'limpiar', name: 'Limpiar / Borrar', color: 'bg-white border border-gray-300' }
                  ].map(tool => {
                    const isActive = selectedTool === tool.id
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => setSelectedTool(tool.id)}
                        className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isActive 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-100' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full mr-2 flex items-center justify-center text-[10px] ${
                          tool.id === 'implante' || tool.id === 'ausente' ? 'bg-transparent' : tool.color
                        }`}>
                          {tool.id === 'implante' && '🔩'}
                          {tool.id === 'ausente' && <span className="text-red-600 font-bold">X</span>}
                        </span>
                        {tool.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 border border-blue-100">
                <span className="font-semibold">Instrucciones:</span> Selecciona una herramienta de diagnóstico arriba. 
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Para <strong>Caries</strong> o <strong>Resina</strong>: Haz clic en cualquiera de las 5 superficies individuales de un diente (arriba, abajo, izquierda, derecha o centro).</li>
                  <li>Para <strong>Corona</strong>, <strong>Implante</strong> o <strong>Ausente</strong>: Haz clic en el recuadro del diente completo (zona del número/borde).</li>
                  <li>Para <strong>Limpiar / Borrar</strong>: Selecciona la herramienta y haz clic en la superficie o diente que deseas restaurar a su estado original.</li>
                </ul>
              </div>

              {/* Visual Odontograma Map */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white overflow-x-auto shadow-inner">
                <div className="min-w-[820px] flex flex-col items-center py-4">
                  
                  {/* Upper Arch */}
                  <div className="w-full mb-8">
                    <h4 className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest mb-4">Arcada Superior</h4>
                    <div className="flex justify-center gap-1.5">
                      {/* Quadrant 1 (18 to 11) */}
                      <div className="flex gap-1.5 border-r-2 border-dashed border-gray-300 pr-3">
                        {[18, 17, 16, 15, 14, 13, 12, 11].map(num => (
                          <Tooth 
                            key={num} 
                            number={num} 
                            state={patientOdontoState[num]} 
                            onFaceClick={(face) => handleFaceClick(num, face)}
                            onToothClick={() => handleToothClick(num)}
                          />
                        ))}
                      </div>
                      {/* Quadrant 2 (21 to 28) */}
                      <div className="flex gap-1.5 pl-3">
                        {[21, 22, 23, 24, 25, 26, 27, 28].map(num => (
                          <Tooth 
                            key={num} 
                            number={num} 
                            state={patientOdontoState[num]} 
                            onFaceClick={(face) => handleFaceClick(num, face)}
                            onToothClick={() => handleToothClick(num)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="w-full border-t border-gray-100 my-2" />

                  {/* Lower Arch */}
                  <div className="w-full mt-4">
                    <h4 className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest mb-4">Arcada Inferior</h4>
                    <div className="flex justify-center gap-1.5">
                      {/* Quadrant 4 (48 to 41) */}
                      <div className="flex gap-1.5 border-r-2 border-dashed border-gray-300 pr-3">
                        {[48, 47, 46, 45, 44, 43, 42, 41].map(num => (
                          <Tooth 
                            key={num} 
                            number={num} 
                            state={patientOdontoState[num]} 
                            onFaceClick={(face) => handleFaceClick(num, face)}
                            onToothClick={() => handleToothClick(num)}
                          />
                        ))}
                      </div>
                      {/* Quadrant 3 (31 to 38) */}
                      <div className="flex gap-1.5 pl-3">
                        {[31, 32, 33, 34, 35, 36, 37, 38].map(num => (
                          <Tooth 
                            key={num} 
                            number={num} 
                            state={patientOdontoState[num]} 
                            onFaceClick={(face) => handleFaceClick(num, face)}
                            onToothClick={() => handleToothClick(num)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t gap-2">
                <Button 
                  onClick={handleSaveOdontograma} 
                  disabled={isSavingOdonto}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                >
                  {isSavingOdonto ? 'Guardando...' : 'Guardar Odontograma'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setHistoryOpen(false); setAddingRecord(false); }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
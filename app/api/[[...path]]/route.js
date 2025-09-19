import { NextResponse } from 'next/server'
import { supabase, mockData, initializeDatabase } from '../../../lib/supabase.js'

// Utility function to check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'YOUR_SUPABASE_URL'
}

// Mock authentication for development
const mockAuth = {
  currentUser: null,
  login: (email, password) => {
    if (email === 'admin@clinic.com' && password === 'admin123') {
      mockAuth.currentUser = { id: 'user_1', email: 'admin@clinic.com', name: 'Admin User' }
      return { success: true, user: mockAuth.currentUser }
    }
    return { success: false, error: 'Invalid credentials' }
  },
  register: (email, password, name) => {
    mockAuth.currentUser = { id: `user_${Date.now()}`, email, name }
    return { success: true, user: mockAuth.currentUser }
  },
  logout: () => {
    mockAuth.currentUser = null
    return { success: true }
  }
}

export async function GET(request, { params }) {
  try {
    const pathSegments = params?.path || []
    const endpoint = pathSegments[0]

    // Handle authentication routes
    if (endpoint === 'auth') {
      const action = pathSegments[1]
      if (action === 'user') {
        return NextResponse.json({ user: mockAuth.currentUser })
      }
    }

    // Handle data endpoints
    if (isSupabaseConfigured()) {
      await initializeDatabase()
      
      switch (endpoint) {
        case 'dentists':
          const { data: dentists, error: dentistsError } = await supabase
            .from('dentists')
            .select('*')
            .order('createdAt', { ascending: false })
          
          if (dentistsError) throw dentistsError
          return NextResponse.json(dentists || [])

        case 'patients':
          const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('*')
            .order('createdAt', { ascending: false })
          
          if (patientsError) throw patientsError
          return NextResponse.json(patients || [])

        case 'treatments':
          const { data: treatments, error: treatmentsError } = await supabase
            .from('treatments')
            .select('*')
            .order('createdAt', { ascending: false })
          
          if (treatmentsError) throw treatmentsError
          return NextResponse.json(treatments || [])

        case 'appointments':
          const { data: appointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select(`
              *,
              patients (fullName),
              dentists (fullName),
              treatments (name)
            `)
            .order('appointmentDate', { ascending: true })
          
          if (appointmentsError) throw appointmentsError
          return NextResponse.json(appointments || [])

        default:
          return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
      }
    } else {
      // Use mock data when Supabase is not configured
      switch (endpoint) {
        case 'dentists':
          return NextResponse.json(mockData.dentists)
        case 'patients':
          return NextResponse.json(mockData.patients)
        case 'treatments':
          return NextResponse.json(mockData.treatments)
        case 'appointments':
          // Enrich appointments with related data
          const enrichedAppointments = mockData.appointments.map(apt => ({
            ...apt,
            patients: { fullName: mockData.patients.find(p => p.id === apt.patientId)?.fullName },
            dentists: { fullName: mockData.dentists.find(d => d.id === apt.dentistId)?.fullName },
            treatments: { name: mockData.treatments.find(t => t.id === apt.treatmentId)?.name }
          }))
          return NextResponse.json(enrichedAppointments)
        default:
          return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
      }
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const pathSegments = params?.path || []
    const endpoint = pathSegments[0]
    const body = await request.json()

    // Handle authentication
    if (endpoint === 'auth') {
      const action = pathSegments[1]
      
      if (action === 'login') {
        const result = mockAuth.login(body.email, body.password)
        if (result.success) {
          return NextResponse.json(result)
        } else {
          return NextResponse.json(result, { status: 401 })
        }
      }
      
      if (action === 'register') {
        const result = mockAuth.register(body.email, body.password, body.name)
        return NextResponse.json(result)
      }
      
      if (action === 'logout') {
        const result = mockAuth.logout()
        return NextResponse.json(result)
      }
    }

    // Handle data creation
    if (isSupabaseConfigured()) {
      switch (endpoint) {
        case 'dentists':
          const dentistData = {
            id: `dentist_${Date.now()}`,
            ...body,
            createdAt: new Date().toISOString()
          }
          
          const { data: newDentist, error: dentistError } = await supabase
            .from('dentists')
            .insert([dentistData])
            .select()
            .single()
          
          if (dentistError) throw dentistError
          return NextResponse.json(newDentist)

        case 'patients':
          const patientData = {
            id: `patient_${Date.now()}`,
            ...body,
            createdAt: new Date().toISOString()
          }
          
          const { data: newPatient, error: patientError } = await supabase
            .from('patients')
            .insert([patientData])
            .select()
            .single()
          
          if (patientError) throw patientError
          return NextResponse.json(newPatient)

        case 'treatments':
          const treatmentData = {
            id: `treatment_${Date.now()}`,
            ...body,
            createdAt: new Date().toISOString()
          }
          
          const { data: newTreatment, error: treatmentError } = await supabase
            .from('treatments')
            .insert([treatmentData])
            .select()
            .single()
          
          if (treatmentError) throw treatmentError
          return NextResponse.json(newTreatment)

        case 'appointments':
          const appointmentData = {
            id: `appt_${Date.now()}`,
            ...body,
            status: 'scheduled',
            createdAt: new Date().toISOString()
          }
          
          const { data: newAppointment, error: appointmentError } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select()
            .single()
          
          if (appointmentError) throw appointmentError
          return NextResponse.json(newAppointment)

        default:
          return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
      }
    } else {
      // Mock data creation (for development)
      const newId = `${endpoint.slice(0, -1)}_${Date.now()}`
      const newItem = {
        id: newId,
        ...body,
        createdAt: new Date().toISOString()
      }
      
      mockData[endpoint].push(newItem)
      return NextResponse.json(newItem)
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const pathSegments = params?.path || []
    const endpoint = pathSegments[0]
    const id = pathSegments[1]
    const body = await request.json()

    if (isSupabaseConfigured()) {
      const updateData = {
        ...body,
        updatedAt: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from(endpoint)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(data)
    } else {
      // Mock data update
      const items = mockData[endpoint]
      const index = items.findIndex(item => item.id === id)
      
      if (index === -1) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }
      
      items[index] = { ...items[index], ...body, updatedAt: new Date().toISOString() }
      return NextResponse.json(items[index])
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const pathSegments = params?.path || []
    const endpoint = pathSegments[0]
    const id = pathSegments[1]

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from(endpoint)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return NextResponse.json({ success: true })
    } else {
      // Mock data deletion
      const items = mockData[endpoint]
      const index = items.findIndex(item => item.id === id)
      
      if (index === -1) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }
      
      items.splice(index, 1)
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
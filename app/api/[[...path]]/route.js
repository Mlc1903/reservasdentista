import { NextResponse } from 'next/server'
import { supabase, mockData, initializeDatabase } from '../../../lib/supabase.js'

// Utility function to check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'YOUR_SUPABASE_URL'
}

// Utility function to get standard slots for a date string (YYYY-MM-DD)
const getSlotsForDate = (dateString) => {
  if (!dateString) return []
  const date = new Date(dateString + 'T00:00:00')
  const day = date.getDay() // 0 = Sunday, 6 = Saturday
  if (day === 0) return [] // Sunday closed
  
  const slots = []
  const startHour = 9
  const endHour = (day === 6) ? 13 : 18 // Weekdays till 18:00, Saturdays till 13:00
  
  for (let hour = startHour; hour < endHour; hour++) {
    const hStr = hour.toString().padStart(2, '0')
    slots.push(`${hStr}:00`)
    slots.push(`${hStr}:30`)
  }
  return slots
}

// Normalize appointmentTime to HH:MM format
const normalizeTime = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  }
  return timeStr
}

const isValidUUID = (str) => {
  if (typeof str !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Real authentication logic using Supabase Auth
const auth = {
  currentUser: null,
  login: async (email, password) => {
    // Development/test accounts fallback (always check first so they work even if Supabase is configured)
    if (email === 'admin@clinic.com' && password === 'admin123') {
      auth.currentUser = { id: 'admin_1', email: 'admin@clinic.com', name: 'Admin User', role: 'admin' }
      return { success: true, user: auth.currentUser }
    }
    if (email === 'dentist@clinic.com' && password === 'dentist123') {
      auth.currentUser = { id: 'dentist_user', email: 'dentist@clinic.com', name: 'Dr. Maria Rodriguez', role: 'dentist', dentistId: 1 }
      if (isSupabaseConfigured()) {
        try {
          const { data: dentists } = await supabase
            .from('dentists')
            .select('id, fullName')
            .eq('email', email)
            .limit(1)
          if (dentists && dentists.length > 0) {
            auth.currentUser.dentistId = dentists[0].id
            auth.currentUser.name = dentists[0].fullName
          }
        } catch (e) {
          console.error("Failed to map dentist email:", e)
        }
      }
      return { success: true, user: auth.currentUser }
    }
    if (email === 'receptionist@clinic.com' && password === 'receptionist123') {
      auth.currentUser = { id: 'receptionist_user', email: 'receptionist@clinic.com', name: 'Laura Gómez', role: 'receptionist' }
      return { success: true, user: auth.currentUser }
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { success: false, error: error.message }
      if (data.user) {
        auth.currentUser = { 
          id: data.user.id, 
          email: data.user.email, 
          name: data.user.user_metadata?.name || data.user.email.split('@')[0],
          role: 'admin' // default role
        }

        // Try to match email with a dentist profile to auto-assign the dentist role
        const { data: dentists } = await supabase
          .from('dentists')
          .select('id, fullName')
          .eq('email', data.user.email)
          .limit(1)

        if (dentists && dentists.length > 0) {
          auth.currentUser.role = 'dentist'
          auth.currentUser.dentistId = dentists[0].id
          auth.currentUser.name = dentists[0].fullName
        } else if (data.user.email.includes('receptionist') || data.user.email.includes('recep')) {
          auth.currentUser.role = 'receptionist'
        }

        return { success: true, user: auth.currentUser }
      }
    }
    
    return { success: false, error: 'Credenciales inválidas' }
  },
  register: async (email, password, name) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })

      if (error) return { success: false, error: error.message }
      if (data.user) {
        // Note: If email confirmation is ON, data.session might be null
        auth.currentUser = { id: data.user.id, email: data.user.email, name }
        return { success: true, user: auth.currentUser, needsConfirmation: !data.session }
      }
    }
    return { success: false, error: 'Supabase Auth not configured' }
  },
  logout: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    auth.currentUser = null
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
        return NextResponse.json({ user: auth.currentUser })
      }
    }

    // Handle data endpoints
    if (isSupabaseConfigured()) {
      await initializeDatabase()
      
    const rawUserId = auth.currentUser?.id
    const userId = rawUserId && isValidUUID(rawUserId) ? rawUserId : null

      switch (endpoint) {
        case 'dentists':
          let dentistsQuery = supabase
            .from('dentists')
            .select('*')
          
          if (userId) dentistsQuery = dentistsQuery.eq('userId', userId)
          
          const { data: dentists, error: dentistsError } = await dentistsQuery.order('createdAt', { ascending: false })
          
          if (dentistsError) throw dentistsError
          return NextResponse.json(dentists || [])

        case 'patients':
          let patientsQuery = supabase
            .from('patients')
            .select('*')
          
          if (userId) patientsQuery = patientsQuery.eq('userId', userId)

          const { data: patients, error: patientsError } = await patientsQuery.order('createdAt', { ascending: false })
          
          if (patientsError) throw patientsError
          return NextResponse.json(patients || [])

        case 'treatments':
          let treatmentsQuery = supabase
            .from('treatments')
            .select('*')
          
          if (userId) treatmentsQuery = treatmentsQuery.eq('userId', userId)

          const { data: treatments, error: treatmentsError } = await treatmentsQuery.order('createdAt', { ascending: false })
          
          if (treatmentsError) throw treatmentsError
          return NextResponse.json(treatments || [])

        case 'appointments':
          let appointmentsQuery = supabase
            .from('appointments')
            .select(`
              *,
              patients (fullName),
              dentists (fullName),
              treatments (name)
            `)
          
          if (auth.currentUser?.role === 'dentist') {
            appointmentsQuery = appointmentsQuery.eq('dentistId', auth.currentUser.dentistId)
          } else if (userId) {
            appointmentsQuery = appointmentsQuery.eq('userId', userId)
          }

          const { data: appointments, error: appointmentsError } = await appointmentsQuery.order('appointmentDate', { ascending: true })
          
          if (appointmentsError) throw appointmentsError
          return NextResponse.json(appointments || [])

        case 'clinical-records': {
          const { searchParams } = new URL(request.url)
          const patientId = searchParams.get('patientId')
          
          if (!patientId) {
            return NextResponse.json({ error: 'Missing patientId parameter' }, { status: 400 })
          }

          const parsedPatientId = !isNaN(parseInt(patientId, 10)) ? parseInt(patientId, 10) : patientId

          const { data: records, error } = await supabase
            .from('clinical_records')
            .select(`
              *,
              dentists (fullName)
            `)
            .eq('patientId', parsedPatientId)
            .order('createdAt', { ascending: false })
          
          if (error) throw error
          return NextResponse.json(records || [])
        }

        case 'horas-disponibles': {
          const { searchParams } = new URL(request.url)
          const fecha = searchParams.get('fecha')
          const dentistId = searchParams.get('dentistId') || searchParams.get('dentistaId')
          
          if (!fecha) {
            return NextResponse.json({ error: 'Missing fecha parameter' }, { status: 400 })
          }
          
          const allSlots = getSlotsForDate(fecha)
          if (allSlots.length === 0) {
            return NextResponse.json([])
          }

          const { data: dentists, error: dentistsError } = await supabase
            .from('dentists')
            .select('id')
          if (dentistsError) throw dentistsError

          if (!dentists || dentists.length === 0) {
            return NextResponse.json([])
          }

          // Parse dentistId to integer since Supabase IDs are integers
          const parsedDentistId = dentistId && !isNaN(parseInt(dentistId, 10)) ? parseInt(dentistId, 10) : null

          let query = supabase
            .from('appointments')
            .select('dentistId, appointmentTime')
            .eq('appointmentDate', fecha)
            .neq('status', 'cancelled')
          
          if (parsedDentistId) {
            query = query.eq('dentistId', parsedDentistId)
          }

          const { data: appts, error: apptsError } = await query
          if (apptsError) throw apptsError

          const availableSlots = allSlots.filter(slot => {
            if (parsedDentistId) {
              const isBooked = appts.some(apt => normalizeTime(apt.appointmentTime) === slot)
              return !isBooked
            } else {
              const bookedCount = appts.filter(apt => normalizeTime(apt.appointmentTime) === slot).length
              return bookedCount < dentists.length
            }
          })

          return NextResponse.json(availableSlots)
        }

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
          let filteredAppts = mockData.appointments
          if (auth.currentUser?.role === 'dentist') {
            filteredAppts = filteredAppts.filter(apt => apt.dentistId === auth.currentUser.dentistId)
          }

          const enrichedAppointments = filteredAppts.map(apt => ({
            ...apt,
            patients: { fullName: mockData.patients.find(p => p.id === apt.patientId)?.fullName },
            dentists: { fullName: mockData.dentists.find(d => d.id === apt.dentistId)?.fullName },
            treatments: { name: mockData.treatments.find(t => t.id === apt.treatmentId)?.name }
          }))
          return NextResponse.json(enrichedAppointments)

        case 'clinical-records': {
          const { searchParams } = new URL(request.url)
          const patientId = searchParams.get('patientId')
          
          if (!patientId) {
            return NextResponse.json({ error: 'Missing patientId parameter' }, { status: 400 })
          }

          const parsedPatientId = !isNaN(parseInt(patientId, 10)) ? parseInt(patientId, 10) : patientId

          const records = mockData.clinical_records.filter(r => r.patientId === parsedPatientId)
          const enriched = records.map(r => ({
            ...r,
            dentists: { fullName: mockData.dentists.find(d => d.id === r.dentistId)?.fullName || 'Desconocido' }
          }))
          return NextResponse.json(enriched)
        }

        case 'horas-disponibles': {
          const { searchParams } = new URL(request.url)
          const fecha = searchParams.get('fecha')
          const dentistId = searchParams.get('dentistId') || searchParams.get('dentistaId')
          
          if (!fecha) {
            return NextResponse.json({ error: 'Missing fecha parameter' }, { status: 400 })
          }
          
          const allSlots = getSlotsForDate(fecha)
          if (allSlots.length === 0) {
            return NextResponse.json([])
          }

          const dentists = mockData.dentists
          if (!dentists || dentists.length === 0) {
            return NextResponse.json([])
          }

          let appts = mockData.appointments.filter(
            apt => apt.appointmentDate === fecha && apt.status !== 'cancelled'
          )

          if (dentistId) {
            appts = appts.filter(apt => apt.dentistId === dentistId)
          }

          const availableSlots = allSlots.filter(slot => {
            if (dentistId) {
              const isBooked = appts.some(apt => normalizeTime(apt.appointmentTime) === slot)
              return !isBooked
            } else {
              const bookedCount = appts.filter(apt => normalizeTime(apt.appointmentTime) === slot).length
              return bookedCount < dentists.length
            }
          })

          return NextResponse.json(availableSlots)
        }

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
    
    // Handle authentication
    if (endpoint === 'auth') {
      const action = pathSegments[1]
      
      // Logout doesn't need a body
      if (action === 'logout') {
        const result = auth.logout()
        return NextResponse.json(result)
      }
      
      // Other auth actions need body
      const body = await request.json()

      if (action === 'login') {
        const result = await auth.login(body.email, body.password)
        if (result.success) {
          return NextResponse.json(result)
        } else {
          return NextResponse.json(result, { status: 401 })
        }
      }
      
      if (action === 'register') {
        const result = await auth.register(body.email, body.password, body.name)
        return NextResponse.json(result)
      }
    }

    // For non-auth endpoints, parse body
    const body = await request.json()

    const rawUserId = auth.currentUser?.id
    const userId = rawUserId && isValidUUID(rawUserId) ? rawUserId : null

    if (endpoint === 'reservar-cita') {
      if (isSupabaseConfigured()) {
        const { nombre, fecha, hora, phone, notes, dentistId, treatmentId } = body
        if (!nombre || !fecha || !hora) {
          return NextResponse.json({ error: 'Missing required fields: nombre, fecha, hora' }, { status: 400 })
        }

        // Parse optional dentistId and treatmentId to integers for Supabase
        const parsedDentistId = dentistId && !isNaN(parseInt(dentistId, 10)) ? parseInt(dentistId, 10) : null
        const parsedTreatmentId = treatmentId && !isNaN(parseInt(treatmentId, 10)) ? parseInt(treatmentId, 10) : null

        // 1. Patient lookup or creation (letting DB auto-generate integer ID)
        let finalPatientId = null
        const { data: existingPatients, error: patientSelectError } = await supabase
          .from('patients')
          .select('id')
          .eq('fullName', nombre)
          .limit(1)
        
        if (patientSelectError) throw patientSelectError

        if (existingPatients && existingPatients.length > 0) {
          finalPatientId = existingPatients[0].id
        } else {
          // Omit id field so Supabase auto-generates the bigint ID
          const patientData = {
            fullName: nombre,
            phone: phone || '+1-555-0000',
            email: '',
            userId,
            createdAt: new Date().toISOString()
          }
          const { data: newPat, error: patientInsertError } = await supabase
            .from('patients')
            .insert([patientData])
            .select()
            .single()
          if (patientInsertError) throw patientInsertError
          finalPatientId = newPat.id
        }

        // 2. Dentist assignment
        let finalDentistId = parsedDentistId
        const { data: dentists, error: dentistsError } = await supabase
          .from('dentists')
          .select('id')
        if (dentistsError) throw dentistsError
        if (!dentists || dentists.length === 0) {
          return NextResponse.json({ error: 'No dentists configured in system' }, { status: 400 })
        }

        const { data: activeAppts, error: activeApptsError } = await supabase
          .from('appointments')
          .select('dentistId')
          .eq('appointmentDate', fecha)
          .eq('appointmentTime', hora)
          .neq('status', 'cancelled')
        if (activeApptsError) throw activeApptsError

        if (finalDentistId) {
          const isBusy = activeAppts.some(a => a.dentistId === finalDentistId)
          if (isBusy) {
            return NextResponse.json({ error: 'El dentista seleccionado no está disponible a esa hora' }, { status: 400 })
          }
        } else {
          const busyDentistIds = activeAppts.map(a => a.dentistId)
          const freeDentist = dentists.find(d => !busyDentistIds.includes(d.id))
          if (!freeDentist) {
            return NextResponse.json({ error: 'No hay dentistas disponibles a esa hora' }, { status: 400 })
          }
          finalDentistId = freeDentist.id
        }

        // 3. Treatment assignment
        let finalTreatmentId = parsedTreatmentId
        if (!finalTreatmentId) {
          const { data: treatments, error: treatmentsError } = await supabase
            .from('treatments')
            .select('id')
            .limit(1)
          if (treatmentsError) throw treatmentsError

          if (treatments && treatments.length > 0) {
            finalTreatmentId = treatments[0].id
          } else {
            // Omit id field so Supabase auto-generates it
            const treatmentData = {
              name: 'Consulta General',
              cost: 100.00,
              duration: '30 minutes',
              description: 'Consulta de diagnóstico general',
              userId,
              createdAt: new Date().toISOString()
            }
            const { data: newTreat, error: treatmentInsertError } = await supabase
              .from('treatments')
              .insert([treatmentData])
              .select()
              .single()
            if (treatmentInsertError) throw treatmentInsertError
            finalTreatmentId = newTreat.id
          }
        }

        // 4. Create appointment (omitting ID so PostgreSQL auto-generates it)
        const appointmentData = {
          patientId: finalPatientId,
          dentistId: finalDentistId,
          treatmentId: finalTreatmentId,
          appointmentDate: fecha,
          appointmentTime: hora,
          status: 'scheduled',
          notes: notes || 'Reservado desde WhatsApp/Portal',
          userId,
          createdAt: new Date().toISOString()
        }

        const { data: newAppt, error: apptError } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()
          .single()
        
        if (apptError) throw apptError

        return NextResponse.json({
          success: true,
          message: 'Cita reservada correctamente ✅',
          appointment: newAppt
        })
      } else {
        const { nombre, fecha, hora, phone, notes, dentistId, treatmentId } = body
        if (!nombre || !fecha || !hora) {
          return NextResponse.json({ error: 'Missing required fields: nombre, fecha, hora' }, { status: 400 })
        }

        // 1. Patient lookup or creation
        let finalPatientId = null
        const existingPatient = mockData.patients.find(p => p.fullName === nombre)
        
        if (existingPatient) {
          finalPatientId = existingPatient.id
        } else {
          const newPatId = `patient_${Date.now()}`
          const newPatient = {
            id: newPatId,
            fullName: nombre,
            phone: phone || '+1-555-0000',
            email: '',
            createdAt: new Date().toISOString()
          }
          mockData.patients.push(newPatient)
          finalPatientId = newPatId
        }

        // 2. Dentist assignment
        let finalDentistId = dentistId
        const dentists = mockData.dentists
        if (!dentists || dentists.length === 0) {
          return NextResponse.json({ error: 'No dentists configured in system' }, { status: 400 })
        }

        const activeAppts = mockData.appointments.filter(
          a => a.appointmentDate === fecha && a.appointmentTime === hora && a.status !== 'cancelled'
        )

        if (finalDentistId) {
          const isBusy = activeAppts.some(a => a.dentistId === finalDentistId)
          if (isBusy) {
            return NextResponse.json({ error: 'El dentista seleccionado no está disponible a esa hora' }, { status: 400 })
          }
        } else {
          const busyDentistIds = activeAppts.map(a => a.dentistId)
          const freeDentist = dentists.find(d => !busyDentistIds.includes(d.id))
          if (!freeDentist) {
            return NextResponse.json({ error: 'No hay dentistas disponibles a esa hora' }, { status: 400 })
          }
          finalDentistId = freeDentist.id
        }

        // 3. Treatment assignment
        let finalTreatmentId = treatmentId
        if (!finalTreatmentId) {
          if (mockData.treatments && mockData.treatments.length > 0) {
            finalTreatmentId = mockData.treatments[0].id
          } else {
            const newTreatId = `treatment_${Date.now()}`
            const newTreatment = {
              id: newTreatId,
              name: 'Consulta General',
              cost: 100.00,
              duration: '30 minutes',
              description: 'Consulta de diagnóstico general',
              createdAt: new Date().toISOString()
            }
            mockData.treatments.push(newTreatment)
            finalTreatmentId = newTreatId
          }
        }

        // 4. Create appointment
        const apptId = `appt_${Date.now()}`
        const newAppt = {
          id: apptId,
          patientId: finalPatientId,
          dentistId: finalDentistId,
          treatmentId: finalTreatmentId,
          appointmentDate: fecha,
          appointmentTime: hora,
          status: 'scheduled',
          notes: notes || 'Reservado desde WhatsApp/Portal',
          createdAt: new Date().toISOString()
        }

        mockData.appointments.push(newAppt)

        return NextResponse.json({
          success: true,
          message: 'Cita reservada correctamente ✅',
          appointment: newAppt
        })
      }
    }

    if (endpoint === 'clinical-records') {
      const { patientId, dentistId, date, diagnosis, treatmentNotes, teethNotes } = body
      if (!patientId || !date || !diagnosis || !treatmentNotes) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const parsedPatientId = !isNaN(parseInt(patientId, 10)) ? parseInt(patientId, 10) : patientId
      const parsedDentistId = dentistId && !isNaN(parseInt(dentistId, 10)) ? parseInt(dentistId, 10) : dentistId

      if (isSupabaseConfigured()) {
        const recordData = {
          patientId: parsedPatientId,
          dentistId: parsedDentistId,
          date,
          diagnosis,
          treatmentNotes,
          teethNotes: teethNotes || '',
          createdAt: new Date().toISOString()
        }

        const { data: newRecord, error } = await supabase
          .from('clinical_records')
          .insert([recordData])
          .select()
          .single()
        
        if (error) throw error
        return NextResponse.json(newRecord)
      } else {
        const newId = `rec_${Date.now()}`
        const newRecord = {
          id: newId,
          patientId: parsedPatientId,
          dentistId: parsedDentistId,
          date,
          diagnosis,
          treatmentNotes,
          teethNotes: teethNotes || '',
          createdAt: new Date().toISOString()
        }
        mockData.clinical_records.push(newRecord)
        return NextResponse.json(newRecord)
      }
    }

    // Handle data creation
    if (isSupabaseConfigured()) {
      switch (endpoint) {
        case 'dentists':
          const dentistData = {
            ...body,
            userId,
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
            ...body,
            userId,
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
            ...body,
            userId,
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
            ...body,
            userId,
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
        .from(endpoint === 'clinical-records' ? 'clinical_records' : endpoint)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return NextResponse.json({ success: true })
    } else {
      // Mock data deletion
      const dbTable = endpoint === 'clinical-records' ? 'clinical_records' : endpoint
      const items = mockData[dbTable]
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
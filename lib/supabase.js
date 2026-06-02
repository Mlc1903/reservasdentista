import { createClient } from '@supabase/supabase-js'

// These will be set when user provides Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Only create Supabase client if properly configured
export const supabase = (supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseUrl && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

// Mock data for initial development - will be replaced with Supabase data
export const mockData = {
  dentists: [
    {
      id: 'dentist_1',
      fullName: 'Dr. Maria Rodriguez',
      specialty: 'Orthodontist',
      email: 'maria.rodriguez@dentalclinic.com',
      phone: '+1-555-0123',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dentist_2',
      fullName: 'Dr. James Wilson',
      specialty: 'General Dentist',
      email: 'james.wilson@dentalclinic.com', 
      phone: '+1-555-0124',
      createdAt: new Date().toISOString()
    }
  ],
  patients: [
    {
      id: 'patient_1',
      fullName: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-1234',
      odontograma: {},
      createdAt: new Date().toISOString()
    },
    {
      id: 'patient_2',
      fullName: 'Sarah Johnson',
      email: '',
      phone: '+1-555-1235',
      odontograma: {},
      createdAt: new Date().toISOString()
    }
  ],
  treatments: [
    {
      id: 'treatment_1',
      name: 'Dental Cleaning',
      cost: 120.00,
      duration: '60 minutes',
      description: 'Professional teeth cleaning and plaque removal',
      createdAt: new Date().toISOString()
    },
    {
      id: 'treatment_2',
      name: 'Root Canal',
      cost: 850.00,
      duration: '90 minutes',
      description: 'Root canal therapy to treat infected tooth pulp',
      createdAt: new Date().toISOString()
    }
  ],
  appointments: [
    {
      id: 'appt_1',
      patientId: 'patient_1',
      dentistId: 'dentist_1',
      treatmentId: 'treatment_1',
      appointmentDate: '2025-01-15',
      appointmentTime: '09:00',
      status: 'scheduled',
      notes: 'Regular checkup and cleaning',
      createdAt: new Date().toISOString()
    },
    {
      id: 'appt_2',
      patientId: 'patient_2',
      dentistId: 'dentist_2',
      treatmentId: 'treatment_2',
      appointmentDate: '2025-01-16',
      appointmentTime: '14:30',
      status: 'scheduled',
      notes: 'Follow-up root canal treatment',
      createdAt: new Date().toISOString()
    }
  ],
  clinical_records: [
    {
      id: 'rec_1',
      patientId: 'patient_1',
      dentistId: 'dentist_1',
      date: '2025-01-15',
      diagnosis: 'Caries leve en molar inferior derecho',
      treatmentNotes: 'Se realiza limpieza y resina compuesta en pieza 46.',
      teethNotes: 'Pieza 46',
      createdAt: new Date().toISOString()
    }
  ]
}

// Database initialization for Supabase (to be used later)
export const initializeDatabase = async () => {
  try {
    if (supabaseUrl === 'YOUR_SUPABASE_URL') {
      console.log('Using mock data - Supabase not configured yet')
      return
    }
    
    // Check if tables exist and have data
    const { data: dentists } = await supabase.from('dentists').select('id').limit(1)
    
    if (!dentists || dentists.length === 0) {
      await initializeData()
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

export const initializeData = async () => {
  try {
    // Insert initial data
    await supabase.from('dentists').insert(mockData.dentists)
    await supabase.from('patients').insert(mockData.patients)
    await supabase.from('treatments').insert(mockData.treatments)
    await supabase.from('appointments').insert(mockData.appointments)
  } catch (error) {
    console.error('Error initializing data:', error)
  }
}
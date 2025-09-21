# SmileAdmin - Dental Clinic Dashboard

A comprehensive dental clinic management system built with Next.js, featuring patient management, dentist scheduling, treatment tracking, and appointment calendar functionality.

## 🚀 Features

- **Authentication System**: Secure login/register with demo credentials
- **Dashboard Overview**: Real-time statistics and recent activity
- **Dentist Management**: Add, edit, and manage dental staff profiles
- **Patient Management**: Complete patient database with contact information
- **Treatment Catalog**: Manage services, pricing, and descriptions
- **Appointment Scheduling**: Calendar-based appointment system
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Search & Filtering**: Quick search across all data sections
- **Data Export Ready**: Easy integration with Supabase database

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) or Mock Data
- **Authentication**: Custom auth system with Supabase Auth ready
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📋 Prerequisites

- Node.js 18+ 
- Yarn package manager
- Supabase account (optional - works with mock data)

## 🚀 Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd dental-clinic-dashboard

# Install dependencies
yarn install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Required for Next.js
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase Configuration (Optional - works with mock data without these)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# CORS settings
CORS_ORIGINS=*
```

### 3. Run Development Server

```bash
# Start development server
yarn dev

# Application will be available at http://localhost:3000
```

### 4. Demo Login Credentials

```
Email: admin@clinic.com
Password: admin123
```

## 🗄️ Database Setup (Supabase)

### Option 1: Using Mock Data (Default)
The application works out-of-the-box with mock data. No additional setup required.

### Option 2: Connect to Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key from Settings → API

2. **Add Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Create Database Tables**
   
   Run this SQL in your Supabase SQL Editor:

   ```sql
   -- Create dentists table
   CREATE TABLE dentists (
     id TEXT PRIMARY KEY,
     "fullName" TEXT NOT NULL,
     specialty TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT NOT NULL,
     "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create patients table
   CREATE TABLE patients (
     id TEXT PRIMARY KEY,
     "fullName" TEXT NOT NULL,
     email TEXT DEFAULT '',
     phone TEXT NOT NULL,
     "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create treatments table
   CREATE TABLE treatments (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     cost DECIMAL(10,2) NOT NULL,
     duration TEXT NOT NULL,
     description TEXT NOT NULL,
     "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create appointments table
   CREATE TABLE appointments (
     id TEXT PRIMARY KEY,
     "patientId" TEXT NOT NULL,
     "dentistId" TEXT NOT NULL,
     "treatmentId" TEXT NOT NULL,
     "appointmentDate" DATE NOT NULL,
     "appointmentTime" TIME NOT NULL,
     status TEXT DEFAULT 'scheduled',
     notes TEXT DEFAULT '',
     "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     FOREIGN KEY ("patientId") REFERENCES patients(id),
     FOREIGN KEY ("dentistId") REFERENCES dentists(id),
     FOREIGN KEY ("treatmentId") REFERENCES treatments(id)
   );

   -- Enable Row Level Security
   ALTER TABLE dentists ENABLE ROW LEVEL SECURITY;
   ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
   ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

   -- Create policies for public access (adjust as needed)
   CREATE POLICY "Allow all operations" ON dentists FOR ALL USING (true);
   CREATE POLICY "Allow all operations" ON patients FOR ALL USING (true);
   CREATE POLICY "Allow all operations" ON treatments FOR ALL USING (true);
   CREATE POLICY "Allow all operations" ON appointments FOR ALL USING (true);
   ```

4. **Restart the Application**
   ```bash
   yarn dev
   ```

## ☁️ Cloud Deployment

### Deploy to Vercel (Recommended)

1. **Prepare for Deployment**
   ```bash
   # Build the application
   yarn build
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel

   # Follow the prompts to connect your project
   ```

3. **Set Environment Variables in Vercel**
   - Go to your Vercel dashboard
   - Navigate to your project → Settings → Environment Variables
   - Add your environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

### Deploy to Netlify

1. **Build for Production**
   ```bash
   yarn build
   ```

2. **Deploy to Netlify**
   - Create `netlify.toml` in root:
   ```toml
   [build]
     command = "yarn build"
     publish = ".next"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

   - Connect your Git repository to Netlify
   - Set environment variables in Netlify dashboard

### Deploy to Railway

1. **Create `railway.toml`**
   ```toml
   [build]
     builder = "nixpacks"

   [deploy]
     startCommand = "yarn start"
   ```

2. **Deploy**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway deploy
   ```

### Deploy with Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN yarn install --frozen-lockfile

   COPY . .
   RUN yarn build

   EXPOSE 3000

   CMD ["yarn", "start"]
   ```

2. **Build and Run**
   ```bash
   # Build Docker image
   docker build -t dental-clinic-dashboard .

   # Run container
   docker run -p 3000:3000 dental-clinic-dashboard
   ```

## 🧪 Testing

### Manual Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"admin123"}'

# Test data endpoints
curl http://localhost:3000/api/dentists
curl http://localhost:3000/api/patients
curl http://localhost:3000/api/treatments
curl http://localhost:3000/api/appointments
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/auth/user` | Get current user |
| GET | `/api/dentists` | Get all dentists |
| POST | `/api/dentists` | Create dentist |
| PUT | `/api/dentists/[id]` | Update dentist |
| DELETE | `/api/dentists/[id]` | Delete dentist |
| GET | `/api/patients` | Get all patients |
| POST | `/api/patients` | Create patient |
| PUT | `/api/patients/[id]` | Update patient |
| DELETE | `/api/patients/[id]` | Delete patient |
| GET | `/api/treatments` | Get all treatments |
| POST | `/api/treatments` | Create treatment |
| PUT | `/api/treatments/[id]` | Update treatment |
| DELETE | `/api/treatments/[id]` | Delete treatment |
| GET | `/api/appointments` | Get all appointments |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/[id]` | Update appointment |
| DELETE | `/api/appointments/[id]` | Delete appointment |

## 📱 User Guide

### Getting Started
1. Open the application in your browser
2. Click "Create Account" or use demo credentials
3. Navigate through sections using the left sidebar

### Managing Data
- **Add**: Click the "Add" button in any section
- **Edit**: Click the edit icon in table rows
- **Delete**: Click the delete icon (confirms before deletion)
- **Search**: Use the search bar to filter results

### Dashboard Overview
- View total counts for all data types
- See recent appointments
- Monitor available dentists

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_BASE_URL`: Your application URL

### Customization
- **Colors**: Modify `tailwind.config.js` for brand colors
- **Logo**: Replace logo in the sidebar component
- **Features**: Add new sections by extending the API routes and UI

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules yarn.lock
   yarn install
   ```

2. **Supabase connection issues**
   - Verify your environment variables
   - Check Supabase project status
   - Ensure RLS policies are set correctly

3. **Build errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   yarn build
   ```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**SmileAdmin** - Making dental clinic management simple and efficient! 🦷✨
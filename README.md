# Hospital Management System

A production-grade, full-stack Hospital Management System built with **Spring Boot** (backend) and **React + Tailwind CSS** (frontend). Features a complete **Doctor Portal** with AI-powered visit summaries, role-based access for 4 user types, real-world billing with discounts/tax/insurance, appointment token queuing, audit logging, analytics dashboards, and OpenFDA drug search integration.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Role-Based Access Control](#role-based-access-control)
- [Doctor Portal](#doctor-portal)
- [Billing System](#billing-system)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Groq AI Setup](#groq-ai-setup)
  - [Email Configuration](#email-configuration)
- [API Overview](#api-overview)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Default Credentials](#default-credentials)

---

## Features

### Authentication & Users
- JWT-based authentication with role-based access control
- **Four roles**: Admin, Receptionist, Cashier, Doctor
- Profile management with name, email, and password change
- Password reset via email (Gmail SMTP with Maildrop.cc support)
- Welcome email with temporary password when admin creates users
- Single-use, time-limited reset tokens
- Password strength indicator

### Patient Management
- Full CRUD with search and gender filter
- Patient history modal with tabs (Appointments, Bills, Payments)
- CSV export of patient data
- Age auto-calculation from date of birth
- View detail modal with quick stats

### Doctor Management
- Full CRUD with specialization filter from master data
- Table/Card view toggle
- Doctor detail modal showing schedules and appointment stats
- Initials avatar with specialization color badges
- Channeling fee management

### Schedule Management
- Weekly calendar view and table view toggle
- Doctor availability by day and time slot
- 12-hour time formatting
- Color-coded schedule cards per doctor
- Edit/delete with role-based permissions

### Appointment System
- 3-step booking wizard: Patient -> Doctor -> Date/Time
- **Daily auto-incrementing token numbers** (1, 2, 3...)
- Today's Queue view sorted by token number
- Appointment lifecycle: PENDING -> CONFIRMED -> COMPLETED / CANCELLED / RESCHEDULED
- Cancel with reason and optional refund
- Reschedule to specific date with availability check
- Max 20 appointments per doctor per day
- Fee auto-calculation: Doctor Fee + Hospital Charge

### Billing System (Real-World)
- **Auto-generated bill numbers** (BILL-2026-00001)
- **Itemized billing** with subtotal, discount, tax, and net amount
- **Discount support**: Flat amount or percentage with configurable reasons
- **Tax calculation**: Configurable tax rate applied to all bills
- **Insurance coverage**: Provider, policy number, coverage amount
- **Partial payments**: Pay in installments with running balance tracking
- Payment status: UNPAID / PARTIAL / PAID / REFUNDED
- **Multiple payment methods**: Cash, Card, Online, Bank Transfer, Cheque, Insurance
- **Refund processing** with reason and audit trail
- **Professional A5 print receipts** with hospital branding
- Standalone test-only bills (no appointment required)
- Add/remove medical tests from unpaid bills
- Bill notes and audit trail (created by, paid by)

### Medical Tests
- Test catalog with types: LAB, XRAY, SCAN, RADIOLOGY, OTHER
- Category tabs for quick filtering
- Table/Card view toggle
- Active/Inactive toggle (soft delete)
- Price management

### Doctor Portal
- **Separate doctor-specific interface** with dedicated layout
- **Today's Queue**: Token-sorted patient list with Start/Resume consultation
- **Consultation Form** (6 tabs):
  - **Vitals**: BP, Temperature, Pulse, SpO2, Weight, Height, BMI (auto-calculated), Respiratory Rate
  - **Clinical Assessment**: Chief complaint, history, examination, allergies, diagnosis
  - **Prescription**: OpenFDA drug search (100K+ drugs) + manual entry, dosage, frequency, duration, route, instructions
  - **Lab Orders**: Select from test catalog grouped by type
  - **Follow-up**: Date picker and special instructions
  - **AI Summary**: Groq AI generates professional clinical visit summary
- **My Consultations**: Search, filter by status, view all past consultations
- **My Patients**: Unique patients seen with consultation history
- **My Schedule**: Weekly calendar view of doctor's availability
- **Prescription Print**: Professional A5 prescription with Rx symbol
- **Visit Summary Print**: Complete clinical documentation printout

### AI Integration (Groq)
- **Groq API** with LLaMA 3.3 70B model for clinical documentation
- Generates professional visit summaries from consultation data
- Doctor can review, edit, and regenerate summaries
- Structured output with Visit Overview, Clinical Assessment, Treatment Plan, Follow-up

### Drug Search (OpenFDA)
- Integrated with **FDA Drug Label API** (free, no API key required)
- Search 100,000+ medications by brand or generic name
- Auto-fills: brand name, generic name, dosage form, route, manufacturer, NDC code
- Debounced search with loading states
- Fallback to manual entry

### Reports & Analytics
- **Dashboard**: 8 stat cards, revenue chart (7/14/30 days), today's appointments, top doctors
- **Reports Page**: Monthly revenue trends, appointment status donut chart, doctor performance table, daily revenue with date range picker
- **Activity Log**: Timeline-style audit trail with filters by action, entity, user, and date range

### Audit Logging
- Tracks all system actions: CREATE, UPDATE, DELETE, LOGIN, PAYMENT, REFUND, CANCEL, RESCHEDULE
- Records performer, role, timestamp, entity type, and details
- Never breaks main application flow (wrapped in try-catch)
- Filterable and paginated

### System Settings (Admin)
- Hospital information (name, address, phone, email) for receipts
- Hospital charge per appointment
- Tax rate configuration
- Specialization list management
- Discount reasons management
- Payment methods management
- All settings persist in database

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Language |
| Spring Boot | 3.2.0 | Framework |
| Spring Security | 6.x | Auth & RBAC |
| Spring Data JPA | 3.x | ORM |
| Hibernate | 6.x | JPA implementation |
| MySQL | 8+ / 9.x | Database |
| JWT (jjwt) | 0.11.5 | Token authentication |
| Spring Mail | 3.x | Email sending |
| Groq API | LLaMA 3.3 70B | AI visit summaries |
| Maven | 3.x | Build tool |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| Vite | 7.x | Build tool |
| React Router | 7.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first styling |
| Axios | 1.x | HTTP client |
| OpenFDA API | - | Drug database search |

---

## System Architecture

```
+----------------------------------------------------------+
|                    React Frontend                          |
|             (Vite + Tailwind CSS + Axios)                 |
|                  localhost:5173                            |
|                                                           |
|  +-- Admin/Receptionist/Cashier Portal                    |
|  |   Dashboard, Patients, Doctors, Appointments,          |
|  |   Billing, Tests, Reports, Settings, Users             |
|  |                                                        |
|  +-- Doctor Portal                                        |
|      Dashboard, Queue, Consultation, Patients,            |
|      Schedule, Prescriptions                              |
+-------------------------+--------------------------------+
                          | REST API + JWT
+-------------------------v--------------------------------+
|                  Spring Boot Backend                       |
|                   localhost:8080                           |
|                                                           |
|  Controllers -> Services -> Repositories -> MySQL         |
|  Security (JWT Filter + @PreAuthorize)                    |
|  AuditLog (tracks all actions)                            |
+---+-----------------+-------------------+----------------+
    |                 |                   |
    v                 v                   v
+--------+    +-------------+    +---------------+
| MySQL  |    | Gmail SMTP  |    | External APIs |
| DB     |    | (Emails)    |    |               |
+--------+    +-------------+    | - Groq AI     |
                                 | - OpenFDA     |
                                 +---------------+
```

---

## Role-Based Access Control

| Feature | Admin | Receptionist | Cashier | Doctor |
|---|:---:|:---:|:---:|:---:|
| Dashboard | Admin | Admin | Admin | Doctor |
| Patients (view/add) | Y | Y | Y | Own patients |
| Patients (edit/delete) | Y | Y | - | - |
| Doctors (view/add) | Y | Y | View only | - |
| Schedules (manage) | Y | Y | - | View own |
| Appointments (book) | Y | Y | Y | - |
| Appointments (status) | Y | Y | Y | Complete |
| Billing (view/pay) | Y | - | Y | - |
| Billing (discount/refund) | Y | - | Y | - |
| Medical Tests (manage) | Y | - | - | Order |
| Consultations | - | - | - | Full access |
| Prescriptions | - | - | - | Write/Print |
| AI Summary | - | - | - | Generate |
| Reports & Analytics | Y | - | Y | - |
| Activity Log | Y | - | - | - |
| User Management | Y | - | - | - |
| System Settings | Y | - | - | - |
| Profile | Y | Y | Y | Y |

---

## Doctor Portal

The Doctor Portal is a completely separate interface designed for clinical workflows:

### Consultation Flow
```
Doctor Login -> Doctor Dashboard -> Today's Queue
                                       |
                              Click "Start Consultation"
                                       |
                            Consultation Form Opens
                                       |
                    +------------------+------------------+
                    |        |         |        |         |
                 Vitals  Clinical  Prescription  Labs   Follow-up
                    |        |         |        |         |
                    +------------------+------------------+
                                       |
                            Generate AI Summary (Groq)
                                       |
                            Review & Edit Summary
                                       |
                          Complete Consultation
                                       |
                    Print Prescription / Visit Summary
```

### OpenFDA Drug Search
The prescription tab integrates with the FDA's public drug database:
- **API**: `https://api.fda.gov/drug/label.json`
- **Coverage**: 100,000+ medications
- **No API key required** (free, public, CORS-enabled)
- Returns: brand name, generic name, dosage form, route, manufacturer, NDC

---

## Billing System

### Bill Calculation Flow
```
Sub Total (sum of all line items)
  - Discount (flat amount or percentage)
  = Net Amount
  + Tax (configurable percentage)
  = Total Amount
  - Insurance Coverage
  - Paid Amount
  = Balance Due
```

### Bill Types
- **Appointment Bill**: Auto-created from appointment with Doctor Fee + Hospital Charge
- **Test-Only Bill**: Standalone bill for medical tests without appointment

### Payment Status Lifecycle
```
UNPAID -> PARTIAL (partial payment) -> PAID (full payment)
PAID -> REFUNDED (refund processed)
```

---

## Getting Started

### Prerequisites

- **Java 17+** - [Download](https://adoptium.net/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **MySQL 8+** - [Download](https://dev.mysql.com/downloads/)
- **Maven 3.6+** - [Download](https://maven.apache.org/)
- **Groq API Key** (free) - [Get one](https://console.groq.com/)

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/PabinduAmodya/Hospital_System.git
cd Hospital_System
```

**2. Create the MySQL database**
```sql
CREATE DATABASE hospital_db;
```
> Schema is auto-created by Hibernate (`ddl-auto=update`).

**3. Configure `backend/src/main/resources/application.properties`**

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/hospital_db?createDatabaseIfNotExist=true
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD

# Gmail SMTP
spring.mail.username=YOUR_GMAIL@gmail.com
spring.mail.password=YOUR_16_CHAR_APP_PASSWORD
```

**4. Set the Groq API key** (see [Groq AI Setup](#groq-ai-setup))

**5. Run the backend**
```bash
cd backend
mvn spring-boot:run
```
API available at `http://localhost:8080`

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
App available at `http://localhost:5173`

---

### Groq AI Setup

The system uses **Groq** for AI-powered clinical visit summaries.

**1. Get a free API key**
- Go to [console.groq.com](https://console.groq.com/)
- Create an account and generate an API key

**2. Set the key** (choose one method):

**Option A: Environment variable** (recommended)
```bash
# Linux/Mac
export GROQ_API_KEY=gsk_your_key_here

# Windows (PowerShell)
$env:GROQ_API_KEY="gsk_your_key_here"

# Windows (CMD)
set GROQ_API_KEY=gsk_your_key_here
```

**Option B: Direct in application.properties**
```properties
groq.api.key=gsk_your_key_here
```

> **Note**: Never commit API keys to version control. Use environment variables in production.

---

### Email Configuration

The system uses **Gmail SMTP** for password reset and welcome emails.

**1. Enable 2-Step Verification** on your Google account

**2. Create an App Password**
- Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Create password for "Hospital HMS"
- Copy the 16-character code

**3. Update `application.properties`**
```properties
spring.mail.username=your.email@gmail.com
spring.mail.password=abcdefghijklmnop
```

**Testing with Maildrop.cc** (no real email needed):
- Send to any `name@maildrop.cc` address
- Read at `https://maildrop.cc/inbox/name`

---

## API Overview

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT + role + doctorId |
| POST | `/api/auth/register` | Public | Register new user |
| GET | `/api/auth/me` | Authenticated | Get current user profile |
| PUT | `/api/auth/me` | Authenticated | Update name/email |
| POST | `/api/auth/change-password` | Authenticated | Change password |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password` | Public | Apply new password |

### Patients & Doctors
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | `/api/patients` | Admin, Receptionist, Cashier |
| GET/PUT/DELETE | `/api/patients/{id}` | Admin, Receptionist |
| GET | `/api/patients/{id}/history` | All roles |
| GET/POST | `/api/doctors` | Admin, Receptionist |
| GET/PUT/DELETE | `/api/doctors/{id}` | Admin |
| GET | `/api/doctors/me` | Doctor |
| GET | `/api/doctors/me/appointments/today` | Doctor |
| GET | `/api/doctors/me/patients` | Doctor |

### Appointments
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/appointments/book` | Admin, Receptionist, Cashier |
| GET | `/api/appointments` | All roles |
| PUT | `/api/appointments/{id}/status` | All roles |
| PUT | `/api/appointments/{id}/cancel` | All roles |
| PUT | `/api/appointments/{id}/reschedule-to` | All roles |
| GET | `/api/appointments/{id}/available-dates` | All roles |
| GET | `/api/appointments/today` | All roles |
| GET | `/api/appointments/today/queue` | All roles |

### Billing
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/bills/appointment/{id}` | Admin, Cashier, Receptionist |
| POST | `/api/bills/patient/{id}/tests` | Admin, Cashier, Receptionist |
| POST | `/api/bills/{id}/payment` | Admin, Cashier |
| POST | `/api/bills/{id}/discount` | Admin, Cashier |
| POST | `/api/bills/{id}/insurance` | Admin, Cashier |
| POST | `/api/bills/{id}/refund` | Admin, Cashier |
| POST | `/api/bills/{id}/add-test/{testId}` | Admin, Cashier, Receptionist |
| GET | `/api/bills/due` | Admin, Cashier |
| GET | `/api/bills/search?q=` | Admin, Cashier, Receptionist |

### Consultations
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/consultations/start/{appointmentId}` | Doctor, Admin |
| POST | `/api/consultations/walk-in` | Doctor, Admin |
| PUT | `/api/consultations/{id}/vitals` | Doctor |
| PUT | `/api/consultations/{id}/clinical` | Doctor |
| POST | `/api/consultations/{id}/prescription` | Doctor |
| PUT | `/api/consultations/{id}/lab-orders` | Doctor |
| POST | `/api/consultations/{id}/generate-summary` | Doctor |
| POST | `/api/consultations/{id}/complete` | Doctor, Admin |
| GET | `/api/consultations/doctor/{id}/stats` | Doctor, Admin |

### Reports & Settings
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/reports/overview` | All roles |
| GET | `/api/reports/revenue` | Admin, Cashier |
| GET | `/api/reports/revenue/monthly` | Admin, Cashier |
| GET | `/api/reports/doctors/performance` | Admin |
| GET | `/api/audit-logs` | Admin |
| GET/PUT | `/api/master/hospital-info` | Admin |
| GET/PUT | `/api/master/hospital-charge` | Admin |
| GET/PUT | `/api/master/tax-rate` | Admin |
| GET/PUT | `/api/master/specializations` | Admin |
| GET/PUT | `/api/master/discount-reasons` | Admin |
| GET/PUT | `/api/master/payment-methods` | Admin |

---

## Database Schema

```
users                         patients                    doctors
+-- id                        +-- id                      +-- id
+-- name                      +-- name                    +-- name
+-- username (unique)         +-- phone                   +-- specialization
+-- password (BCrypt)         +-- email                   +-- phone
+-- role (ADMIN/RECEP/        +-- gender                  +-- email
|   CASHIER/DOCTOR)           +-- dob                     +-- channelling_fee
+-- email                                                 +-- schedules[]
+-- enabled
+-- doctor_id (FK)            schedules                   appointments
                              +-- id                      +-- id
                              +-- doctor_id (FK)          +-- patient_id (FK)
                              +-- day                     +-- schedule_id (FK)
                              +-- start_time              +-- appointment_date
                              +-- end_time                +-- token_number
                                                          +-- appointment_fee
bills                         bill_items                  +-- status
+-- id                        +-- id                      +-- payment_status
+-- bill_number (unique)      +-- bill_id (FK)            +-- paid_amount
+-- patient_id                +-- item_name               +-- notes
+-- appointment_id (FK)       +-- item_type
+-- bill_type                 +-- quantity                consultations
+-- sub_total                 +-- unit_price              +-- id
+-- discount_amount           +-- discount_amount         +-- consultation_number
+-- discount_percentage       +-- total_price             +-- appointment_id (FK)
+-- discount_reason           +-- description             +-- patient_id (FK)
+-- net_amount                                            +-- doctor_id (FK)
+-- tax_percentage            payments                    +-- status
+-- tax_amount                +-- id                      +-- vitals (BP, temp,
+-- total_amount              +-- bill_id (FK)            |   pulse, SpO2, etc.)
+-- paid_amount               +-- amount_paid             +-- chief_complaint
+-- due_amount                +-- payment_method          +-- diagnosis
+-- payment_status            +-- paid_at                 +-- ai_summary
+-- insurance_provider        +-- is_refund               +-- follow_up_date
+-- insurance_coverage        +-- refund_reason           +-- prescription_items[]
+-- created_by                                            +-- lab_orders
+-- paid_by                   prescription_items
                              +-- id
medical_tests                 +-- consultation_id (FK)    audit_logs
+-- id                        +-- drug_name               +-- id
+-- name                      +-- generic_name            +-- action
+-- type (LAB/XRAY/           +-- dosage                  +-- entity_type
|   SCAN/RADIOLOGY)           +-- frequency               +-- entity_id
+-- price                     +-- duration                +-- details
+-- description               +-- route                   +-- performed_by
+-- active                    +-- instructions             +-- performed_by_role
                              +-- dosage_form             +-- performed_at
system_settings               +-- from_database
+-- id                        +-- fda_ndc                 password_reset_tokens
+-- setting_key               +-- manufacturer            +-- id
+-- setting_value                                         +-- token (UUID)
+-- description                                           +-- user_id (FK)
                                                          +-- expires_at
                                                          +-- used
```

---

## Project Structure

```
Hospital_System/
|
+-- backend/
|   +-- src/main/java/com/hospital_system/hospital/
|   |   +-- controller/
|   |   |   +-- AuthController.java
|   |   |   +-- AdminController.java
|   |   |   +-- PatientController.java
|   |   |   +-- DoctorController.java
|   |   |   +-- ScheduleController.java
|   |   |   +-- AppointmentController.java
|   |   |   +-- BillController.java
|   |   |   +-- PaymentController.java
|   |   |   +-- MedicalTestController.java
|   |   |   +-- ConsultationController.java
|   |   |   +-- ReportController.java
|   |   |   +-- AuditLogController.java
|   |   |   +-- MasterDataController.java
|   |   |   +-- DashboardController.java
|   |   |   +-- PasswordResetController.java
|   |   +-- service/
|   |   |   +-- BillService.java
|   |   |   +-- ConsultationService.java
|   |   |   +-- GroqService.java
|   |   |   +-- ReportService.java
|   |   |   +-- AuditLogService.java
|   |   |   +-- (+ Patient, Doctor, Appointment, etc.)
|   |   +-- entity/
|   |   |   +-- Consultation.java
|   |   |   +-- PrescriptionItem.java
|   |   |   +-- Bill.java, BillItem.java
|   |   |   +-- AuditLog.java
|   |   |   +-- (+ Patient, Doctor, Appointment, etc.)
|   |   +-- repository/
|   |   +-- dto/
|   |   +-- security/ (JWT, SecurityConfig)
|   |   +-- enums/
|   |   +-- exception/
|   +-- src/main/resources/
|       +-- application.properties
|
+-- frontend/
|   +-- src/
|   |   +-- pages/
|   |   |   +-- Dashboard.jsx
|   |   |   +-- Patients.jsx
|   |   |   +-- Doctors.jsx
|   |   |   +-- Schedules.jsx
|   |   |   +-- Appointments.jsx
|   |   |   +-- Billing.jsx
|   |   |   +-- Tests.jsx
|   |   |   +-- Users.jsx
|   |   |   +-- Reports.jsx
|   |   |   +-- ActivityLog.jsx
|   |   |   +-- Masterdata.jsx
|   |   |   +-- Profile.jsx
|   |   |   +-- Login.jsx
|   |   |   +-- ResetPassword.jsx
|   |   |   +-- doctor/
|   |   |       +-- DoctorDashboard.jsx
|   |   |       +-- DoctorQueue.jsx
|   |   |       +-- Consultation.jsx
|   |   |       +-- ConsultationsList.jsx
|   |   |       +-- DoctorPatients.jsx
|   |   |       +-- DoctorSchedule.jsx
|   |   +-- components/
|   |   |   +-- Navbar.jsx
|   |   |   +-- Sidebar.jsx
|   |   |   +-- DoctorSidebar.jsx
|   |   |   +-- DrugSearch.jsx
|   |   |   +-- ui/ (Card, Modal, Button, Input, Select,
|   |   |         StatusBadge, StatCard, SearchBar,
|   |   |         Pagination, LoadingSpinner, EmptyState,
|   |   |         ConfirmDialog, Toast)
|   |   +-- layouts/
|   |   |   +-- DashboardLayout.jsx
|   |   |   +-- DoctorLayout.jsx
|   |   +-- api/
|   |   |   +-- axios.js
|   |   +-- utils/
|   |       +-- ProtectedRoute.jsx
|   |       +-- printPrescription.js
|   |       +-- printVisitSummary.js
|   +-- package.json
|   +-- vite.config.js
|   +-- tailwind.config.js
|
+-- README.md
```

---

## Default Credentials

> **Important:** Change all passwords after first login.

Register an admin user via the API:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","username":"admin","password":"admin123","role":"ADMIN"}'
```

### Creating a Doctor User

1. Create a doctor record first (via Admin > Doctors page)
2. Go to Admin > User Management
3. Click "Add New User"
4. Select role **DOCTOR** and link to the doctor record
5. The doctor can now log in and access the Doctor Portal

---

## Security Notes

- Passwords hashed with **BCrypt**
- JWT tokens expire after **24 hours**
- Password reset tokens are **single-use** (1 hour expiry)
- API keys stored as **environment variables** (never in code)
- Role-based access enforced at both route and API level
- Audit logging tracks all sensitive operations
- CORS configured for localhost development

---

## License

This project is for educational and portfolio purposes.

---

*Built with Spring Boot + React + Groq AI*

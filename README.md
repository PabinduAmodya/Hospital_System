# 🏥 Hospital Management System

A full-stack Hospital Management System built with **Spring Boot** (backend) and **React + Tailwind CSS** (frontend), featuring role-based access control, appointment booking, billing, medical tests, and email-based password reset.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Role-Based Access Control](#-role-based-access-control)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Email Configuration](#email-configuration)
- [API Overview](#-api-overview)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Default Credentials](#-default-credentials)

---

## ✨ Features

### 👥 User & Authentication
- JWT-based authentication with role-based access control
- Three roles: **Admin**, **Receptionist**, **Cashier**
- Profile page — edit name, email, change password
- **Password reset via email** (Gmail SMTP → Maildrop or any inbox)
- Welcome email with set-password link when admin creates a new user
- Single-use, time-limited reset tokens (1 hour for reset, 24 hours for welcome)

### 🧑‍⚕️ Patient Management
- Add, edit, delete patient records
- Fields: name, phone, email, gender, date of birth
- Filter by gender, search by any field
- Gender displayed as colored badge

### 👨‍⚕️ Doctor Management
- Add, edit, delete doctor records
- Fields: name, specialization, phone, email, channeling fee
- Specialization filter (from master data)
- Specialization displayed as colored badge

### 🗓 Schedule Management
- Assign doctors to day/time slots
- Filter by doctor and day of week
- Null-safe display (handles incomplete records gracefully)

### 📅 Appointment Booking
- 3-step booking wizard: select patient → select doctor → pick date/time
- Appointment status lifecycle: SCHEDULED → CONFIRMED → COMPLETED / CANCELLED
- Payment status tracking: UNPAID → PAID
- Filter by status, date range, doctor

### 💳 Billing
- Auto-generate bills on appointment confirmation
- Bills split into line items: Doctor Fee + Hospital Charge + Medical Tests
- Add/remove medical tests from unpaid bills
- **Standalone test-only bills** (no appointment required)
- Pay bills with method: CASH / CARD / ONLINE
- Print professional HTML receipt
- Filter by paid/unpaid and bill type (Appointment / Test Only)

### 🧪 Medical Tests
- Manage test catalogue (LAB, XRAY, SCAN, OTHER)
- Activate / deactivate tests (soft delete)
- Edit test name, type, price, description
- Filter by type, show/hide inactive tests

### ⚙️ Master Data Settings *(Admin only)*
- Configure hospital charge (added to every appointment bill)
- Manage specialization list (add/remove)
- Settings persist in database — no hardcoded values

### 📊 Dashboard
- Live stats: total patients, doctors, appointments, revenue
- Daily revenue bar chart (7 / 14 / 30 day range)
- Pending bills counter

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Language |
| Spring Boot | 3.2.0 | Framework |
| Spring Security | 6.2.0 | Auth & RBAC |
| Spring Data JPA | 3.2.0 | ORM |
| Hibernate | 6.3.1 | JPA implementation |
| MySQL | 8.x | Database |
| JWT (jjwt) | 0.11.5 | Token auth |
| Spring Mail | 3.2.0 | Email sending |
| Maven | 3.x | Build tool |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool |
| React Router | 6.x | Routing |
| Tailwind CSS | 3.x | Styling |
| Axios | 1.x | HTTP client |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│              (Vite + Tailwind CSS + Axios)               │
│                   localhost:5173                         │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP / REST API
                      │ JWT Bearer Token
┌─────────────────────▼───────────────────────────────────┐
│                  Spring Boot Backend                      │
│                    localhost:8080                         │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Controllers │  │   Services   │  │  Repositories  │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Spring Security + JWT Filter           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ JPA / Hibernate
┌─────────────────────▼───────────────────────────────────┐
│                    MySQL Database                         │
│                   hospital_db                            │
└─────────────────────────────────────────────────────────┘
                      │ SMTP
┌─────────────────────▼───────────────────────────────────┐
│              Gmail SMTP → Any Email Inbox                 │
│         (Maildrop.cc for local testing)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Role-Based Access Control

| Feature | Admin | Receptionist | Cashier |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Patients (view/add) | ✅ | ✅ | ❌ |
| Patients (delete) | ✅ | ❌ | ❌ |
| Doctors (view/add) | ✅ | ✅ | ❌ |
| Doctors (delete) | ✅ | ❌ | ❌ |
| Schedules | ✅ | ✅ | ❌ |
| Appointments | ✅ | ✅ | ✅ |
| Billing | ✅ | ❌ | ✅ |
| Add tests to bill | ✅ | ✅ | ✅ |
| Medical Tests (view) | ✅ | ✅ | ✅ |
| Medical Tests (manage) | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| My Profile | ✅ | ✅ | ✅ |

---

## 🚀 Getting Started

### Prerequisites

- **Java 17+** — [Download](https://adoptium.net/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **MySQL 8+** — [Download](https://dev.mysql.com/downloads/)
- **Maven 3.6+** — [Download](https://maven.apache.org/)
- **IntelliJ IDEA** or any IDE (recommended)

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/your-username/hospital-management-system.git
cd hospital-management-system
```

**2. Create the MySQL database**
```sql
CREATE DATABASE hospital_db;
```
> The schema is auto-created by Hibernate (`spring.jpa.hibernate.ddl-auto=update`). No SQL scripts needed.

**3. Configure `application.properties`**

Navigate to `backend/src/main/resources/application.properties` and update:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/hospital_db?createDatabaseIfNotExist=true
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD

# Gmail SMTP (see Email Configuration section below)
spring.mail.username=YOUR_GMAIL@gmail.com
spring.mail.password=YOUR_16_CHAR_APP_PASSWORD
```

**4. Run the backend**
```bash
cd backend
mvn spring-boot:run
```
Or open in IntelliJ and run `HospitalApplication.java`.

The API will be available at `http://localhost:8080`.

---

### Frontend Setup

**1. Install dependencies**
```bash
cd frontend
npm install
```

**2. Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

> The frontend proxies API calls to `http://localhost:8080/api` via Axios base URL config.

---

### Email Configuration

The system uses **Gmail SMTP** to send password reset and welcome emails. You must use a **Gmail App Password** — your regular Gmail password will not work.

**Step 1 — Enable 2-Step Verification**
1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already on

**Step 2 — Create an App Password**
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Name it `Hospital HMS` → click **Create**
3. Copy the **16-character code** shown (e.g. `abcd efgh ijkl mnop`)

**Step 3 — Update properties**
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your.email@gmail.com
spring.mail.password=abcdefghijklmnop   # 16-char app password, no spaces
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Testing with Maildrop.cc (no real email needed)**

Send to any `name@maildrop.cc` address and read the inbox at:
```
https://maildrop.cc/inbox/name
```
No signup required. Perfect for local development.

---

## 📡 API Overview

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Authenticated | Get current user profile |
| PUT | `/api/auth/me` | Authenticated | Update name/email |
| POST | `/api/auth/change-password` | Authenticated | Change password (requires current) |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| GET | `/api/auth/reset-password/validate` | Public | Validate reset token |
| POST | `/api/auth/reset-password` | Public | Apply new password |

### Core Resources
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET/POST | `/api/patients` | Admin, Receptionist | List / create patients |
| PUT/DELETE | `/api/patients/{id}` | Admin, Receptionist | Update / delete patient |
| GET/POST | `/api/doctors` | Admin, Receptionist | List / create doctors |
| GET/POST | `/api/schedules` | Admin, Receptionist | List / create schedules |
| GET/POST | `/api/appointments` | All roles | List / create appointments |
| GET/POST | `/api/bills` | Admin, Cashier | List / create bills |
| POST | `/api/bills/appointment/{id}` | All roles | Create bill from appointment |
| POST | `/api/bills/patient/{id}/tests` | All roles | Create standalone test bill |
| POST | `/api/bills/{id}/pay` | Admin, Cashier | Mark bill as paid |
| GET/POST | `/api/tests` | Admin, Receptionist | List / create medical tests |
| GET/PUT | `/api/master/specializations` | Admin | Manage specializations |
| GET/PUT | `/api/master/hospital-charge` | Admin | Manage hospital charge |
| GET/POST/DELETE | `/api/admin/users` | Admin only | User management |

### Authentication Header
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## 🗄 Database Schema

```
users                    patients
├── id                   ├── id
├── name                 ├── name
├── username             ├── phone
├── password (BCrypt)    ├── email
├── role (enum)          ├── gender
├── email                └── dob
└── enabled
                         doctors
password_reset_tokens    ├── id
├── id                   ├── name
├── token (UUID)         ├── specialization
├── user_id (FK)         ├── phone
├── expires_at           ├── email
└── used                 └── channeling_fee

schedules                appointments
├── id                   ├── id
├── doctor_id (FK)       ├── patient_id (FK)
├── day                  ├── schedule_id (FK)
├── start_time           ├── appointment_date
└── end_time             ├── appointment_fee
                         ├── status (enum)
bills                    ├── payment_status
├── id                   ├── paid_amount
├── patient_name         └── paid_at
├── patient_id
├── appointment_id (FK)  bill_items
├── bill_type            ├── id
├── total_amount         ├── bill_id (FK)
├── paid                 ├── item_name
├── payment_method       ├── item_type
└── paid_at              └── price

medical_tests            system_settings
├── id                   ├── id
├── name                 ├── setting_key
├── type (enum)          ├── setting_value
├── price                └── description
└── active
```

---

## 📁 Project Structure

```
hospital-management-system/
│
├── backend/
│   └── src/main/java/com/hospital_system/hospital/
│       ├── controller/          # REST controllers
│       │   ├── AuthController.java
│       │   ├── AdminController.java
│       │   ├── PatientController.java
│       │   ├── DoctorController.java
│       │   ├── ScheduleController.java
│       │   ├── AppointmentController.java
│       │   ├── BillController.java
│       │   ├── MedicalTestController.java
│       │   ├── MasterDataController.java
│       │   ├── DashboardController.java
│       │   └── PasswordResetController.java
│       ├── service/             # Business logic
│       ├── repository/          # JPA repositories
│       ├── entity/              # JPA entities
│       ├── dto/                 # Data transfer objects
│       ├── security/            # JWT filter, SecurityConfig
│       └── enums/               # Role, Status enums
│
├── frontend/
│   └── src/
│       ├── pages/               # Page components
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Patients.jsx
│       │   ├── Doctors.jsx
│       │   ├── Schedules.jsx
│       │   ├── Appointments.jsx
│       │   ├── Billing.jsx
│       │   ├── Tests.jsx
│       │   ├── Users.jsx
│       │   ├── Profile.jsx
│       │   ├── MasterData.jsx
│       │   └── ResetPassword.jsx
│       ├── components/
│       │   ├── ui/              # Reusable UI components
│       │   └── Navbar.jsx
│       │   └── Sidebar.jsx
│       ├── layouts/
│       │   └── DashboardLayout.jsx
│       ├── api/
│       │   └── axios.js         # Axios instance with JWT interceptor
│       └── utils/
│           └── ProtectedRoute.jsx
│
└── README.md
```

---

## 🔑 Default Credentials

> **Important:** Change all passwords immediately after first login.

When you first run the application, create an admin user by calling the register endpoint or inserting directly into the database:

```sql
-- Insert default admin (password: admin123)
INSERT INTO users (name, username, password, role, enabled)
VALUES (
  'System Admin',
  'admin',
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH',
  'ADMIN',
  1
);
```

Or use the `/api/auth/register` endpoint (available in development):
```json
{
  "name": "System Admin",
  "username": "admin",
  "password": "admin123",
  "role": "ADMIN"
}
```

---

## 🔒 Security Notes

- Passwords are hashed with **BCrypt**
- JWT tokens expire after **24 hours**
- Password reset tokens are **single-use** and expire after **1 hour**
- Welcome email tokens expire after **24 hours**
- Delete operations on patients/doctors are restricted to **ADMIN** role only
- Never commit real passwords or App Passwords to version control — use environment variables in production

---

## 📄 License

This project is for educational and portfolio purposes.

---

*Built with ❤️ using Spring Boot + React*

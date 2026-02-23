# 🏥 Hospital Management System

A full-stack Hospital Management System built with **Spring Boot (Backend)** and **React + Vite (Frontend)** to manage hospital operations such as patients, doctors, appointments, billing, schedules, and authentication.

--

## 🚀 Features

### 👨‍⚕️ Doctor Management

* Add / update / delete doctors
* View doctor details
* Specialization tracking

### 🧑‍🤝‍🧑 Patient Management

* Register patients
* Update patient records
* View patient history

### 📅 Appointment Management

* Book appointments
* Update status (Pending, Confirmed, Completed, Cancelled)
* Cancel appointments
* Reschedule appointments
* Track payments

### 💳 Billing & Payments

* Record payments
* Track billing information

### 🔐 Authentication & Authorization

* JWT authentication
* Role-based access (Admin, Receptionist, Cashier)

---

## 🛠 Tech Stack

### Backend

* Java 17
* Spring Boot
* Spring Security (JWT)
* Spring Data JPA
* MySQL
* Maven

### Frontend

* React
* Vite
* Axios
* Tailwind CSS
* React Router

---

## 📂 Project Structure

```
Hospital_System/
│
├── backend/        → Spring Boot API
├── frontend/       → React frontend
└── README.md
```

---

## ⚙️ Setup Instructions

### 🔹 Backend Setup

1. Navigate to backend folder:

```
cd backend
```

2. Configure database in:

```
application.properties
```

Example:

```
spring.datasource.url=jdbc:mysql://localhost:3306/hospital_db
spring.datasource.username=root
spring.datasource.password=your_password
```

3. Run backend:

```
mvn spring-boot:run
```

Backend runs on:

```
http://localhost:8080
```

---

### 🔹 Frontend Setup

1. Navigate to frontend:

```
cd frontend
```

2. Install dependencies:

```
npm install
```

3. Run app:

```
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔑 Default Roles

* ADMIN → Full access
* RECEPTIONIST → Appointments & patients
* CASHIER → Payments

---

## 🌐 API Base URL

```
http://localhost:8080/api
```

---

## 📌 Future Improvements

* Reports dashboard
* Email notifications
* Online appointment portal
* Deployment to cloud
* Audit logs
* Analytics

---


## ⭐ How to Run Full System

1. Start MySQL
2. Run backend
3. Run frontend
4. Login and manage hospital data

---

## 📜 License

This project is for educational purposes.

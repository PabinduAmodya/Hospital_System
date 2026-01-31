

# 🏥 Hospital Management System – Backend API

A **Spring Boot + Spring Security + JWT + JPA** based RESTful backend for a **Hospital Management System**.

This system provides secure role-based access for managing:

✅ Users & Authentication
✅ Patients
✅ Doctors & Schedules
✅ Appointments
✅ Bills & Payments
✅ Medical Tests

Built with **clean layered architecture (Controller → Service → Repository)** and **JWT authentication**.

---

# 🚀 Tech Stack

* Java 17+
* Spring Boot
* Spring Security (JWT Authentication)
* Spring Data JPA (Hibernate)
* MySQL / PostgreSQL (or any JPA-supported DB)
* Maven
* REST APIs

---

# 🔐 Authentication & Security

This project uses:

* JWT Token Authentication
* Role-based Authorization
* Stateless Sessions
* BCrypt password encryption

### Roles

| Role         | Permissions                                |
| ------------ | ------------------------------------------ |
| ADMIN        | Full system access                         |
| RECEPTIONIST | Patients, Doctors, Schedules, Appointments |
| CASHIER      | Bills, Payments                            |

---

# 📁 Project Structure

```
hospital/
 ┣ controller/
 ┣ service/
 ┣ repository/
 ┣ entity/
 ┣ dto/
 ┣ security/
 ┣ enums/
 ┗ config/
```

### Layers

* **Controller** → REST endpoints
* **Service** → Business logic
* **Repository** → Database access
* **Security** → JWT + Spring Security config

---

# ⚙️ Setup & Installation

## 1️⃣ Clone repo

```bash
git clone https://github.com/your-username/hospital-backend.git
cd hospital-backend
```

## 2️⃣ Configure database

Edit:

```
src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/hospital_db
spring.datasource.username=root
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

jwt.secret=your_secret_key
jwt.expiration=86400000
```

---

## 3️⃣ Run application

### Maven

```bash
mvn spring-boot:run
```

### or

```bash
mvn clean install
java -jar target/*.jar
```

Server runs on:

```
http://localhost:8080
```

---

# 🔑 Authentication Flow

## Register

```
POST /api/auth/register
```

### Body

```json
{
  "name": "Admin User",
  "username": "admin",
  "password": "1234",
  "role": "ADMIN"
}
```

---

## Login

```
POST /api/auth/login
```

### Response

```json
{
  "token": "JWT_TOKEN",
  "username": "admin",
  "role": "ADMIN",
  "message": "Login successful"
}
```

---

## Use token

Add header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

# 📌 API Endpoints

---

## 👤 Auth

| Method | Endpoint             |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |

---

## 🧑‍⚕️ Admin

| Method | Endpoint                       |
| ------ | ------------------------------ |
| GET    | `/api/admin/users`             |
| POST   | `/api/admin/users`             |
| DELETE | `/api/admin/users/{id}`        |
| GET    | `/api/admin/users/role/{role}` |

---

## 👨‍⚕️ Doctors

| Method | Endpoint            |
| ------ | ------------------- |
| POST   | `/api/doctors/add`  |
| GET    | `/api/doctors`      |
| GET    | `/api/doctors/{id}` |

---

## 📅 Schedules

| Method | Endpoint                    |
| ------ | --------------------------- |
| POST   | `/api/schedules/add`        |
| GET    | `/api/schedules/{doctorId}` |
| DELETE | `/api/schedules/{id}`       |

---

## 🧍 Patients

| Method | Endpoint                 |
| ------ | ------------------------ |
| POST   | `/api/patients/register` |
| GET    | `/api/patients`          |
| GET    | `/api/patients/{id}`     |

---

## 📆 Appointments

| Method | Endpoint                                |
| ------ | --------------------------------------- |
| POST   | `/api/appointments/book`                |
| GET    | `/api/appointments`                     |
| GET    | `/api/appointments/{id}`                |
| PUT    | `/api/appointments/{id}/status`         |
| PUT    | `/api/appointments/{id}/cancel`         |
| POST   | `/api/appointments/{id}/payment`        |
| PUT    | `/api/appointments/{id}/reschedule`     |
| GET    | `/api/appointments/status/{status}`     |
| GET    | `/api/appointments/today`               |
| GET    | `/api/appointments/patient/{patientId}` |
| GET    | `/api/appointments/doctor/{doctorId}`   |

---

## 🧪 Medical Tests

| Method | Endpoint                 |
| ------ | ------------------------ |
| POST   | `/api/tests`             |
| GET    | `/api/tests`             |
| GET    | `/api/tests/type/{type}` |

---

## 💳 Bills

| Method | Endpoint                |
| ------ | ----------------------- |
| POST   | `/api/bill/create`      |
| GET    | `/api/bill/all`         |
| DELETE | `/api/bill/delete/{id}` |

---

## 💰 Payments

| Method | Endpoint              |
| ------ | --------------------- |
| POST   | `/api/payment/create` |
| GET    | `/api/payment/all`    |

---

# 🗄️ Database Entities

* User
* Role
* Patient
* Doctor
* Schedule
* Appointment
* MedicalTest
* Bill
* Payment

---

# ✨ Features

✔ JWT Authentication
✔ Role-based security
✔ Doctor scheduling
✔ Appointment booking
✔ Payment tracking
✔ Medical test management
✔ Clean REST APIs
✔ Scalable architecture



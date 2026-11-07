# ✈️ Kalyan Travels

A modern, full-stack travel booking platform for discovering, booking, and managing flights and hotels worldwide.

![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38B2AC?logo=tailwind-css)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.1-6DB33F?logo=springboot)
![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)

---

## 🌟 Key Features

- 🛫 **Flight Search & Booking**: Search domestic and international flights with real-time seat selection, interactive cabin seat map, and dynamic pricing.
- 🏨 **Hotel Reservations**: Discover luxury resorts and hotels with room tier selection (Standard, Deluxe, Executive Suite), amenity breakdown, and guest reviews.
- 💳 **Interactive Payment Gateway**: Multi-payment dialog supporting:
  - **Credit / Debit Cards** (Card number formatting, expiry, CVV validation)
  - **UPI** (VPA address with quick handles `@okhdfcbank`, `@oksbi`, `@okaxis`, `@ybl`)
  - **Net Banking** (Major Indian banks, account number & IFSC input)
- 🔄 **Real-Time Refund Tracker**: Visual 3-stage cancellation workflow (*Refund Initiated* → *Processing* → *Completed*) with dynamic timeline updates.
- 👤 **User Profiles & History**: Complete booking history, cancellation management, and account preferences with instant local and cloud sync.
- ⚡ **High Performance**: 0ms instant initial rendering, parallel backend hydration, and client-side failover support.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: Next.js (Pages Router) + React 19
- **State Management**: Redux Toolkit + LocalStorage persistence
- **Styling**: Tailwind CSS + Radix UI Primitives + Lucide Icons
- **Deployment**: [Vercel](https://vercel.com)

### Backend
- **Framework**: Spring Boot 3.4.1 (Java 17)
- **Database**: MongoDB Atlas
- **Security**: Spring Security & CORS configuration
- **Containerization**: Multi-stage Docker build
- **Deployment**: [Render](https://render.com)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm
- Java JDK 17+
- Maven 3.9+

### Frontend Setup

```bash
cd makemytour
npm install
npm run dev
```

The frontend will run on [http://localhost:3000](http://localhost:3000).

### Backend Setup

```bash
# In repository root
./mvnw spring-boot:run
```

The backend server will run on [http://localhost:8080](http://localhost:8080).

---

## 🌐 Deployment Configuration

### Environment Variables

#### Frontend (Vercel)
- `NEXT_PUBLIC_BACKEND_URL`: URL of your live backend (e.g. `https://kalyan-travels-backend.onrender.com`)

#### Backend (Render / Docker)
- `PORT`: Automatically assigned by Render (defaults to `8080`)
- `spring.data.mongodb.uri`: MongoDB Atlas connection string

---

## 📄 License
MIT License. Built with ❤️ for travelers by Kalyan.

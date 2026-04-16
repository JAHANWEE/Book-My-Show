# TicketBaazi — Movie Ticket Booking Platform

A full-stack movie ticket booking application built with Node.js, Express, PostgreSQL, and vanilla JS.

---

## Features

- Browse 9 movies with real posters and multiple show timings
- Theatre-style seat selection layout (fan/arc shape, 100 seats per show)
- Seats are unique per movie and per showtime
- Select up to 4 seats per booking
- Name dialog for each seat — primary name required, rest optional
- JWT-based authentication with register and login
- Guest login with pre-seeded credentials
- My Bookings page with animated stacked ticket deck (expandable per booking)
- Rate limiting on auth routes
- Database auto-migrates and seeds on server start

---

## Tech Stack

| Layer    | Tech Stack                        |
|----------|-----------------------------------|
| Backend  | Node.js, Express 5, ESM           |
| Database | PostgreSQL 16 (Docker)            |
| Auth     | JWT, bcryptjs, Zod validation     |
| Frontend | Vanilla JS, raw CSS, Inter + Bebas Neue fonts |
| DevOps   | Docker Compose                    |

---

## Project Structure

```
.
├── db/
│   ├── pool.js          # PostgreSQL connection pool
│   └── migrate.js       # Schema creation + seeding (runs on startup)
├── middleware/
│   └── auth.js          # JWT verification middleware
├── routes/
│   ├── auth.js          # POST /auth/register, POST /auth/login
│   ├── seats.js         # GET /seats, POST /seats/book
│   └── bookings.js      # GET /bookings
├── public/
│   └── assets/          # Movie poster images
├── src/
│   ├── script.js        # Frontend SPA logic
│   └── style.css        # All styles
├── index.html           # Single HTML shell
├── index.mjs            # Express app entry point
├── docker-compose.yml
└── .env
```

---

## Database Schema

```sql
users
  id, email, password, created_at

seats
  id, movie_id, show_time, seat_no, isbooked
  UNIQUE (movie_id, show_time, seat_no)

bookings
  id, user_id, movie_id, show_time, seat_nos[], names[], booked_at

booking_seats
  id, booking_id, seat_id, seat_no, name
```

Seats are seeded automatically: 100 seats x 9 movies x 4 showtimes = 3600 rows.

---

## Getting Started

### 1. Start the database

```bash
docker-compose up -d
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=jaani
DB_PASSWORD=youarethepassword
DB_NAME=mydb
JWT_SECRET=your_secret_here
PORT=8080
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
npm run dev
```

The server runs migrations and seeds the database automatically on startup.

Open `http://localhost:8080`.

---

## API Reference

### Auth

| Method | Endpoint         | Auth | Description          |
|--------|-----------------|------|----------------------|
| POST   | /auth/register  | No   | Register new user    |
| POST   | /auth/login     | No   | Login, returns JWT   |

Register validation (Zod): valid email, min 8 chars, uppercase, number, special character.

### Seats

| Method | Endpoint                        | Auth | Description                        |
|--------|---------------------------------|------|------------------------------------|
| GET    | /seats?movieId=&showTime=       | No   | Fetch seats for a movie + showtime |
| POST   | /seats/book                     | Yes  | Book multiple seats atomically     |

POST /seats/book body:
```json
{
  "seatIds": [12, 13],
  "names": ["Alice", "Bob"]
}
```

### Bookings

| Method | Endpoint   | Auth | Description                        |
|--------|-----------|------|------------------------------------|
| GET    | /bookings  | Yes  | Get all bookings for logged-in user |

---

## Guest Access

Email: `guest@ticketbaazi.com`  
Password: `Guest@1234`

The guest account is created automatically on first server start.

---

## Notes

- Booking uses `SELECT ... FOR UPDATE` inside a transaction to prevent race conditions and double bookings.
- Auth routes are rate-limited to 10 requests per 15 minutes per IP.
- The frontend is a single-page app with no framework — all routing is done in JS.

# Smart Attendance System (Face + QR Hybrid)

Production-ready MERN starter for a **Smart Attendance System** using:

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Auth**: JWT (roles: **admin**, **student**)
- **Attendance**: Daily **QR session** (expires in 5 minutes) + duplicate prevention
- **Admin**: Summary + trends chart + export to **XLSX/CSV**
- **Bonus**: Face verification endpoint placeholder (OpenCV integration later)

## Project structure

```text
attandence/
  client/
    src/
      components/
        Navbar.jsx
        ProtectedRoute.jsx
        QrScanner.jsx
      context/
        AuthContext.jsx
      lib/
        api.js
      pages/
        AdminDashboard.jsx
        Home.jsx
        Login.jsx
        Register.jsx
        StudentDashboard.jsx
      App.jsx
      main.jsx
      index.css
    .env.example
    package.json
    tailwind.config.js
    postcss.config.js
  server/
    src/
      config/
        db.js
      controllers/
        adminController.js
        attendanceController.js
        authController.js
        faceController.js
        sessionController.js
      middleware/
        auth.js
        error.js
      models/
        Attendance.js
        Session.js
        User.js
      routes/
        adminRoutes.js
        attendanceRoutes.js
        authRoutes.js
        faceRoutes.js
        sessionRoutes.js
      utils/
        date.js
      index.js
    .env.example
    package.json
  package.json
```

## MongoDB Atlas setup (step-by-step)

1. **Create an Atlas account**
   - Go to MongoDB Atlas and create an account.

2. **Create a project + cluster**
   - Build a new project
   - Create a cluster (the free tier is fine for development)

3. **Create a database user**
   - Go to **Database Access**
   - Add a new user (username + password)

4. **Whitelist your IP**
   - Go to **Network Access**
   - Add IP address:
     - For development: `0.0.0.0/0` (allow from anywhere)
     - For production: use your server’s fixed IP(s)

5. **Get your connection string**
   - Go to your cluster → **Connect**
   - Choose **Drivers**
   - Copy the connection string (MongoDB URI)
   - Replace `<username>`, `<password>`, and the database name

Example:

```text
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smart_attendance?retryWrites=true&w=majority
```

## Environment variables

### Backend (`server/.env`)

Create `server/.env` (copy from `server/.env.example`):

```env
PORT=5000
MONGODB_URI=your_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
ADMIN_BOOTSTRAP_SECRET=choose_a_secret
# CORS_ORIGIN=http://localhost:5173
```

### Frontend (`client/.env`)

Create `client/.env` (copy from `client/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

## Run instructions

### Option A: Run both with one command (recommended)

From the project root:

```bash
npm install
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### Option B: Run separately

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

## How QR attendance works

- Admin clicks **Generate** to create a QR session.
- QR payload includes `sessionId` + `issuedAt` (timestamp).
- Backend stores the session with an **expiry time (5 minutes)**.
- Student scans QR → frontend sends `scannedData` to `POST /api/attendance/mark`.
- Backend validates:
  - session exists
  - session not expired
  - payload matches session window
  - **duplicate attendance is blocked** using a unique database index.

## API overview

- `POST /api/auth/register` (role defaults to student; admin only with `x-admin-secret`)
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/sessions/generate` (admin)
- `GET /api/sessions/active` (admin)
- `POST /api/attendance/mark` (student)
- `GET /api/attendance/my` (student)
- `GET /api/admin/summary` (admin)
- `GET /api/admin/trends` (admin)
- `GET /api/admin/attendance` (admin)
- `GET /api/admin/export` (admin)
- `POST /api/face/verify` (placeholder)

## Future enhancements

- Face recognition / liveness detection (OpenCV or hosted model)
- Student profile images + embeddings storage
- Multi-class/section support and lecture schedules
- Better analytics (late arrivals, heatmaps)
- Deployment: Docker + CI + production CORS + HTTPS

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


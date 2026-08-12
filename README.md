# IIT Prep Tracker - JEE Preparation Tracker

A full-stack web application designed for parents to monitor and students to track their 11th & 12th grade IIT-JEE preparation. 

Students can log daily study hours, problems solved, and difficulty notes. Parents can link to multiple students using unique student codes, set weekly tests, assign custom syllabus materials, and view interactive performance charts (accuracy trends, subject distributions, and a GitHub-like daily contribution heatmap).

---

## Technical Stack

- **Frontend**: React (Vite) + Vanilla CSS (Custom modern dark theme & glassmorphism layout) + Lucide Icons + Recharts
- **Backend**: Node.js + Express
- **Database**: SQLite (`sqlite3` for zero-configuration, local relational storage)
- **Authentication**: JWT (JSON Web Tokens) with route guards for Student/Parent roles
- **File Uploads**: Local storage serving (handled via Multer in Express)

---

## Directory Structure

```text
d:/Bross/
├── backend/
│   ├── database/
│   │   ├── db.js             # SQLite helpers and promise wrappers
│   │   ├── database.db       # Generated SQLite database file
│   │   ├── schema.sql        # Database tables
│   │   └── seed.js           # Complete seeded 11th/12th IIT JEE syllabus
│   ├── middleware/
│   │   └── auth.js           # JWT validation & role guard middleware
│   ├── routes/
│   │   ├── auth.js           # Signup, login, profile routes
│   │   ├── student.js        # Daily logs, streaks, and test results submissions
│   │   └── parent.js         # Linking, assignments, test creations, and analytics
│   ├── public/uploads/       # Folder for uploaded PDF question sheets & answer sheets
│   ├── server.js             # Main Express server entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Common layouts (Navbar, ProtectedRoute)
│   │   ├── pages/            # Viewports (Login, Dashboards, Syllabus, Logs, Tests)
│   │   ├── utils/api.js      # Client API endpoints and fetch wrapper
│   │   ├── index.css         # Styling system & theme custom properties
│   │   └── App.jsx           # App routes and configuration
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Installation & Setup

Make sure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### 1. Setup Backend
Open a terminal in the `backend/` directory:
```bash
cd backend
npm install
```

### 2. Seed Database
Initialize and seed the SQLite database with the standard 11th & 12th grade IIT-JEE syllabus (Physics, Chemistry, Maths):
```bash
npm run seed
```
This creates the SQLite database file at `backend/database/database.db` and populates the `subjects`, `syllabus_chapters`, and `syllabus_topics` tables.

### 3. Setup Frontend
Open another terminal in the `frontend/` directory:
```bash
cd frontend
npm install
```

---

## Running Locally

### 1. Start Backend API Server
In the `backend/` terminal:
```bash
npm start
```
The server will run on `http://localhost:5000`. It will automatically serve uploaded files from `http://localhost:5000/uploads/...`.

### 2. Start Frontend Development Server
In the `frontend/` terminal:
```bash
npm run dev
```
The React development server will start (usually on `http://localhost:5173`). Open this URL in your web browser.

---

## Environment Variables

By default, the application runs out of the box using default parameters. If you wish to configure them, you can set the following in the backend:
- `PORT`: Port for backend server (defaults to `5000`)
- `JWT_SECRET`: Custom secret key for signing auth tokens (defaults to `iit_prep_tracker_secret_key_2026`)

---

## Features Walkthrough

### 1. Student Code Linking Flow
- **Student Registration**: When a student registers, they specify their class level (11th or 12th). The backend automatically generates a unique, unguessable, case-insensitive linking code (e.g., `IIT-H8F2A9`).
- **Parent Registration**: Parents register with just basic credentials (no student info needed).
- **Linking**: The parent dashboard has an "Add Student" section. Entering the student code links the profiles. One parent can link multiple students (which populates a child selector dropdown). One student can also be linked to multiple parent profiles (e.g. mother and father).

### 2. Syllabus Completion Tracker
- **Standard Syllabus**: Seeded with full IIT-JEE chapters & sub-topics.
- **Progress Tracking**: Students can mark individual sub-topics as `Not Started`, `In Progress`, `Completed`, or `Revision Done`.
- **Targeted Uploads**: Parents can assign custom tasks or upload homework files (PDFs/Images) targeting specific children. These appear instantly under the student's "Assignments" tab with a "New from Parent" badge.

### 3. Daily Study Logging & Streak
- **30-Second Log**: Students can quickly log their daily study sessions. They select a subject/chapter, enter total questions solved, correct self-checks, study duration, and doubt descriptions.
- **Streak Calculation**: Calculates the consecutive days logged. If a student misses logging for both today and yesterday, the streak resets.

### 4. Weekly Practice Tests & prep checklist
- **Parent Test Creation**: Parents can create weekly assessments, define total marks, target date, select scope chapters, and attach question sheet PDFs.
- **Prep Checklist**: The student's test list displays the test's scope. It compares the chapters in the test scope against the student's syllabus progress. It warns them about "Not Started" or "In Progress" topics within the test scope.
- **Score Submissions**: Students take the test and upload their scores, subject-wise breakdowns, weak areas notes, and photos/scans of their answer sheets. Scores and uploads reflect instantly on the parent dashboard.

### 5. Parent Visual Insights
- **Inactivity Warning**: Flags students with no logged activity in the last 3 days.
- **Subject Weakness Flag**: Flags subjects where the student's weekly test score average is below 60%.
- **GitHub Heatmap Grid**: Renders a daily contribution block grid showing problem-solving volumes over the last 365 days.
- **Analytics Charts**: Renders line/bar charts for weekly test scores and daily question volumes, and a pie chart showing time spent across subjects.

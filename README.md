# IIT Prep Progress Tracker

A full-stack web application designed for parents to monitor and support their children's Intermediate (11th & 12th Grade) IIT-JEE preparation. 

Built using a **professional white Google Material 3 (Material You)** aesthetic, this app provides two distinct role portals (Parent and Student) connected through a secure student linking code system.

---

## 🌟 Key Product Features

### 1. Security & Brute-Force Protection
* **Unique Student Codes**: When students register, a unique, secure, alphanumeric Student Code (e.g. `IIT-7F3K9Q`) is generated.
* **Brute-Force Protection**: Restricts parents from guessing codes; after 5 failed link attempts, the parent account is locked from entering codes for 15 minutes.

### 2. Multi-Class Syllabus & Progress Tracker
* **Subject-Wise Syllabus Checklist**: A pre-seeded comprehensive list of topics across Mathematics, Physics, and Chemistry for both Class 11 and Class 12.
* **Class Switcher Toggle**: Students can easily toggle between Class 11 and 12 syllabus lists to mark items as *Not Started*, *In Progress*, *Completed*, or *Needs Revision*.
* **Granular Metrics**: Displays progress bars representing Class 11 completion, Class 12 completion, and Combined overall completion.

### 3. Detailed Daily Study Logs
* **Practice Accuracy Self-Check**: Students log daily study hours, topic notes, and practice metrics (Problems Solved vs Problems Correct), automatically computing accuracy rates (%).
* **Activity Heatmap**: A GitHub-style daily activity tracker rendering student study logs history visually for parents.

### 4. Consolidated Weekly Test Analytics & Self-Testing
* **Detailed Score Submissions**: Students submit test results specifying duration taken (minutes), weak area notes, answer sheet scans (PDF/Images), and subject-wise score breakdowns (Marks, Max Marks, Correct, Incorrect, Unattempted).
* **Self-Logged / Mock Exams**: Students can log external tests taken at coaching centers or self-practice tests, including exam dates, total marks, and subject scopes.
* **Test Syllabus Preparedness**: Automatically computes preparation levels (0% to 100%) for assigned tests by comparing chapters in the test scope to student topic completion.
* **Low Score & Inactivity Warnings**: Alerts parents via the dashboard if their child has logged no study activity for over 3 days, or if they score below 50% on their latest test.
* **Syllabus Areas Needing Improvement**: Displays chapters with less than 50% completion on both parent and student dashboards.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React.js (Vite) + Lucide Icons + Recharts (Multi-line and Stacked Bar graphs)
- **Styling**: Google Material 3 Design System (Outfit & Inter fonts, 16px border-radius, pill elements, Google brand colors)
- **Backend**: Node.js + Express.js + JSON Web Tokens (JWT) for authentication
- **Database**: SQLite3 (Local file database) with automated foreign key constraints

---

## 🚀 Local Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v16+) installed.

### 1. Setup Backend Server
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Initialize the SQLite database and seed the MPC (Maths, Physics, Chem) syllabus chapters:
   ```bash
   npm run seed
   ```
4. Start the Express backend server:
   ```bash
   npm start
   ```
   *The server runs locally on `http://localhost:5000`*

### 2. Setup Frontend Application
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The web client runs locally on `http://localhost:5173`*

---

## 🔬 Database Schema Design Overview

* **`users`**: Manages auth details, roles (`parent` or `student`), and class levels.
* **`student_profiles`**: Links users to their unique 6–8 character Student Codes.
* **`parent_student_links`**: Many-to-many relationship linking parents to linked children.
* **`syllabus_chapters` & `syllabus_topics`**: Seeded master database of JEE topics.
* **`student_topic_progress`**: Tracks progress statuses and hides/unhides custom items.
* **`daily_logs`**: Logs daily study sessions and accuracy data.
* **`weekly_tests`**: Stores assignments created by parents and self-logged mock tests.
* **`test_results`**: Tracks detailed marks, correct/incorrect questions, and scanned sheets.
* **`parent_uploads`**: Manages notes, assignments, custom files, and completion statuses.

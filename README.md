# EduGuard AI

EduGuard AI is a school dropout early-warning system. It combines attendance, grades, face recognition, risk scoring, and counselor interventions into one dashboard.

## Stack

### Backend

- Laravel API
- MySQL
- Redis
- Nginx
- Docker
- Laravel Sanctum
- Spatie Roles & Permissions

### Frontend

- React
- Vite
- React Router
- Axios
- Recharts
- Lucide Icons

### AI Service

- FastAPI
- `face_recognition`
- Laptop camera and phone IP webcam workflows

## Main Features

- Authentication
- Roles and permissions
- User access scope by governorate, district, or school
- Schools
- Classrooms
- Students
- Guardians
- Subjects
- Grades
- Attendance sessions
- Manual attendance
- Camera attendance
- Attendance review
- Student attendance history
- Student face registration
- AI recognition confidence and detection method
- Risk score calculation
- Interventions
- Dashboard
- Reports

## Docker Setup

From the project root:

```bash
docker compose up -d --build
```

Then enter the backend container:

```bash
docker compose exec backend bash
```

Run Laravel setup:

```bash
composer install
php artisan key:generate
php artisan migrate --seed
php artisan permission:cache-reset
php artisan optimize:clear
```

If you already have a database and want a clean demo setup:

```bash
php artisan migrate:fresh --seed
php artisan permission:cache-reset
php artisan optimize:clear
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Demo Accounts

All demo accounts use:

```txt
password
```

| Role | Email |
|---|---|
| Ministry Admin | ministry.admin@eduguard.test |
| School Admin | school.admin@eduguard.test |
| Teacher | teacher@eduguard.test |
| Counselor | counselor@eduguard.test |

## Roles

- `super_admin`
- `ministry_admin`
- `school_admin`
- `teacher`
- `counselor`
- `data_entry`

## Permissions

- `view_dashboard`
- `view_schools`
- `manage_schools`
- `view_classrooms`
- `manage_classrooms`
- `view_students`
- `manage_students`
- `view_attendance`
- `manage_attendance`
- `view_grades`
- `manage_grades`
- `view_reports`
- `view_risk_scores`
- `calculate_risk_scores`
- `manage_users`

## User Scope

Each user can optionally be limited by:

- `governorate_id`
- `district_id`
- `school_id`

Rules:

- `super_admin` and unscoped `ministry_admin` can access all data.
- `school_admin`, `teacher`, and `counselor` should usually have `school_id`.
- Scoped users cannot access route models or request references outside their scope.
- `user.scope` middleware validates route parameters such as students, classrooms, attendance sessions, risk scores, interventions, and face profiles.

## Face Recognition Flow

1. Open student details.
2. Click `Register Face`.
3. Upload images or capture directly from the laptop camera.
4. Frontend sends images as multipart `images[]`.
5. Laravel forwards image processing to the AI service.
6. AI service returns embeddings.
7. Laravel stores embeddings in `student_face_profiles`.
8. Student `face_registered` becomes true.
9. Camera attendance can identify the student and create attendance records with confidence and detection method.

## Camera Attendance Flow

### Laptop Camera

1. Open `/attendance/camera`.
2. Select laptop camera mode.
3. Start camera.
4. Create attendance session.
5. Review generated records in Review Attendance.

### Phone IP Webcam

1. Install an IP Webcam app on a phone.
2. Connect phone and laptop to the same network.
3. Use a URL like:

```txt
http://192.168.1.10:8080/shot.jpg
```

4. Refresh preview.
5. Create attendance session.
6. Review records.

## Interventions

Supported statuses:

- `open`
- `in_progress`
- `completed`
- `cancelled`

Supported priorities:

- `low`
- `medium`
- `high`
- `critical`

Supported types:

- `counseling`
- `parent_meeting`
- `home_visit`
- `academic_support`
- `attendance_follow_up`
- `financial_support`
- `other`

When an intervention status becomes `completed`, the backend sets `completed_at`. When it is changed back to another status, `completed_at` is cleared.

## Important API Endpoints

### Auth

```txt
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Students

```txt
GET    /api/students
POST   /api/students
GET    /api/students/{id}
PUT    /api/students/{id}
DELETE /api/students/{id}
```

### Attendance

```txt
GET  /api/attendance-sessions
POST /api/attendance-sessions
GET  /api/attendance-sessions/{id}
PUT  /api/attendance-sessions/{id}
POST /api/attendance-sessions/camera
PUT  /api/attendance-sessions/{id}/records/bulk
GET  /api/students/{student}/attendance-history
```

### Reports

```txt
GET /api/reports/daily-attendance
GET /api/reports/weekly-attendance
```

### Risk Scores

```txt
GET  /api/risk-scores
GET  /api/risk-scores/latest
GET  /api/risk-scores/{id}
POST /api/risk-scores/calculate
POST /api/risk-scores/calculate-bulk
```

### Interventions

```txt
GET    /api/interventions
POST   /api/interventions
GET    /api/interventions/{id}
PUT    /api/interventions/{id}
DELETE /api/interventions/{id}
```

### Face Profiles

```txt
GET    /api/students/{student}/face-profiles
POST   /api/students/{student}/face-profiles
DELETE /api/students/{student}/face-profiles/{faceProfile}
```

## Main Frontend Pages

```txt
/
 /schools
 /classrooms
 /classrooms/:id
 /students
 /students/:id
 /students/:id/face-registration
 /attendance
 /attendance/camera
 /attendance/:id/review
 /subjects
 /grades
 /reports
 /risk-scores
 /risk-scores/calculate
 /interventions
 /interventions/create
 /interventions/:id/edit
 /users
```

## After Route or Permission Changes

```bash
php artisan permission:cache-reset
php artisan optimize:clear
php artisan route:list
```

## Troubleshooting

### 403 Forbidden

Check:

- user role
- user permissions
- user scope fields
- whether the target resource belongs to the user school/district/governorate

### Recharts width/height warnings

Ensure each `ResponsiveContainer` has a parent with a fixed height, for example:

```jsx
<div className="chart-box">
  <ResponsiveContainer width="100%" height={260}>
    ...
  </ResponsiveContainer>
</div>
```

### Camera not opening

Camera requires:

- browser permission
- `localhost` or HTTPS
- physical camera device available

### IP Webcam preview not loading

Check:

- phone and laptop are on the same Wi-Fi
- URL ends with `/shot.jpg`
- firewall is not blocking the connection

## Final QA Checklist

- Login works for all demo accounts.
- school_admin sees only its school.
- teacher cannot access user management.
- counselor can access risk scores and interventions within scope.
- face registration works with upload and camera.
- camera attendance creates a session.
- review page shows confidence and detection method.
- risk score calculation works.
- interventions create/edit/delete works.
- completed interventions set `completed_at`.
- reports load without 500 errors.
- dashboard does not fail if one API request fails.

# House Meal System

Full-stack bachelor house meal management system with:

- `backend/`: Laravel 13 API
- `frontend/`: React 19 + Vite + Tailwind CSS 4

## Core Features

- `Super Admin`, `Admin`, and `Member` roles
- username/password login using Laravel Sanctum tokens
- meal plans: `weekly`, `monthly`, and `custom`
- member management
- grocery entry and cost tracking under each meal plan
- weekly admin role transfer from the current admin to an active member
- daily lunch/dinner status tracking
- unmarked meals are counted as `taken` by default

## Project Structure

```text
House Meal System/
|-- backend/
|   |-- app/
|   |   |-- Enums/
|   |   |-- Http/
|   |   |   |-- Controllers/Api/
|   |   |   |-- Middleware/
|   |   |   `-- Requests/
|   |   |-- Models/
|   |   `-- Services/
|   |-- database/
|   |   |-- migrations/
|   |   `-- seeders/
|   `-- routes/
|       |-- api.php
|       `-- web.php
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |   |-- layout/
|   |   |   `-- ui/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- providers/
|   |   `-- types/
|   `-- public/
`-- composer.phar
```

## Local Setup

### Backend

```bash
cd backend
php ..\composer.phar install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Backend runs on `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
copy .env.example .env
npm install --include=dev
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Demo Accounts

- `superadmin` / `password123`
- `admin` / `password123`
- `member1` / `password123`
- `member2` / `password123`

## API Summary

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/dashboard`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/{user}`
- `POST /api/users/transfer-admin`
- `GET /api/meal-plans`
- `POST /api/meal-plans`
- `GET /api/meal-plans/{meal_plan}`
- `GET /api/meal-plans/active`
- `GET /api/groceries`
- `POST /api/groceries`
- `PATCH /api/groceries/{grocery}`
- `DELETE /api/groceries/{grocery}`
- `GET /api/meal-statuses`
- `PATCH /api/meal-statuses/{mealStatus}`

## Verification

- backend: `php artisan test`
- frontend: `npm run build`

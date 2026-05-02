# Gaabai khai

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
Gaabai khai/
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

## cPanel Deployment

Recommended structure:

- frontend static app on `public_html`
- Laravel API on a subdomain such as `api.yourdomain.com`
- point the API subdomain document root to `backend/public`

### 1. Build the frontend for production

```bash
cd frontend
copy .env.production.example .env.production
```

Set:

- `VITE_API_BASE_URL=https://api.yourdomain.com/api`
- `VITE_APP_BASE=/`

Then build:

```bash
npm install --include=dev
npm run build
```

Upload the contents of `frontend/dist/` to `public_html/`.

Important:

- `frontend/public/.htaccess` is included for SPA route fallback on cPanel
- this prevents refreshes on routes like `/settings` or `/meals` from breaking

### 2. Deploy the Laravel backend

Upload `backend/` to your hosting account outside `public_html` if possible.

Point the API subdomain document root to:

```text
backend/public
```

Then inside `backend/`:

```bash
php ../composer.phar install --no-dev --optimize-autoloader
copy .env.cpanel.example .env
php artisan key:generate
php artisan migrate --force
php artisan optimize
```

Update `.env` with your real:

- MySQL database credentials
- `APP_URL`
- `FRONTEND_URL`

### 3. Required cPanel notes

- make sure PHP version is `8.3+`
- enable MySQL for Laravel
- if your host supports Terminal, run the Laravel commands there
- if Terminal is not available, use cPanel cron jobs or a one-time SSH session for `migrate --force` and `optimize`
- make sure `storage/` and `bootstrap/cache/` are writable

### 4. Production URLs

Example:

- frontend: `https://yourdomain.com`
- backend API: `https://api.yourdomain.com`
- login endpoint: `https://api.yourdomain.com/api/auth/login`

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

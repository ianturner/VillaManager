# VillaManager Documentation

This document summarizes the current API surface, DTOs/data structures, and the
frontend app structure as implemented in this repo.

## Architecture Overview
- **Frontend**: Next.js app in `frontend/` (App Router).
- **Backend**: ASP.NET Core Minimal API in `src/PropertyManager.Api`.
- **Prototype data**: JSON and assets under `data/` (served as `/data`).
- **Prototype auth users**: stored in `data-private/users.json` (not publicly served).

## Roles and Permissions (Current)
- `admin`: full access, can create properties, manage users, manage themes.
- `property-owner`: can update/archive assigned properties.
- `agent`: can update/archive assigned properties (acts on behalf of multiple owners).
- `property-manager`: read-only access to assigned properties.

## Running Locally
- API: `dotnet run --project src/PropertyManager.Api/PropertyManager.csproj`
- Frontend: `cd frontend && npm run dev`
- Both: `cd frontend && npm run dev:all`

### API Base URL
Default: `http://localhost:5106` (see `frontend/src/lib/api.ts`).

## API Endpoints
All endpoints are under `/api`.

### Auth
Base: `/api/auth`
- `POST /login`
  - Body: `{ "username": string, "password": string }`
  - Returns: `{ token, expiresAt, user }`
- `POST /logout`
  - Returns: `{ message: "Logged out." }` (stateless stub)

### Public Property Data
Base: `/api/properties`
- `GET /{id}`
  - Returns full `PropertyDto` (archived properties return 404)
- `GET /{id}/pages`
  - Returns list of page ids with ordering (excludes archived)
- `GET /{id}/pages/{page}`
  - Returns a single page payload (includes overview/location/facilities/rental/sales system pages)
- `GET /{id}/pages/{page}/images`
  - Returns images for a page (excludes archived)
- `GET /{id}/poi`
  - Returns POIs (excludes archived)
- `GET /{id}/poi/{poiId}/images`
  - Returns POI images (excludes archived)
- `GET /{id}/poi/{poiId}/pdfs`
  - Returns POI PDFs
- `GET /{id}/pdfs`
  - Returns property PDFs

### Admin (JWT Required)
Base: `/api/admin`
- `GET /properties`
  - Returns all properties for admins
  - Returns assigned properties for agents/property-managers/property-owners
- `POST /properties`
  - Body: `{ "id": string, "name": string, "status": string }`
  - Creates a property shell (admins only)
- `PUT /properties/{id}`
  - Body: `PropertyUpdateRequestDto` (partial updates supported)
  - Allowed for admins and agents/property-owners with access
- `POST /properties/{id}/archive`
- `POST /properties/{id}/restore`
  - Allowed for admins and agents/property-owners with access
- `POST /properties/{id}/publish`
  - Promotes latest draft to `data.json` and archives prior published data
- `POST /properties/{id}/revert`
  - Deletes the latest draft file and reverts to the previous version
- `GET /properties/{id}/availability/ical`
  - Returns parsed iCal availability ranges (requires access)
- `GET /flights/lookup?flightNumber={code}&date={yyyy-MM-dd}&airport={nameOrIata}`
  - Looks up arrival time via AeroDataBox (API.Market)

### User Management (JWT Required, Role: admin/property-owner)
Base: `/api/admin/users`
- `GET /`
  - Returns all users
- `GET /properties`
  - Returns properties list for access assignment
- `POST /`
  - Body: `UserCreateRequest`
- `PUT /{id}`
  - Body: `UserUpdateRequest`
- `DELETE /{id}`

### Theme Management (JWT Required)
Base: `/api/themes`
- `GET /`
  - Returns shared themes (public + user's private); admins see all
- `POST /`
  - Body: `ThemeCreateRequest`
- `PUT /{name}`
  - Body: `ThemeUpdateRequest`
- `DELETE /{name}`

### Not Implemented (stubbed 501 in API)
- Messages/notifications
- Finance endpoints

## DTOs and Data Structures

### PropertyDto (API)
Key fields (see `src/PropertyManager.Application/Contracts/PropertyDto.cs`):
- `id`, `name`, `status`
- `archived` (bool)
- `version` (string)
- `isPublished` (bool)
- `summary`
- `heroImages[]`, `heroSettings`
- `pages[]`
- `themeName` (string, shared theme lookup)
- `theme` (hydrated by backend from theme library)
- `facts`, `externalLinks`, `location`, `facilities`, `pdfs`
- `salesParticulars`, `rental`

### PropertyPageDto
`id`, `title`, `showSectionsSubmenu`
`heroImages`, `heroText`, `sections[]`

### PropertySectionDto
`id`, `title?`, `description?`, `images[]`, `heroText?`, `heroImages[]`

### ImageDto
`src`, `alt`

### Auth DTOs
- `AuthLoginRequest`: `{ username, password }`
- `AuthLoginResponse`: `{ token, expiresAt, user }`
- `AuthUserInfo`: `{ id, username, displayName, roles[], propertyIds[] }`

### Property Update DTO
`PropertyUpdateRequestDto` supports partial updates, including:
- `name`, `status`, `summary`, `archived`
- `heroImages`, `heroSettings`, `pages`, `theme`, `facts`
- `themeName`
- `externalLinks`, `location`, `facilities`, `pdfs`
- `salesParticulars`, `rental`

### Rental DTOs
- `RentalDto`: `availability[]`, `bookings[]`, `icalUrl?`, `summary`, `details`
- `RentalAvailabilityDto`: `year`, `calendarImage`
- `RentalBookingDto`: booking fields including dates, parties, source, income, and notes

### Theme DTOs
- `ThemeLibraryDto`: `{ name, displayName, isPrivate, createdBy, defaultMode, light, dark, fonts }`
- `ThemeCreateRequest`, `ThemeUpdateRequest`
  - `fonts` contains `base`, `title`, `subtitle` font definitions (`family`, `src`, `format`, `weight`, `style`)

### User Management DTOs
- `UserManagementDto`: `{ id, username, displayName, roles[], propertyIds[], disabled, email, phone, whatsApp, viber }`
- `UserCreateRequest`, `UserUpdateRequest`

## Prototype Data Layout
Prototype content is loaded from `data/` and served as `/data`.

```
data/
  properties/
    <property-id>/
      data.json
      data-vYYYYMMDDHHmmss.json
      archive/
        data-archive-vYYYYMMDDHHmmss.json
      pages/
        <page-id>/
          images/
      pdfs/
  themes.json
```

### Theme Fonts
Theme fonts are now defined in `data/themes.json` and delivered via `ThemeDto.fonts`.
The frontend injects `@font-face` rules dynamically, so no per-theme CSS files are required
for font loading.

### Data Versioning & Publishing
- Editing a property writes a new draft file: `data-vYYYYMMDDHHmmss.json`.
- The API loads the **latest draft** if present; otherwise it loads `data.json`.
- Publishing:
  - Moves current `data.json` to `archive/data-archive-v{version}.json`.
  - Promotes the latest draft to `data.json` and sets `isPublished=true`.
  - Moves all remaining `data-v*.json` drafts into `archive/` to keep history.
- Reverting:
  - Deletes the latest draft file and reloads the previous version or `data.json`.

### Flight Arrival Lookup Configuration
The flight lookup endpoint uses **AeroDataBox (API.Market)** and requires an API key.
Set these environment variables in deployment:
- `Flights__ApiKey`
- Optional: `Flights__BaseUrl` (defaults to `https://prod.api.market/api/v1/aedbx/aerodatabox`)

### Prototype Users
Stored in `data-private/users.json` and loaded via `UserStore.UsersFile`.

## Frontend Structure
Root: `frontend/src`

- `app/`
  - `page.tsx`: public property view (uses `?id=`)
  - `admin/page.tsx`: admin dashboard (CRUD + archive/restore)
  - `admin/login/page.tsx`: admin login
  - `admin/users/page.tsx`: user management
  - `admin/themes/page.tsx`: theme management
  - `layout.tsx`: app shell
  - `globals.css`: styling
- `components/`
  - `PropertyPageViewer.tsx`: page content rendering + image viewer
  - `PropertyPageNav.tsx`: left nav + section submenu
  - `HeroSlideshow.tsx`, `ThemeProvider.tsx`, `ThemeToggle.tsx`, etc.
- `lib/`
  - `api.ts`: public API helpers
  - `adminApi.ts`: auth + admin API helpers
  - `types.ts`: frontend DTOs

### Frontend Auth Flow
- `/admin/login` posts credentials to `/api/auth/login`.
- JWT is stored in `localStorage` under `vm_admin_token`.
- Admin UI uses Bearer token for `/api/admin/*` routes.
- Theme management uses `/api/themes`.

## Known Gaps (Planned)
- Messaging/notifications implementation.
- File upload workflows for images/PDFs.

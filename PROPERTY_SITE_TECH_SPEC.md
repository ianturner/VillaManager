# Property Website Tech Spec

## Purpose
Build a data-driven property website backed by an API and server-side storage.
Each property is defined by structured data plus related images. The site
renders multiple pages/sections per property and supports both rental and
for-sale variants. The backend supports admin workflows, messaging, and future
mobile clients.

## Goals
- Load property data and assets by a human-readable `id` querystring parameter.
- Present a consistent multi-page/section experience per property.
- Support conditional pages for rentals vs sales.
- Enable zero-config gallery updates by dropping images into a page folder.
- Provide authenticated admin tooling for content management.
- Expose a stable API for web and future mobile apps.
- Support owner/manager messaging and notifications.

## Hosting & Deployment (Host-Agnostic)
The core implementation should remain host-agnostic. Development and testing
will be done locally first, then hosting will be chosen later.

Hosting options (later decision):
- VPS (full control)
- Managed PaaS
- Cloud provider app hosting

Deployment requirements:
- ASP.NET Core Web API runtime
- PostgreSQL
- Object storage (S3-compatible) for images and PDFs

## Architecture Overview
- **Frontend**: SPA or SSR consuming the API (framework TBD).
- **Backend API**: ASP.NET Core Web API serving property data, POIs, galleries,
  bookings, messaging, and admin workflows.
- **Database**: PostgreSQL with EF Core for users, properties, bookings,
  messages, finances.
- **File Storage**: S3-compatible bucket for images and uploads.
  - Folder convention preserved for discoverability.
- **Auth**: ASP.NET Core Identity + JWT (or cookies) with role-based access
  control.

## Backend Solution Structure (Recommended)
```
PropertyManager.sln
src/
  PropertyManager.Api/
    Controllers/
    Endpoints/
    Middleware/
    Program.cs
    appsettings.json
    appsettings.Development.json

  PropertyManager.Application/
    Contracts/
    Features/
    Services/
    Validators/

  PropertyManager.Domain/
    Entities/
    Enums/
    ValueObjects/
    Exceptions/

  PropertyManager.Infrastructure/
    Data/
    Storage/
    Messaging/
    Identity/
    Pdf/

tests/
  PropertyManager.Tests/
  PropertyManager.Api.Tests/
```

Notes:
- `Api` contains HTTP endpoints, auth, and middleware.
- `Application` holds use cases and DTOs.
- `Domain` is pure business logic.
- `Infrastructure` contains EF Core, storage adapters, and external services.

## DTOs and Enum Mapping
- Public API DTOs use **strings** for enum-like values to keep JSON contracts
  stable and readable (e.g., `status: "rental"`).
- Domain and persistence layers use **enums** for correctness and safety.
- Mapping between DTOs and domain models is handled in the Application layer.
- Serialization can remain string-based without exposing enums in DTOs.

## Local Development
- Run API + DB locally with Docker Compose.
- Use local file storage or a local S3-compatible service (e.g., MinIO).
- Frontend runs locally and consumes the API via HTTP.
- Run tests locally with `dotnet test`.

### Prototype Data Source
- The API can serve prototype JSON data from a local folder.
- Default root: `data/` at repo root.
- Files are exposed under `/data` for images and PDFs.

### Local macOS Setup (ASP.NET Core)
- Install .NET SDK (latest LTS).
- IDE: VS Code + C# Dev Kit, or JetBrains Rider.
- Optional: Docker Desktop for PostgreSQL and MinIO.

Example:
```
dotnet new webapi -n PropertySite.Api
cd PropertySite.Api
dotnet run
```

### Docker Compose (PostgreSQL + MinIO)
```
version: "3.9"
services:
  postgres:
    image: postgres:16
    container_name: propertysite-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: propertysite
      POSTGRES_PASSWORD: propertysite
      POSTGRES_DB: propertysite
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio:latest
    container_name: propertysite-minio
    command: server /data --console-address ":9001"
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

## Frontend Options (Evaluation)
Goal: choose a React-friendly stack that is easy to learn, works well with a
.NET API, and supports SSR/SEO if needed.

Candidates:
- **React + Vite (SPA)**: simple, fast dev experience, minimal complexity.
- **Next.js (React + SSR)**: better SEO and routing, more framework features.
- **Remix (React + SSR)**: data-loading patterns, strong routing.
- **Astro (React components)**: static-first with islands; SSR optional.

Selection criteria:
- Learning curve for modern React
- SEO needs (server rendering vs client-only)
- Admin UI complexity and routing needs
- Deployment simplicity (host-agnostic)

### Recommendation Matrix
```
Option           | Learning Curve | SEO/SSR | Admin UI | Host-Agnostic | Notes
-----------------|----------------|---------|----------|---------------|-------------------------------
React + Vite     | Low            | Client  | Strong   | Strong        | Easiest entry, SPA only
Next.js          | Medium         | Strong  | Strong   | Medium        | More framework opinions
Remix            | Medium         | Strong  | Strong   | Medium        | Great data patterns
Astro            | Medium         | Good    | Medium   | Strong        | SSR optional, islands model
```

## URL & Routing
- Entry: `/property?id=<property_id>`
- Page navigation via anchors or route state:
  - `#overview`
  - `#<page_id>` for each configured property page (flexible, e.g. `interior`,
    `exterior`, `master-suite`, `pool-terrace`)
  - `#location`, `#facilities`, `#poi`
  - `#sales` (sale only)
  - `#availability`, `#rates`, `#conditions` (rental only)

## Data & Asset Layout (Storage Convention)
```
/properties/
  villa_janoula/
    data.json
    pages/
      overview/
        images/
          hero.jpg
      interior/
        images/
          living_room_1.jpg
          living_room_2.jpg
      exterior/
        images/
          pool_1.jpg
      master-suite/
        images/
          suite_1.jpg
    poi/
      restaurant_x/
        data.json
        images/
          front.jpg
        pdfs/
          directions_from_rome.pdf
          menu_highlights.pdf
      ancient_ruins/
        data.json
        images/
          sign.jpg
        pdfs/
          site_guide.pdf
    pdfs/
      directions/
        from_rome.pdf
        from_naples.pdf
```

## JSON Schema (Draft)
```json
{
  "id": "villa_janoula",
  "name": "Villa Janoula",
  "status": "rental",
  "summary": "Short overview text",
  "heroImage": { "src": "pages/overview/images/hero.jpg", "alt": "Front view" },
  "pages": [
    {
      "id": "interior",
      "title": "Interior",
      "heroImage": { "src": "pages/interior/images/hero.jpg", "alt": "Living room" },
      "heroText": "Indoor spaces designed for relaxed living.",
      "sections": [
        { "id": "living-room", "title": "Living Room", "description": "...", "images": [] }
      ]
    },
    {
      "id": "exterior",
      "title": "Exterior",
      "heroText": "Outdoor living and views.",
      "sections": [
        { "id": "pool", "title": "Pool Area", "description": "...", "images": [] }
      ]
    }
  ],
  "location": {
    "address": "...",
    "mapEmbedUrl": "...",
    "description": "..."
  },
  "facilities": ["Air conditioning", "Wi-Fi", "Parking"],
  "pointsOfInterest": [],
  "salesParticulars": {
    "price": "...",
    "legal": "...",
    "documents": []
  },
  "rental": {
    "availability": [
      { "year": 2026, "calendarImage": { "src": "pages/availability/images/2026.png", "alt": "Availability 2026" } }
    ],
    "rates": [
      { "season": "High", "pricePerWeek": "..." }
    ],
    "conditions": ["No smoking", "Check-in 4pm"]
  }
}
```

## POI Discovery (Auto-Populate)
Requirement: adding a POI must be as simple as dropping a POI JSON file into
`/properties/<id>/poi/<poi_id>/data.json`, with images in a matching `images/`
subfolder. The POI page builder discovers POIs dynamically.

### POI Folder Structure
```
/properties/<id>/poi/<poi_id>/
  data.json
  images/
    ...
```

### POI JSON Schema (Draft)
```json
{
  "id": "restaurant_x",
  "name": "Restaurant X",
  "category": "Restaurant",
  "description": "...",
  "distance": "2km",
  "mapLink": "...",
  "images": []
}
```

### Runtime Behavior (Dynamic Backend)
- API lists `/properties/<id>/poi/*/data.json` objects directly from storage.
- POI galleries are built by listing files under
  `/properties/<id>/poi/<poi_id>/images/` in storage.
- Optional: cache the computed POI list and image lists in the database for
  performance.

## Image Discovery (Gallery Auto-Populate)
Requirement: adding an image to a page gallery must be as simple as dropping a
file into that page’s `images/` folder.

### Strategy (Dynamic Backend)
- API lists files under `/properties/<id>/pages/<page>/images/`.
- Optional: allow an `images.json` override for manual ordering or alt text.
- Cache image lists in DB or memory for faster response.

## PDF Handling (Directions & POI PDFs)
Requirement: provide downloadable PDFs for property directions (multiple
origins) and POIs, with support for dynamic generation when new PDFs are added.

### Strategy
- Store PDFs in property and POI folders under `/pdfs/`.
- Provide an API endpoint that lists PDFs from storage.
- Support on-demand PDF generation with caching to storage.

### Generation Notes
- If a PDF is missing but source data exists, generate it on request and store
  it to `/pdfs/` for subsequent downloads.
- Optional: background jobs to pre-generate or re-generate PDFs when content
  changes.

### Generation Options (.NET)
- **QuestPDF**: native .NET, fast, good for programmatic layouts.
- **Razor + wkhtmltopdf**: author HTML templates with Razor, render to PDF via
  wkhtmltopdf. Good if you want consistent styling with web UI.
- **Puppeteer/Playwright**: render a dedicated HTML page to PDF headlessly.
  Good for complex layout reuse, requires a headless browser runtime.

### Versioning & Regeneration
- Store a `pdfVersion` and `sourceHash` per PDF in DB or metadata.
- On request:
  - If `sourceHash` differs or file missing, regenerate.
  - Otherwise return existing PDF.
- Optional: append version to filename (`directions_from_rome_v3.pdf`) or keep a
  stable filename with metadata tracking.

## Rendering Logic
- Fetch property data from the API (`/api/properties/<id>`).
- Render configured pages from `pages`, preserving their order.
- Render system pages (`overview`, `location`, `facilities`, `poi`, `sales`,
  `availability`, `rates`, `conditions`) when data exists.
- Use `status` to decide whether to render sales or rental sections.
- Fetch gallery images via API endpoints per page/section.

## API Surface (Draft)
- `GET /api/properties/:id`
- `GET /api/properties/:id/pages`
- `GET /api/properties/:id/pages/:page`
- `GET /api/properties/:id/pages/:page/images`
- `GET /api/properties/:id/poi`
- `GET /api/properties/:id/poi/:poiId/images`
- `POST /api/admin/properties` (create)
- `POST /api/admin/properties/:id/content` (update content)
- `POST /api/admin/properties/:id/uploads` (images)
- `POST /api/messages` (owner/manager messaging)
- `POST /api/bookings` (booking requests)
- `GET /api/notifications` (user notifications)

## .NET Project Structure (Recommended)
```
PropertySite.sln
src/
  PropertySite.Api/
    Controllers/
    Endpoints/
    Middleware/
    Program.cs
    appsettings.json
  PropertySite.Application/
    Contracts/
    Features/
    Services/
    Validators/
  PropertySite.Domain/
    Entities/
    Enums/
    ValueObjects/
  PropertySite.Infrastructure/
    Data/
    Storage/
    Messaging/
    Identity/
tests/
  PropertySite.Tests/
```

Notes:
- Use **Minimal APIs** in `PropertySite.Api/Endpoints` or Controllers if preferred.
- `Application` contains use cases and DTOs.
- `Domain` holds core entities and rules.
- `Infrastructure` contains EF Core, storage adapters, and notification providers.

## Minimal API Contract (Draft)
### Public
- `GET /api/properties/{id}`
  - Returns property data JSON (overview, sections, rental/sales).
- `GET /api/properties/{id}/pages`
  - Returns ordered list of system + configured pages.
- `GET /api/properties/{id}/pages/{page}`
  - Returns data for a configured page or a system page (overview, location, etc).
- `GET /api/properties/{id}/pages/{page}/images`
  - Returns list of images for a page section.
- `GET /api/properties/{id}/poi`
  - Returns list of POIs for the property.
- `GET /api/properties/{id}/poi/{poiId}/images`
  - Returns list of images for a POI.
- `GET /api/properties/{id}/pdfs`
  - Returns list of property-level PDFs (e.g., directions).
- `GET /api/properties/{id}/poi/{poiId}/pdfs`
  - Returns list of POI PDFs.

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Admin / Manager
- `POST /api/admin/properties`
- `PUT /api/admin/properties/{id}`
- `POST /api/admin/properties/{id}/uploads`
- `POST /api/admin/properties/{id}/poi`
- `POST /api/admin/properties/{id}/poi/{poiId}/uploads`
- `POST /api/admin/properties/{id}/pdfs`
- `POST /api/admin/properties/{id}/poi/{poiId}/pdfs`

### Messaging & Notifications
- `POST /api/messages`
- `GET /api/messages/thread/{threadId}`
- `GET /api/notifications`

### Finance
- `POST /api/finance/{propertyId}/entries`
- `GET /api/finance/{propertyId}/entries`
- `POST /api/finance/{propertyId}/entries/{entryId}/receipts`

## Endpoint Details (Concrete Draft)
### Conventions
- All responses are JSON.
- `id` is a human-readable slug (e.g., `villa_janoula`).
- Images are returned as absolute URLs.
- Errors use a standard shape:
```json
{
  "error": {
    "code": "not_found",
    "message": "Property not found"
  }
}
```

### Public
`GET /api/properties/{id}`
- Response 200:
```json
{
  "id": "villa_janoula",
  "name": "Villa Janoula",
  "status": "rental",
  "summary": "Short overview text",
  "heroImage": { "src": "https://cdn.example.com/properties/villa_janoula/pages/overview/images/hero.jpg", "alt": "Front view" },
  "pages": [
    {
      "id": "interior",
      "title": "Interior",
      "heroText": "Indoor spaces designed for relaxed living.",
      "sections": [{ "id": "living-room", "title": "Living Room", "description": "...", "images": [] }]
    }
  ],
  "location": { "address": "...", "mapEmbedUrl": "...", "description": "..." },
  "facilities": ["Air conditioning", "Wi-Fi", "Parking"],
  "pdfs": [],
  "salesParticulars": null,
  "rental": {
    "availability": [{ "year": 2026, "calendarImage": { "src": "https://cdn.example.com/properties/villa_janoula/pages/availability/images/2026.png", "alt": "Availability 2026" } }],
    "rates": [{ "season": "High", "pricePerWeek": "..." }],
    "conditions": ["No smoking", "Check-in 4pm"]
  }
}
```

`GET /api/properties/{id}/pages/{page}/images`
- Response 200:
```json
[
  { "src": "https://cdn.example.com/properties/villa_janoula/pages/interior/images/living_room_1.jpg", "alt": "Living room seating" },
  { "src": "https://cdn.example.com/properties/villa_janoula/pages/interior/images/living_room_2.jpg", "alt": "Living room view" }
]
```

`GET /api/properties/{id}/poi`
- Response 200:
```json
[
  {
    "id": "restaurant_x",
    "name": "Restaurant X",
    "category": "Restaurant",
    "description": "...",
    "distance": "2km",
    "mapLink": "...",
    "images": [],
    "pdfs": []
  }
]
```

`GET /api/properties/{id}/poi/{poiId}/images`
- Response 200:
```json
[
  { "src": "https://cdn.example.com/properties/villa_janoula/poi/restaurant_x/images/front.jpg", "alt": "Front of Restaurant X" }
]
```

`GET /api/properties/{id}/pdfs`
- Response 200:
```json
[
  { "id": "from_rome", "title": "Directions from Rome", "type": "directions", "src": "https://cdn.example.com/properties/villa_janoula/pdfs/directions/from_rome.pdf" },
  { "id": "from_naples", "title": "Directions from Naples", "type": "directions", "src": "https://cdn.example.com/properties/villa_janoula/pdfs/directions/from_naples.pdf" }
]
```

`GET /api/properties/{id}/poi/{poiId}/pdfs`
- Response 200:
```json
[
  { "id": "menu_highlights", "title": "Menu Highlights", "type": "poi", "src": "https://cdn.example.com/properties/villa_janoula/poi/restaurant_x/pdfs/menu_highlights.pdf" }
]
```

### Auth
`POST /api/auth/login`
- Request:
```json
{ "email": "owner@example.com", "password": "secret" }
```
- Response 200:
```json
{ "accessToken": "<jwt>", "expiresAt": "2026-01-19T12:00:00Z", "user": { "id": "u_1", "roles": ["owner"] } }
```

`POST /api/auth/logout`
- Response 204

`GET /api/auth/me`
- Response 200:
```json
{ "id": "u_1", "email": "owner@example.com", "roles": ["owner"] }
```

### Admin / Manager
`POST /api/admin/properties`
- Request:
```json
{ "id": "villa_janoula", "name": "Villa Janoula", "status": "rental" }
```
- Response 201:
```json
{ "id": "villa_janoula" }
```

`PUT /api/admin/properties/{id}`
- Request: full or partial property update (DTO below)
- Response 204

`POST /api/admin/properties/{id}/uploads`
- Multipart upload: `files[]`, `targetPath`
- Response 201:
```json
{ "uploaded": [{ "src": "https://cdn.example.com/properties/villa_janoula/pages/interior/images/new.jpg" }] }
```

`POST /api/admin/properties/{id}/poi`
- Request:
```json
{ "id": "restaurant_x", "name": "Restaurant X", "category": "Restaurant", "description": "...", "distance": "2km", "mapLink": "..." }
```
- Response 201:
```json
{ "id": "restaurant_x" }
```

`POST /api/admin/properties/{id}/poi/{poiId}/uploads`
- Multipart upload: `files[]`, `targetPath`
- Response 201:
```json
{ "uploaded": [{ "src": "https://cdn.example.com/properties/villa_janoula/poi/restaurant_x/images/front.jpg" }] }
```

`POST /api/admin/properties/{id}/pdfs`
- Multipart upload: `files[]`, `category` (e.g., `directions`)
- Response 201:
```json
{ "uploaded": [{ "src": "https://cdn.example.com/properties/villa_janoula/pdfs/directions/from_rome.pdf" }] }
```

`POST /api/admin/properties/{id}/poi/{poiId}/pdfs`
- Multipart upload: `files[]`
- Response 201:
```json
{ "uploaded": [{ "src": "https://cdn.example.com/properties/villa_janoula/poi/restaurant_x/pdfs/menu_highlights.pdf" }] }
```

### Messaging & Notifications
`POST /api/messages`
- Request:
```json
{ "propertyId": "villa_janoula", "toUserId": "u_2", "subject": "Booking request", "body": "..." }
```
- Response 201:
```json
{ "threadId": "t_123", "messageId": "m_456" }
```

`GET /api/messages/thread/{threadId}`
- Response 200:
```json
{ "threadId": "t_123", "messages": [{ "id": "m_456", "fromUserId": "u_1", "body": "...", "sentAt": "2026-01-19T10:00:00Z" }] }
```

`GET /api/notifications`
- Response 200:
```json
[{ "id": "n_1", "type": "booking_request", "title": "New booking request", "createdAt": "2026-01-19T10:01:00Z", "read": false }]
```

### Finance
`POST /api/finance/{propertyId}/entries`
- Request:
```json
{ "type": "cost", "amount": 120.5, "currency": "EUR", "date": "2026-01-10", "description": "Plumbing repair" }
```
- Response 201:
```json
{ "id": "fe_1" }
```

`GET /api/finance/{propertyId}/entries`
- Response 200:
```json
[{ "id": "fe_1", "type": "cost", "amount": 120.5, "currency": "EUR", "date": "2026-01-10", "description": "Plumbing repair", "receipts": [] }]
```

`POST /api/finance/{propertyId}/entries/{entryId}/receipts`
- Multipart upload: `files[]`
- Response 201:
```json
{ "uploaded": [{ "src": "https://cdn.example.com/properties/villa_janoula/finance/fe_1/receipt_1.jpg" }] }
```

## DTO Definitions (Draft)
### PropertyDto
```json
{
  "id": "string",
  "name": "string",
  "status": "rental|sale",
  "summary": "string",
  "heroImage": { "src": "string", "alt": "string" },
  "pages": [PropertyPageDto],
  "location": { "address": "string", "mapEmbedUrl": "string", "description": "string" },
  "facilities": ["string"],
  "pdfs": [PdfDto],
  "salesParticulars": { "price": "string", "legal": "string", "documents": ["string"] },
  "rental": {
    "availability": [{ "year": 2026, "calendarImage": { "src": "string", "alt": "string" } }],
    "rates": [{ "season": "string", "pricePerWeek": "string" }],
    "conditions": ["string"]
  }
}
```

### PropertyPageDto
```json
{
  "id": "string",
  "title": "string",
  "heroImage": { "src": "string", "alt": "string" },
  "heroText": "string",
  "sections": [PropertySectionDto]
}
```

### PropertySectionDto
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "images": [ImageDto]
}
```

### PoiDto
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "description": "string",
  "distance": "string",
  "mapLink": "string",
  "images": [ImageDto],
  "pdfs": [PdfDto]
}
```

### ImageDto
```json
{
  "src": "string",
  "alt": "string"
}
```

### PdfDto
```json
{
  "id": "string",
  "title": "string",
  "type": "string",
  "src": "string"
}
```

### MessageDto
```json
{
  "id": "string",
  "threadId": "string",
  "propertyId": "string",
  "fromUserId": "string",
  "toUserId": "string",
  "subject": "string",
  "body": "string",
  "sentAt": "string"
}
```

### NotificationDto
```json
{
  "id": "string",
  "type": "string",
  "title": "string",
  "createdAt": "string",
  "read": true
}
```

### FinanceEntryDto
```json
{
  "id": "string",
  "propertyId": "string",
  "type": "cost|income",
  "amount": 0,
  "currency": "string",
  "date": "string",
  "description": "string",
  "receipts": [ImageDto]
}
```

## Features (Draft)
- Property-specific pages driven by API data and dynamic asset discovery.
- POI discovery from storage with optional DB caching.
- Owner/manager/guest messaging with notification feed.
- Admin content management (upload images, update content, add POIs).
- Finance tracking with receipt uploads.
- PDF downloads for property directions and POI documents.
- PDF generation for newly added or updated documents (server-side).
  - Generation can be on-demand with caching, or background job with storage.

## Auth & Roles
- Roles: `owner`, `manager`, `guest`, `admin`, `developer`.
- Admin UI gated by roles; API enforces RBAC.
- Owners/managers can message each other and manage property records.
- Guests and owner/manager can message each other.

## Messaging & Notifications
- Messages stored in DB (threaded by property + participants).
- Notifications generated on booking requests, messages, and admin actions.
- Optional: email/SMS push via provider (later).

## Finance & Evidence Storage
- Record income/costs against property.
- Upload receipts and link to finance entries.
- Access restricted to owner/manager/admin.

## Accessibility & UX
- All images must have `alt` text (from JSON or defaulting to file name).
- Semantic headings for each section.
- Sticky or persistent menu for long pages.

## Error Handling
- Missing `id`: show a property selection or friendly error.
- Missing JSON or invalid schema: show 404-style error page.

## Future Extensions
- Localized content per property.
- Search and filter across properties (if a global index is introduced).

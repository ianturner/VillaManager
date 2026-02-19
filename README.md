# VillaManager

Property management platform backed by an ASP.NET Core Web API with a
React-friendly frontend (framework TBD). This repo currently contains the API
solution structure, DTOs, and early architecture scaffolding.

## Structure
```
PropertyManager.sln
src/
  PropertyManager.Api/
  PropertyManager.Application/
  PropertyManager.Domain/
  PropertyManager.Infrastructure/
frontend/
tests/
  PropertyManager.Tests/
```

## Local Setup
- Install .NET SDK (8.x LTS recommended).
- Optional: Docker Desktop for PostgreSQL and MinIO.

## Commands
Run the API:
```
dotnet run --project src/PropertyManager.Api/PropertyManager.csproj
```

Test with Swagger (OpenAPI):
```
open http://localhost:5000/openapi/v1.json
```

If you want a UI, you can use Swagger UI via a tool like `swashbuckle` later,
or import the OpenAPI JSON into Postman/Insomnia.

Run tests:
```
dotnet test
```

## Documentation
See `DOCUMENTATION.md` for API endpoints, DTOs, and frontend structure.

## Deployment Configuration
The flight arrival lookup uses the **AeroDataBox (API.Market)** free tier. Do **not** commit the key
to source control. Set it via environment variables instead:

```
Flights__ApiKey=YOUR_KEY_HERE
Flights__ApiKeyHeader=x-api-market-key
```

Get a key by signing up at `https://apimarket.aerodatabox.com/` and subscribing to the free plan.

Optional override (defaults to AeroDataBox API.Market gateway):
```
Flights__BaseUrl=https://prod.api.market/api/v1/aedbx/aerodatabox
```

Without `Flights__ApiKey`, the flight lookup endpoint returns "Flight lookup is not configured"
and the admin UI lookup button will fail.

## Notes
- DTOs remain string-based for API JSON contracts.
- Domain enums are mapped in the Application layer.

## Breaking Changes
- `PropertyDto` no longer exposes `interior`/`exterior`. Use `pages` with flexible
  `PropertyPageDto` + `PropertySectionDto` instead.
- Prototype `data.json` files now use the `pages` array.

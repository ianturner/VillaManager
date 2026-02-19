# Postman Setup

## Import
1. Open Postman.
2. Import `PropertyManager.postman_collection.json`.
3. Import `PropertyManager.postman_environment.json`.
4. Select the **PropertyManager Local** environment.

## Run
Start the API locally:
```
dotnet run --project src/PropertyManager.Api/PropertyManager.csproj
```

Run the collection with the Postman Collection Runner.

## Notes
- Current endpoints are read-only for prototype data.
- Writes return `501 Not Implemented`.

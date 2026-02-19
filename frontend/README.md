# VillaManager Frontend

## Setup
```
npm install
npm run dev
```

## Environment
Set `NEXT_PUBLIC_API_BASE_URL` to your API base URL (defaults to
`http://localhost:5106`).

Example:
```
export NEXT_PUBLIC_API_BASE_URL=http://localhost:5106
```

If you prefer a file, create `frontend/.env.local` manually with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5106
```

## Run API + Frontend Together
```
npm run dev:all
```

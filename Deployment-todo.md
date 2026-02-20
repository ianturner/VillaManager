# VillaManager: Azure Deployment Guide

A step-by-step guide to deploying VillaManager to Azure, written for users with little or no Azure experience.

---

## Table of Contents

1. [Overview of What We're Building](#1-overview-of-what-were-building)
2. [Prerequisites](#2-prerequisites)
3. [Part A: Create Storage for Your Data](#part-a-create-storage-for-your-data)
4. [Part B: Create and Configure the API (App Service)](#part-b-create-and-configure-the-api-app-service)
5. [Part C: Create and Configure the Frontend](#part-c-create-and-configure-the-frontend)
6. [Part D: Upload Your Data](#part-d-upload-your-data)
7. [Part E: Security Checklist](#part-e-security-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Adding a Custom Domain Later](#adding-a-custom-domain-later)

---

## 1. Overview of What We're Building

VillaManager has two parts:

| Part | What it does | Azure service |
|------|--------------|---------------|
| **API** | Handles login, property data, and file storage | App Service (web app) |
| **Frontend** | The website users see | Static Web Apps or App Service |
| **Data** | Property JSON files and user accounts | Azure Files or Blob Storage |

**Important:** Azure App Service uses temporary storage. If the server restarts, local files are lost. That's why we use Azure Files to store your data permanently.

---

## 2. Prerequisites

Before you start:

- [ ] An **Azure subscription** (the one you pay for)
- [ ] Your VillaManager project on your computer (this repo)
- [ ] **Azure CLI** installed (optional but helpful) — [Download](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- [ ] **Git** installed (for deploying the frontend)

---

## Part A: Create Storage for Your Data

We'll create an Azure Storage Account and a File Share to hold your property data and user files.

### Step A1: Sign in to Azure Portal

1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your Microsoft account (the one linked to your Azure subscription)
3. You should see the Azure Portal home page (dashboard)

### Step A2: Create a Resource Group

A resource group is a container for related resources (like a folder).

1. In the top search bar, type **Resource groups** and click it
2. Click **+ Create**
3. Fill in:
   - **Subscription:** your subscription (usually already selected)
   - **Resource group:** `villa-manager-rg` (or any name you prefer)
   - **Region:** choose one close to your users (e.g. `West Europe`)
4. Click **Review + create**, then **Create**

### Step A3: Create a Storage Account

1. In the top search bar, type **Storage accounts** and click it
2. Click **+ Create**
3. On the **Basics** tab:
   - **Subscription:** your subscription
   - **Resource group:** `villa-manager-rg` (select the one you created)
   - **Storage account name:** must be globally unique, e.g. `villamanagerdata123` (lowercase, numbers only)
   - **Region:** same as your resource group
   - **Preferred storage type:** choose **Azure Files** (we use a File Share to store property data and mount it to the API)
   - **Performance:** Standard
   - **Redundancy:** LRS (Locally-redundant storage) — fine for small apps
4. Click **Review** (you can leave other tabs at defaults)
5. Click **Create**
6. Wait for deployment to complete (notification appears top-right), then click **Go to resource**

### Step A4: Create a File Share

1. In the left menu of your storage account, under **Data storage**, click **File shares**
2. Click **+ File share**
3. Enter:
   - **Name:** `villamanager-data`
   - **Tier:** Transaction optimized (default)
4. Click **Create**

### Step A5: Create Folders and Upload Your Data

The portal’s **Upload** dialog only accepts individual files, not folders. Use one of the approaches below.

**Recommended structure inside the share:**

```
villamanager-data/
├── data/
│   ├── properties/
│   │   ├── charma-home/
│   │   ├── casa-sanguinazzo/
│   │   └── villa_janoula/
│   └── themes.json
└── data-private/
    └── users.json
```

**Option 1: Use the Azure Portal (manual)**

1. Close the Upload dialog.
2. On the file share page, click **+ Add directory** to create folders. Create:
   - `data`
   - Inside `data`: `properties`
   - Inside `properties`: `charma-home`, `casa-sanguinazzo`, `villa_janoula` (and any other property folders)
   - `data-private` (at the share root, same level as `data`)
3. Enter each folder by clicking its name, then use **Upload** to add files (e.g. `themes.json` in `data`, `users.json` in `data-private`, `data.json` in each property folder).
4. Repeat for each folder until all files are uploaded.

**Option 2: Use Azure Storage Explorer (recommended for large uploads)**

Azure Storage Explorer lets you drag-and-drop entire folders.

1. Download [Azure Storage Explorer](https://azure.microsoft.com/en-us/products/storage/storage-explorer/).
2. Sign in with your Azure account.
3. Locate your storage account → **File Shares** → `villamanager-data`.
4. Drag your local `data` and `data-private` folders (with contents) into the share, or use **Upload** → **Upload Folder**.

### Step A6: Get the Storage Connection Details

You'll need these for the API to connect to the file share.

1. In your storage account, click **Access keys** in the left menu (under Security + networking)
2. Click **Show** next to `key1` to reveal the key
3. Copy and store safely (you'll use it when configuring the API):
   - **Storage account name** (e.g. `villamanagerdata123`)
   - **Key** (the long string under key1) - see deployment-secrets.env

---

## Part B: Create and Configure the API (App Service)

### Step B1: Create a Web App for the API

1. In the top search bar, type **App services** and click it
2. Click **+ Create** → **Web app**
3. **Basics** tab:
   - **Subscription:** your subscription
   - **Resource group:** `villa-manager-rg`
   - **Name:** `villamanager-api` (or similar; will become `villamanager-api.azurewebsites.net`)
   - **Publish:** Code
   - **Runtime stack:** .NET 8 (or latest LTS)
   - **Operating System:** Linux (recommended) or Windows
   - **Region:** same as your resource group
   - **Pricing plan:** Free F1 for testing, or B1 for production
4. Click **Review + create**, then **Create**
5. Wait for deployment, then click **Go to resource**

### Step B2: Generate a Strong JWT Secret Key

Your API uses a secret key to sign JWTs. It must be long and random.

**Option 1 — PowerShell (Windows/Mac):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Option 2 — OpenSSL (Mac/Linux):**
```bash
openssl rand -base64 32
```

Copy the output - NSvcy8cszHinIO+PXayFOwhihOC5aPx/wDl6SCvqbkc= — you'll use it as `Auth.JwtKey`.

### Step B3: Add Application Settings (Environment Variables)

1. In your App Service (API), click **Environment Variables** in the left menu
2. Under **App settings**, click **+ Add**
3. Add these settings one by one (click **+ Add** for each):

| Name | Value | Notes |
|------|-------|-------|
| `Auth__JwtKey` | *(paste your generated key)* | The secret from Step B2 |
| `Auth__Issuer` | `PropertyManager` | Keep as-is unless you customize |
| `Auth__Audience` | `PropertyManager` | Keep as-is |
| `Auth__TokenLifetimeMinutes` | `120` | Token expiry in minutes |
| `PrototypeData__RootPath` | `/home/data/data` | Path to the `data` folder (see mount step below) |
| `PrototypeData__PublicBasePath` | `/data` | URL path for assets |
| `UserStore__UsersFile` | `../data-private/users.json` | Relative to RootPath (resolves to data-private) |
| `ThemeStore__ThemesFile` | `themes.json` | Relative to RootPath (in the data folder) |

> **Note:** Azure uses `__` (double underscore) for nested config. So `Auth.JwtKey` in appsettings becomes `Auth__JwtKey` here.

4. Click **Apply** at the bottom of the list
5. Click **Confirm** if prompted at the top about restarting the app

### Step B4: Mount the Azure File Share

1. In your App Service, click **Configuration** → **Path mappings** (or **Advanced tools** → **Go** → **SSH** for manual checks)
2. Click **+ Add Storage Mount**
3. Configure:
   - **Name:** `data`
   - **Configuration options:** Basic
   - **Storage accounts:** select your storage account
   - **Storage type:** Azure Files
   - **Protocol** SMB (Server Message Block is the usual protocol for Azure Files and works well with App Service)
   - **Storage container:** select your file share `villamanager-data`
   - **Mount path:** `/home/data`
   
   The share root will appear at `/home/data`. Your `data` and `data-private` folders inside the share will be at `/home/data/data` and `/home/data/data-private`.
4. Click **OK**, then **Save**

### Step B5: Enable CORS (Cross-Origin Requests)

The API only allows requests from `http://localhost:3000` by default. For production, you must add your frontend URL.

**Option 1 — Azure Portal (easiest):**
1. In your App Service, click **CORS** in the left menu (under API)
2. Under **Allowed Origins**, add:
   - `https://YOUR-FRONTEND-URL.azurestaticwebapps.net` (update after creating the frontend in Part C)
   - `http://localhost:3000` (for local development)
3. Enable **Access-Control-Allow-Credentials** if shown
4. Click **Save**

**Option 2 — Update the code:**  
If the portal CORS does not work with your setup, you’ll need to add the production URL to the `WithOrigins(...)` call in `Program.cs` and redeploy.

### Step B6: Deploy Your API Code

**Option 1 — Deploy from your computer (Zip Deploy):**

1. In your project folder, build and publish:
   ```bash
   cd /Users/ianturner/Dropbox/Dev/Web/VillaManager
   dotnet publish src/PropertyManager.Api/PropertyManager.csproj -c Release -o ./publish
   ```
2. Zip the contents of the `publish` folder (not the folder itself)
3. In the App Service, go to **Development Center** → **Advanced tools** → **Go** (opens Kudu)
4. In Kudu, go to **File Manager** → Go to site/wwwroot. Upload your zip there, dropping it on the message area to upload and automatically unzip it there.

**Option 2 — Deploy from GitHub (recommended for updates):**

1. Push your code to a GitHub repo
2. In your App Service, click **Deployment Center**
3. Choose **GitHub** as source
4. Authorize Azure to access your repo
5. Select your repo and branch
6. For **Build provider**, choose **GitHub Actions** (or App Service build)
7. Click **Save** — Azure will create a workflow and deploy

---

## Part C: Create and Configure the Frontend (Web app)

### Step C1: Create a Static Web App

1. In the Azure Portal search bar, type **Static Web Apps** and click it
2. Click **+ Create**
3. **Basics:**
   - **Subscription:** your subscription
   - **Resource group:** `villa-manager-rg`
   - **Region:** same as your other resources
   - **Name:** `villamanager-app`
   - **Plan type:** Free
   - **Deployment details:** choose your preferred source (e.g. GitHub)
4a. If using **GitHub:**
   - Sign in and authorize Azure
   - Choose your **Organization** and **Repository**
   - **Branch:** `main` (or your main branch)
   - **Build Presets:** Next.js
4b. If using **Other** (no GitHub/DevOps repo): Azure creates the Static Web App only. You deploy manually via **Step C1b**. Note: VillaManager needs full Next.js (SSR), so static export in C1b will fail — you’ll need **Step C1c** (GitHub or App Service) instead.
5. Review **Build configuration** (only shown when using GitHub/DevOps; skip if using Other):
   - **App location:** `frontend` (since your Next.js app is in the `frontend/` folder)
   - **Output location:** leave as default — Azure handles Next.js build output automatically
6. Click **Review + create**, then **Create**
7. Wait for the resource to be created. **Copy the URL** (e.g. `https://villamanager-app.azurestaticwebapps.net`)

### Step C1b: Deploy the Frontend When Using "Other" (Manual Deploy)

If you chose **Other** as the deployment source, deploy the frontend using the Azure Static Web Apps CLI.

1. **Get your deployment token**
   - In the Azure Portal, open your Static Web App
   - Go to **Overview** → **Manage deployment token**
   - Copy the token and store it safely

2. **Install the Azure Static Web Apps CLI** (if not already installed)
   ```bash
   npm install -g @azure/static-web-apps-cli
   ```

3. **Static export requirement**  
   Next.js must produce static files in an `out` folder for this deploy method. Add to `frontend/next.config.js`:
   ```js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true,
     output: 'export'
   };
   module.exports = nextConfig;
   ```
   - **VillaManager uses dynamic features** (searchParams, useSearchParams) that are not compatible with static export. If the build fails with errors like "couldn't be rendered statically" or "useSearchParams should be wrapped in a suspense boundary", use one of the alternatives in **Step C1c** below.

4. **Set the API URL for the build**
   ```bash
   export NEXT_PUBLIC_API_BASE_URL=https://YOUR-API-URL.azurewebsites.net
   ```
   - Replace `YOUR-API-URL` with your actual API App Service URL (e.g. `villamanager-api`), i.e.:

   ```bash
   export NEXT_PUBLIC_API_BASE_URL=https://villamanager-api.azurewebsites.net
   ```

5. **Build and deploy**
   - From your project root:
   ```bash
   cd frontend
   npm run build
   npx @azure/static-web-apps-cli deploy ./out --deployment-token YOUR_DEPLOYMENT_TOKEN --env production
   ```
   - Replace `YOUR_DEPLOYMENT_TOKEN` with the token from step 1

6. **Re-deploy after changes**
   - Whenever you change the frontend, run `npm run build` and the `swa deploy` command again

### Step C1c: When Static Export Fails — Use GitHub or App Service

VillaManager uses Next.js features (dynamic routes, searchParams, useSearchParams) that require server-side rendering. Static export will fail. Use one of these alternatives:

**Option A: GitHub deployment (recommended)**

1. Remove `output: 'export'` from `frontend/next.config.js` if you added it (GitHub build uses full Next.js)
2. Create a GitHub repo and push your VillaManager code
3. In the Azure Portal, open your Static Web App
4. Go to **Configuration** → **Deployment** (or **Deployment Center**)
5. Change the source from "Other" to **GitHub**
6. Connect your repo and select the branch (e.g. `main`)
7. Set **Build Presets** to Next.js, **App location** to `frontend`
8. Add `NEXT_PUBLIC_API_BASE_URL` in **Application settings** (Configuration) = your API URL
9. Save — Azure will build and deploy automatically on each push
10. Update API CORS to allow your Static Web App URL (see Step C3)

**Option B: Deploy the frontend to App Service (Node.js)**

1. Remove `output: 'export'` from `frontend/next.config.js` if you added it
2. In the Azure Portal, create a new **App Service** (Web app):
   - **Runtime stack:** Node 20 LTS
   - **Resource group:** `villa-manager-rg`
   - **Name:** e.g. `villamanager-app`
3. Add Application setting: `NEXT_PUBLIC_API_BASE_URL` = your API URL
4. Add Application setting: `SCM_DO_BUILD_DURING_DEPLOYMENT` = `true` (to run npm install and build)
5. Deploy the frontend:
   - **Easier:** Connect GitHub in **Deployment Center** — Azure will run `npm install` and `npm run build`, then `npm run start`
   - **Manual:** Zip-deploy the `frontend` folder after running `npm install` and `npm run build` locally (include `node_modules` and `.next`)
6. Configure the App Service to run `npm run start` after deployment (in **Configuration** → **General settings** → Startup Command: `npm run start`)
7. Update API CORS to allow your frontend App Service URL

### Step C2: Add the API URL to the Frontend

- **If using GitHub deployment (Static Web App):** In your Static Web App, go to **Configuration** → **Application settings**, add `NEXT_PUBLIC_API_BASE_URL` = `https://YOUR-API-URL.azurewebsites.net`, then **Save**.
- **If using App Service for frontend (Step C1c Option B):** Add `NEXT_PUBLIC_API_BASE_URL` in the App Service **Configuration** → **Application settings**.
- **If using "Other" (Step C1b):** The API URL is set as an environment variable before `npm run build` in C1b step 4. Application settings are not used for that variable.

### Step C3: Update API CORS with Frontend URL

1. Go back to your API App Service
2. **Configuration** → add/update `Cors__AllowedOrigins` to include your Static Web App URL
3. **CORS** blade → add `https://villamanager-app.azurestaticwebapps.net` to Allowed Origins
4. Save

---

## Part D: Upload Your Data

If you haven't already (Step A5):

1. Use **Azure Storage Explorer** or the **Portal** → **Storage account** → **File shares** → **villamanager-data**
2. Upload:
   - All property folders from `data/properties/` (e.g. charma-home, casa-sanguinazzo, villa_janoula)
   - `data/themes.json`
   - `data-private/users.json`
3. Ensure the folder structure matches what the API expects (see Step A5)

---

## Part E: Security Checklist

- [ ] **Auth.JwtKey** is a strong, random value (32+ bytes) and stored only in Azure config, never in code
- [ ] **users.json** is in `data-private/` and not exposed via public URLs
- [ ] CORS allows only your frontend origin(s), not `*`
- [ ] HTTPS is enforced (Azure does this by default for App Service and Static Web Apps)
- [ ] Storage account keys are kept secret; consider rotating them periodically
- [ ] You have a backup of your `data/` and `data-private/` contents
- [ ] Consider adding rate limiting on the login endpoint (future enhancement)
- [ ] Consider audit logging for property changes (future enhancement)

---

## Troubleshooting

### "API unreachable" or CORS errors
- Verify `NEXT_PUBLIC_API_BASE_URL` matches your API URL exactly (including `https://`)
- Check CORS in the API allows your frontend URL
- Restart the API App Service after changing CORS or app settings

### "Unauthorized" when logging in
- Confirm `Auth__JwtKey` is set in the API configuration
- Ensure `users.json` exists in the mounted file share at the path specified in `UserStore__UsersFile`

### Property data not loading
- Confirm the file share is mounted at `/home/data` and contains `data/properties/{id}/data.json`
- Check the API logs: App Service → **Log stream** or **Logs** (Application Insights)

### 404 for images or assets
- Verify `PrototypeData__PublicBasePath` is `/data` and the API is serving static files from the mounted path
- Check that image paths in `data.json` are relative and correct

---

## Adding a Custom Domain Later

When you buy a domain (e.g. from Namecheap, GoDaddy, or Azure), you can attach it to your Static Web App and API. This section covers using **Azure DNS** to host your domain.

### Step 1: Create an Azure DNS Zone

1. In the Azure Portal, search for **DNS zones** and click it
2. Click **+ Create**
3. Fill in:
   - **Subscription:** your subscription
   - **Resource group:** `villa-manager-rg` (same as your other resources)
   - **Name:** your domain (e.g. `miacasa.studio`)
4. Click **Review + create**, then **Create**
5. Go to the new DNS zone → **Overview**
6. Note the **name servers** (e.g. `ns1-01.azure-dns.com`, `ns2-01.azure-dns.net`, etc.)

### Step 2: Point Your Domain Registrar to Azure Nameservers

1. Log in to your domain registrar (where you purchased the domain)
2. Find the **Nameservers** or **DNS** settings for your domain
3. Replace the default nameservers with the four Azure nameservers from Step 1
4. Save changes — propagation can take up to 48 hours (often much less)

### Step 3: Add the Custom Domain to the Static Web App

1. In Azure Portal, open your **Static Web App** (e.g. `villamanager-app`)
2. Go to **Custom domains**
3. Click **+ Add**
4. Enter your domain (e.g. `miacasa.studio` or `www.miacasa.studio`)
5. Click **Next**
6. Azure will show two things you need:
   - **TXT record** (for domain ownership)
   - **A/ALIAS record** (for traffic)

### Step 4: Add the TXT Record (Domain Ownership)

1. In the Custom Domain details, under **Validate Domain Ownership**, copy the TXT **Value** (use the copy icon)
2. In your Azure DNS zone → **Record sets** → **+ Add**
3. Create a TXT record:
   - **Name:** `@` (root domain)
   - **Type:** TXT
   - **TTL:** 3600
   - **Value:** paste the exact value from Azure (e.g. `_mi1uoqr3m0whlvknrd9g6opc2wvl6r4`)
4. Click **Save**
5. It can take **up to 12 hours** for Azure to validate (often 15–60 minutes). Refresh the Custom domains page periodically.

**Verify TXT propagation:**

```bash
nslookup -type=TXT yourdomain.com ns1-01.azure-dns.com
```

Or use [dnschecker.org](https://dnschecker.org) with record type **TXT**. The TXT value in the response should match what Azure generated.

### Step 5: Add the A/ALIAS Record (Traffic)

1. In your Azure DNS zone → **Record sets** → **+ Add**
2. Create an A record:
   - **Name:** `@` (for root domain) or `www` (for www subdomain)
   - **Type:** A
   - **Alias record set:** Yes
   - **Alias type:** Azure resource
   - **Subscription:** your subscription
   - **Resource type:** Static site
   - **Resource:** select your Static Web App (e.g. `villamanager-app`)
3. Click **Save**

**Verify A record propagation:**

```bash
nslookup yourdomain.com
```

Or use [dnschecker.org](https://dnschecker.org) with record type **A**. The domain should resolve to Azure's IPs.

### Step 6: Wait for Validation

1. In the Static Web App → **Custom domains**, the domain status will show **Validating**
2. Once Azure detects the TXT record and validates ownership, the status changes to **Validated**
3. A managed certificate is automatically provided for HTTPS

If validation is stuck:
- Ensure the TXT value in your DNS zone **exactly matches** what Azure shows (no extra spaces, correct spelling)
- Query Azure's authoritative nameserver directly: `nslookup -type=TXT yourdomain.com ns1-01.azure-dns.com`
- Wait longer — Azure says up to 12 hours

### Step 7: Update API CORS

1. Go to your API App Service → **CORS**
2. Add your custom domain to **Allowed Origins** (e.g. `https://miacasa.studio`)
3. Click **Save**

### Step 8: Optional — Custom Domain for API (e.g. api.yourdomain.com)

If you want `api.yourdomain.com` for the API:

1. In the API App Service → **Custom domains** → **+ Add custom domain**
2. Enter `api.yourdomain.com`
3. Add the DNS record Azure specifies (usually CNAME)
4. Add `api.yourdomain.com` to CORS
5. Update `NEXT_PUBLIC_API_BASE_URL` in the frontend workflow to `https://api.yourdomain.com` and redeploy

---

## Quick Reference: Your URLs

| Purpose | URL |
|---------|-----|
| API | `https://villamanager-api.azurewebsites.net` |
| Frontend | `https://villamanager-app.azurestaticwebapps.net` |
| API Health Check | `https://villamanager-api.azurewebsites.net/api/health` |

---

*Last updated: February 2025*

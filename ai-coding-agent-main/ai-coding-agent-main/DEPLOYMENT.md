# 🚀 Deployment Guide: AI Code Generation Agent

This workspace is fully self-contained, lightweight, and pre-configured for instant deployment. 

Follow these step-by-step instructions to deploy your custom **AI Code Agent** platform for **FREE** using MongoDB Atlas, Vercel, and Render.

---

## 🗄️ 1. Database Setup: MongoDB Atlas (Free Tier)

Your application is configured with a robust fallback to local JSON database storage (`db.json`) so it runs instantly in development. For production, connect MongoDB Atlas using the following steps:

1. **Sign Up / Login**: Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. **Create a Database Cluster**:
   - Choose the **M0 Shared Free Tier** cluster.
   - Select your preferred cloud provider (e.g., AWS) and region nearest to your deployment.
3. **Database User Credentials**:
   - Navigate to **Database Access** under Security.
   - Click **Add New Database User**. Choose **Password** authentication, enter a username and a strong password, and select **Read and write to any database** permissions.
4. **Network Access**:
   - Navigate to **Network Access** under Security.
   - Click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) so that your hosting provider (Render) can securely query the database.
5. **Get Connection String**:
   - Go to the **Clusters** dashboard and click **Connect** on your cluster.
   - Choose **Connect your application** (Node.js driver).
   - Copy the connection URI. It will look like this:
     ```env
     MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/code_agent?retryWrites=true&w=majority"
     ```
   - Replace `<username>` and `<password>` with your database user credentials.

---

## 🖥️ 2. Backend Deployment: Render or Railway (Free Tier)

We recommend deploying your Node.js + Express backend on [Render](https://render.com/) or [Railway](https://railway.app/).

### Option A: Render
1. Create a free account on [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing this codebase.
4. Set the following Build and Start settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Click **Advanced** and add the following **Environment Variables**:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = *(Your Google AI Studio Gemini API key)*
   - `JWT_SECRET` = *(Any long random string, e.g., `supersecretkey2026`)*
   - `MONGODB_URI` = *(Your copied MongoDB connection string)*
6. Click **Create Web Service**. Once deployed, copy your backend's live URL (e.g., `https://ai-code-agent-backend.onrender.com`).

---

## 🎨 3. Frontend Deployment: Vercel (Free Tier)

Deploy your static Vite React bundle onto [Vercel](https://vercel.com/) for blazing-fast response speeds.

1. Sign up/Login to [Vercel](https://vercel.com/) using your GitHub account.
2. Click **Add New** > **Project** and select your GitHub repository.
3. Configure the build parameters:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variables**:
   - `VITE_API_URL` = *(Your live Render Backend URL, e.g., `https://ai-code-agent-backend.onrender.com`)*
5. Click **Deploy**. Vercel will bundle your assets and provide a fast, production-ready frontend URL!

---

## ⚙️ Environment Variables Summary (`.env.example`)

Document and load these parameters into your servers to secure operations:

| Variable Name | Required | Deployment Location | Purpose |
| :--- | :---: | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | Backend (Render) | Grants access to the Gemini AI models for generation, debugging, complexity analysis, and chatbots. |
| `JWT_SECRET` | **Yes** | Backend (Render) | Used for securing JWT authentication hashes and logins. |
| `MONGODB_URI` | *Optional* | Backend (Render) | Points to MongoDB Atlas Cluster. Defaults to persistent local JSON db if not provided. |
| `VITE_API_URL` | *Optional* | Frontend (Vercel) | Tells the Vite React application where to route fetch queries. Defaults to origin during monolithic builds. |

---

## ✨ Features & Verification

- **Automatic Fallback**: If `MONGODB_URI` is omitted, the workspace securely falls back to a locally persistent database file (`db.json`) preserving your sessions during evaluations.
- **Client-Side ZIP Scaffolding**: Code Scaffolder packs archives client-side using `jszip` for secure, zero-latency zips! No extra disk space is consumed on Render.
- **Complexity Visualization**: Visual dashboards calculate metrics using animated SVG/Tailwind bars for Readability, Security, and Maintainability.

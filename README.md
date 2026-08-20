# PaisaTrack 💰

**PaisaTrack** is a modern personal expense and budget tracking web application designed for hostelers and students. Built with **React 19**, **Vite**, **TailwindCSS**, **Firebase Authentication**, and **Cloud Firestore**.

Live GitHub Pages Demo: [https://kaushik108-ux.github.io/Paisa-Track/](https://kaushik108-ux.github.io/Paisa-Track/)

---

## ✨ Features

- **Cross-Device Real-Time Synchronization**: Log in with the same email and password on any phone, tablet, or laptop to access the exact same expenses, budgets, and insights.
- **Firebase Authentication**: Secure Email/Password registration, persistent login session across device reloads, logout, and password recovery.
- **Cloud Firestore**: Seamless cloud data storage scoped to each user's unique Firebase UID (`users/{uid}/expenses` and `users/{uid}/budgets`).
- **Real-Time Analytics & Smart Insights**:
  - Interactive Donut & Category Comparison Charts (Recharts)
  - Recommended Daily Spending Limit calculation based on remaining days in the month
  - Month-over-Month (MoM) spending comparison
  - Category item breakdowns
  - Budget warnings (Normal, Warning >70%, Critical >85%, Exceeded >100%)
- **Custom Indian Currency Formatting**: Formatted in `₹` INR (e.g., `₹1,25,000`).
- **Fast, Serverless Architecture**: Operates directly with Firebase SDK without requiring a separate backend service or SQLite database.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Icons & Visuals**: Lucide React, Recharts
- **Auth & Database**: Firebase Authentication, Cloud Firestore

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Firebase](https://console.firebase.google.com/) Project

### 2. Configure Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project (e.g., `paisatrack`).
2. Enable **Authentication**:
   - Go to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password**.
3. Create a **Firestore Database**:
   - Go to **Build > Firestore Database > Create database**.
   - Start in **Production mode** (or test mode during setup).
4. Set Firestore Security Rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         match /{allSubcollections=**} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
   }
   ```
5. Register a Web App in Firebase Project Settings and copy the configuration keys.

### 3. Environment Variables

Create a `.env` file in the `frontend` directory (see [frontend/.env.example](file:///frontend/.env.example)):

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

### 4. Install & Run Locally

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

Visit `http://localhost:3000/Paisa-Track/` in your browser.

---

## 📦 Deployment to GitHub Pages

The repository includes a GitHub Actions workflow in [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml) that automatically builds and deploys the Vite application to GitHub Pages upon pushing to `main`.

To enable Firebase on GitHub Pages:
1. In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
2. Add your `VITE_FIREBASE_*` environment variables as Repository Secrets or Variables.

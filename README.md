# FitSync 🏋️‍♂️

FitSync is a modern, offline-first Progressive Web App (PWA) designed to track workouts, manage routines, and visualize fitness progress. It features a premium "Digital Cellar" glassmorphism aesthetic and robust synchronization between a local-first frontend and a scalable backend.

## ✨ Features

- **📱 Offline-First Architecture**: Built with a local-first mindset using **IndexedDB (Dexie.js)**. Works perfectly without an internet connection and syncs automatically when online.
- **🎨 Premium UI/UX**: deeply customized **Glassmorphism** design system with blur effects, neon accents, and smooth **Framer Motion** animations.
- **📚 Rich Exercise Library**: Integrated with **ExerciseDB** to provide over 1300+ exercises with details on muscle targets, equipment, and difficulty.
- **🏋️‍♀️ Smart Dashboard**:
  - Filter exercises by **Available Equipment** (Dumbbells, Bodyweight, Machines, etc.).
  - Browse by **Target Muscle Group** (Chest, Back, Legs, etc.).
  - View detailed animations and instructions for every movement.
- **🔐 Secure Authentication**: JWT-based authentication system with secure login and registration.
- **🔄 Background Sync**: Custom sync engine ensuring data consistency between the client and server.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Local Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Server**: [Fastify](https://fastify.io/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: SQLite (Dev) / PostgreSQL (Production ready)
- **API Integration**: RapidAPI (ExerciseDB)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/fitsync.git
    cd fitsync
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd ../backend
    npm install
    ```

### Configuration (.env)

**Backend (`backend/.env`):**
```env
PORT=3001
JWT_SECRET=your_super_secret_jwt_key
DATABASE_URL=file:local.db
RAPIDAPI_KEY=your_rapidapi_key_here
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Running the App

1.  **Start the Backend:**
    ```bash
    cd backend
    npm run dev
    # Server runs on http://localhost:3001
    ```

2.  **Seed the Database (Optional but Recommended):**
    To fetch exercises and images:
    ```bash
    # In backend directory
    npm run seed:exercises
    ```

3.  **Start the Frontend:**
    ```bash
    cd frontend
    npm run dev
    # App runs on http://localhost:3000
    ```

## 📸 Screenshots
*(Add your screenshots here)*

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.

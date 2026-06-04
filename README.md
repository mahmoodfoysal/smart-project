# Smart Project and Task

A smart project and task collaboration system.

## Live Demo

- Live URL: [https://smart-project-task.netlify.app/](https://smart-project-task.netlify.app/)

## Repository

- GitHub Client: [https://github.com/mahmoodfoysal/smart-project](https://github.com/mahmoodfoysal/smart-project)
-
- GitHub Backend: [https://github.com/mahmoodfoysal/smart-project-backend](https://github.com/mahmoodfoysal/smart-project-backend)

## Technologies Used

- Next.js
- Redux Toolkit
- Tailwind CSS
- MongoDB
- Firebase
- Node.js
- Express.js
- JWT Token
- Apex Chart
- Sweet Alert 2

## Protected Route

- Full website have protected route. Without login user can not access any page.
- Admin can access all page.
- Project manager can access project, my task, overview.
- Team member can access my task, overview.

## Public Route

- Login
- Register

## Key Features

- Admin and project manager can see all the running task and progress in the overview.
- Team member can see his assing task and status from overview.
- Admin have full access to this website.
- Only Admin Can create user.
- Project manager can create project assign tasks.
- Team Member can view their assigned tasks and change status.
-

## Short Description

- Admin : Admin have access full website.
- Manage User: Only admin can add or any action for manage user.
- Project Management : Project manager can assign new project add member and assign task. Here also apply some filter. manager can see filter wise.
- My task : Team member can view their assigned tasks and change status. Team member can only view his assing task and change status.

## note: If you need admin dashboard credentials. Please contact with me.

## Setup and Installation

### 1) Clone the repository

```terminal
git clone https://github.com/mahmoodfoysal/smart-project.git
cd smart-project
```

### 2) Install dependencies

```terminal
npm install
```

### 3) Configure environment variables

Create a `.env.local` file in the root directory and add:

```env

NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

```

Do not commit `.env.local` to version control.

### 4) Run the development server

```terminal
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5) Build for production

```terminal
npm run build
```

# LifeLog App (Continuous Life/Schedule Tracking System)

A mobile and web-based application designed to help users track and manage
their daily activities. The system includes features such as class/work
schedules, weather updates, fitness tracking, AI-driven journal summaries, and
task management.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

This application allows users to:

- **Track daily routines** such as class and work schedules.
- **View real-time weather updates.**
- **Monitor daily steps** using a fitness tracker or phone sensor.
- **Record journal entries** with AI-powered summaries.
- **Manage tasks** with a to-do list, prioritization, and AI-based suggestions.
- **Analyze mood** based on journal content.

The app is designed to be user-friendly and work across web and mobile
platforms.

## Features

- **Dashboard:** Displays daily routines, weather updates, and steps.
- **Journal:** Write daily experiences with AI-generated summaries and mood
  analysis.
- **To-Do List:** Create, edit, prioritize, and complete tasks with AI
  suggestions.
- **Real-time Updates:** Weather, steps, and routine updates are dynamically
  displayed.
- **User Preferences:** Customize notification and display preferences.
- **Security:** Protect user data and support secure storage and backups.

## Functional Requirements

1. View class and work routines on the dashboard.
2. Show real-time weather updates.
3. Monitor daily steps using fitness trackers or phone sensors.
4. Create, edit, and delete journal entries.
5. Create, edit, prioritize, and delete tasks.
6. Provide AI-generated journal summaries.
7. Provide AI-based task suggestions and mood analysis.
8. Update personal preferences and settings.
9. Support user authentication and logout.
10. Refresh the dashboard to display updated data.

## Non-Functional Requirements

1. Dashboard data should load within 3 seconds.
2. The interface should be easy to use and intuitive.
3. User data should be securely stored.
4. The system should target 99% availability.
5. The system should support increasing user loads.
6. The app should support both mobile and web platforms.
7. Weather, step counts, and AI suggestions should be accurate.
8. The system should use a modular design.
9. User data should support regular backups.
10. User content should not be shared with third parties without permission.

## Technology Stack

- **Frontend:** React Native with Expo and React Native Web
- **Backend:** Node.js with Express.js and TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **AI:** OpenAI for journal summaries, task suggestions, and mood analysis
- **Weather:** OpenWeatherMap API
- **Deployment:** Docker, Kubernetes, AWS, or Heroku

## Installation

### Prerequisites

- Node.js and npm
- MongoDB
- Expo CLI or the Expo Go mobile app

### Backend

```powershell
cd backend
npm install
```

Create a `backend/.env` file and add your MongoDB connection string:

```env
MONGO_URI=your_mongodb_connection_string
PORT=4000
```

Start the backend in development mode:

```powershell
npm run dev
```

The API runs at `http://localhost:4000`.

### Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm start
```

To run the web version directly:

```powershell
npm run web
```

## Usage

After starting both the backend and frontend, open the Expo development server
or scan its QR code using Expo Go. For web, press `w` in the Expo terminal or
run `npm run web`.

## Contributing

1. Create a feature branch.
2. Make your changes and test them locally.
3. Commit your changes with a descriptive message.
4. Open a pull request.

## License

This project is currently intended for educational use.

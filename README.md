# Mini Games

An evolving collection of fast, fun, browser-based mini games — built with performance, clean design, and consistency in mind. The platform follows a reusable layout system to maintain a unified look and feel across all game pages.

## Features

- **Unified Layout System**: Maintains a consistent aesthetic across all game pages.
- **Smooth Animations**: Seamless page transitions and micro-interactions powered by Framer Motion.
- **Responsive Design**: Playable on desktop, tablet, and mobile devices thanks to Tailwind CSS.
- **Fast & Lightweight**: Built with Vite and React 19 for optimal performance.

## Current Games

1. **Memory Game** - Train your visual memory by finding matching pairs.
2. **Tic Tac Toe** - The classic strategy challenge you know and love.
3. **Flash Memory** - A speed-reading and retention test to push your cognitive limits.
4. **Chroma Clash** - A Stroop effect color challenge to test your reaction time.

> **Note:** This project is currently in **BETA**. More games are continuously being added!

## Tech Stack

- **Core**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Analytics**: Vercel Analytics

## Project Structure

```text
MiniGames/
├── public/                # Static public assets
├── src/
│   ├── assets/            # Visual design assets (images, SVGs)
│   ├── components/        # React components and game screens
│   │   ├── common/             # Reusable global components
│   │   │   ├── BackButton.jsx      # Global navigation back button
│   │   │   ├── GamesList.jsx       # Main menu / game selection screen
│   │   │   ├── IndianFlag.jsx      # Flag rendering component
│   │   │   ├── PageTransition.jsx  # Framer Motion transition wrapper
│   │   │   └── Presets.jsx         # UI presets and shared elements
│   │   ├── games/              # Individual game components
│   │   │   ├── ChromaClash.jsx     # Chroma Clash game component
│   │   │   ├── FlashMemoryGame.jsx # Flash Memory game component
│   │   │   ├── MemoryGame.jsx      # Memory matching game component
│   │   │   └── TicTacToe.jsx       # Tic Tac Toe game component
│   │   └── layout/             # Page layout components
│   │       └── LandingPage.jsx     # Homepage and hero section
│   ├── App.css            # App-specific styling
│   ├── App.jsx            # Routing and layout structure
│   ├── index.css          # Global styles and Tailwind imports
│   └── main.jsx           # Client entry point
├── .env                   # Environment variables
├── .gitignore             # Git ignore file
├── eslint.config.js       # ESLint configuration
├── index.html             # HTML entry point
├── package.json           # Project dependencies and scripts
├── vite.config.js         # Vite configuration file
└── README.md              # Main project documentation
```

## How to Run Locally

To get a local copy up and running, follow these simple steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dipanjan2907/MiniGames.git
   cd MiniGames
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173` (or the port provided in your terminal).

## What's Next?

As mentioned, there are many more games and enhancements on the roadmap! 

- [ ] Add more mini-games (e.g., Typing test, Simon Says, etc.)
- [ ] Implement global leaderboards
- [ ] Add user profiles and progress tracking
- [ ] Sound effects and music toggles

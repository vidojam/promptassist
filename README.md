# PromptAssist

PromptAssist is a modern responsive web app for generating structured app prompts using selectable rows and custom subtopics.

## Stack

- React
- TypeScript
- JavaScript tooling (Vite config/scripts)
- Tailwind CSS

## Features

- Client name field that updates the checkmark column heading.
- Row-based prompt builder with:
  - include checkbox per row
  - subtopics textarea per row
- Built-in row subjects:
  - Goal
  - Tech Stack
  - Style and Visual Direction
  - Page Structure
  - Hero Section Left
  - Hero Section Right
  - Social Proof
  - How it works (3 steps)
  - Feature Highlights
  - Features
  - App Preview Section
  - Promo Banner
  - Final CTA section
  - Footer
  - Animations and interactions
  - Responsiveness
  - Accessibility
  - Deleverable
- Actions:
  - Check all
  - Clear all
  - Generate prompt
  - Copy prompt
- Accessible labels/status messaging and responsive layout.

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:5173`).

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Project Structure

- `src/App.tsx` - main prompt builder UI and logic
- `src/main.tsx` - React entry point
- `src/index.css` - Tailwind imports and base styles
- `tailwind.config.js` - Tailwind content config
- `postcss.config.js` - PostCSS plugin config
- `vite.config.ts` - Vite config

<div align="center">

# 🌐 iLmi — Web OS & Interactive Portfolio

An interactive, responsive Web Operating System built with modern web technologies, serving as an interactive personal portfolio and showcase.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443e38?style=flat-square)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Live Demo](https://zulilmiihsn.github.io/iLmi) • [Key Features](#-key-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started)

</div>

---

## ⚡ Overview

**iLmi** transforms a traditional developer portfolio into a functional, immersive Web Operating System. It features dual device paradigms (Desktop OS and Mobile Phone OS interfaces), complete window management, persistent state, drag-and-drop icon placement, and built-in interactive native-style applications.

---

## ✨ Key Features

### 🖥️ Desktop OS Experience
- **Window Management System**: Multitasking window manager supporting smooth dragging, resizing, maximizing, minimizing to dock, and dynamic z-index focusing.
- **Draggable Desktop Workspace**: Interactive desktop icon grid powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
- **Top Menu Bar & Dynamic Dock**: Real-time status bar, contextual application menus, quick settings, and glassmorphic app dock.
- **Boot Sequence & Lock Screen**: Authentic simulated boot loader and lock screen.

### 📱 Adaptive Mobile Mode
- **Mobile OS Paradigm**: Dedicated mobile view with iOS/Android-inspired app launcher, swipe gestures, and integrated notification/status bar.
- **Responsive Layout Engine**: Seamless transition between desktop multi-window mode and mobile single-app full-screen flow.

### 📦 Built-In Application Suite
| Application | Description |
| :--- | :--- |
| **Finder / File Explorer** | Hierarchical file browser showcasing projects, assets, and about info |
| **Terminal** | Interactive command-line interface with custom command execution and help system |
| **Notes** | Note-taking app with search, markdown preview, and state persistence |
| **Photos** | Grid gallery viewer with lightbox inspection and image filters |
| **Camera** | Real-time web camera integration with snapshot capture capabilities |
| **Calendar & Clock** | Live world clock, stopwatch, timer, and interactive monthly planner |
| **Calculator** | Full-featured glassmorphic calculator |
| **Settings** | System preference panel with theme toggles, wallpaper selectors, and display settings |
| **Mail & Maps** | Interactive mock email client and location explorer |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI & Styling**: [Tailwind CSS 4](https://tailwindcss.com/), Glassmorphic HUD Tokens
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/) (`core`, `sortable`, `modifiers`, `utilities`)
- **Icons**: FontAwesome Free & Custom SVG primitives
- **Package Manager**: pnpm

---

## 📂 Architecture & Directory Structure

```text
iLmi/
├── app/                  # Next.js App Router root layout & main entry point
├── components/           # UI Components
│   ├── Apps/             # App implementations (Finder, Notes, Terminal, Photos, etc.)
│   ├── Desktop/          # Desktop components (MenuBar, Dock, WindowManager, DesktopIcons)
│   ├── Mobile/           # Mobile OS view (HomeScreen, StatusBar, Gestures)
│   ├── BootScreen.tsx    # Boot splash animation
│   └── ErrorBoundary.tsx # React error containment
├── constants/            # System configuration, apps registry, initial file tree
├── stores/               # Zustand state stores (windows, apps, system preferences)
├── styles/               # Global CSS & Tailwind layers
├── types/                # TypeScript interface and type definitions
└── utils/                # Helper utilities & device detectors
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- pnpm (recommended) or npm / yarn

### Installation

1. **Clone repository**:
   ```bash
   git clone https://github.com/zulilmiihsn/iLmi.git
   cd iLmi
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start local development server**:
   ```bash
   pnpm dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
pnpm build
pnpm start
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Crafted by <a href="https://github.com/zulilmiihsn"><strong>Zul Ilmi Ihsan</strong></a>
</div>

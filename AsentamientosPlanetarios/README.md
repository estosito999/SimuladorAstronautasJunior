# ZERO-G — Build. Survive. Explore.

> **Junior Astronaut Mission Trainer**  
> Developed for the **NASA Space Apps Challenge** by **Team 55 CANCRI E**  
> 🌐 **Live Demo:** [https://zero-g-55cancrie-c4nsac.netlify.app/](https://zero-g-55cancrie-c4nsac.netlify.app/)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)](https://zero-g-55cancrie-c4nsac.netlify.app/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R169-black?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/mdshopnil071/ZERO-G-Junior-Astronaut-Trainer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🌐 Live Demo & Deployment

Try the mission trainer live in your browser (no setup required):  
🚀 **[https://zero-g-55cancrie-c4nsac.netlify.app/](https://zero-g-55cancrie-c4nsac.netlify.app/)**

---

## 🚀 Overview & Mission Purpose

**ZERO-G** is an interactive, browser-based space outpost survival and resource management simulator designed to train the next generation of space explorers. Set on the harsh surfaces of the **Moon** and **Mars**, players step into the boots of a mission commander tasked with designing an outpost, allocating critical mission budgets, and keeping their crew alive across multi-cycle planetary expeditions.

Built around the core educational philosophy of **Decision → Consequence → Learning**, ZERO-G transforms complex space exploration challenges—such as solar radiation, life support consumption, brownouts, and dust accumulation—into an intuitive and deeply engaging gamified training experience.

---

## ✨ Key Features

### 🪐 1. 3D Interactive Planetary Environments
- Fully interactive 3D Moon and Mars scenes powered by **Three.js** and **React Three Fiber**.
- Stylized, low-poly, toon-shaded terrain, dynamic rovers, atmospheric effects, and outpost structures.
- Lightweight and optimized for smooth performance across modern mobile and desktop browsers with automatic WebGL fallbacks.

### 🏗️ 2. Modular Outpost Builder
- Choose your expedition target: **The Moon** (Shackleton Crater) or **Mars** (Jezero Crater).
- Manage budget and payload constraints to construct vital modules:
  - **Life Support Systems**: Oxygen recyclers, water scrubbers, greenhouses.
  - **Power Generation & Storage**: Solar arrays, nuclear Stirling engines, battery banks.
  - **Shielding & Habitats**: Regolith radiation shielding, inflatable crew habitats.
  - **Scientific Payloads**: Communications relays, planetary laboratories, sample analysis hubs.

### ⚙️ 3. Realistic Survival & Resource Engine
- **Pure, deterministic simulation** calculating cycle-by-cycle consumption and production rates.
- **Power Grid Management**: Solar generation drops during dust storms, night cycles, or solar eclipse events. Brownouts cascade into life support cuts.
- **Radiation Exposure**: Cumulative cosmic rays and solar particle events threaten crew health unless insulated by regolith shields or storm shelters.
- **Early-Warning Forecasts**: Installing a Communications Relay unlocks predictive forecasts for upcoming hazards.

### ⚠️ 4. Hazard Management & Tactical Decisions
- Dynamic, seeded hazard engine introducing dust storms, micrometeoroid impacts, solar proton events, and equipment failures.
- Critical dilemmas requiring tactical decisions: evaluate risks, read real-world NASA context, and accept trade-offs that directly affect survival and final scores.

### 📊 5. Mission Debrief & Evaluation
- Comprehensive mission grading based on 8 weighted criteria (crew health, scientific yield, energy efficiency, hazard management, etc.).
- Detailed post-mission debrief breaking down **best decisions**, **risky moves**, and actionable **lessons learned**.

### 🎵 6. Procedural Web Audio Engine
- 100% synthesized audio generated natively via the **Web Audio API** (no audio assets to download).
- Ambient space drones, atmospheric wind synthesis, UI clicks, alerts, and victory/defeat stingers with configurable volume and mute controls.

### ♿ 7. Accessibility & Mobile Optimization
- Dual-indicator status telemetry (icons + labels, never color-only).
- Touch-friendly 44px minimum target sizes, visible focus rings, and reduced-motion settings.
- Fully offline-ready: zero backend dependencies and client-side persistence via `localStorage`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) |
| **3D Graphics & Rendering** | [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei) |
| **Styling & Design System** | [Tailwind CSS 3](https://tailwindcss.com/), [PostCSS](https://postcss.org/), [Autoprefixer](https://github.com/postcss/autoprefixer) |
| **Animation & Micro-interactions** | [Framer Motion](https://www.framer.com/motion/) |
| **Data Visualization & Telemetry** | [Recharts](https://recharts.org/) |
| **Audio Synthesis** | Native HTML5 [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| **State & Navigation** | Deterministic state machine architecture (`home → briefing → destination → setup → loading → builder → launch → control → report`) |

---

## 📁 Project Structure

```text
zero-g/
├── public/                 # Static assets and icons
├── scripts/
│   └── simulate.mjs        # Headless game engine balance simulator
├── src/
│   ├── audio/              # Synthesized Web Audio engine & sound effects
│   ├── components/         # HUD gauges, event modals, astronaut guide, pause menu
│   ├── data/               # Planetary parameters, module specs, hazard tables, NASA facts
│   ├── game/               # Pure deterministic simulation engine (resource, hazard, score)
│   │   ├── decisionSystem.js
│   │   ├── gameEngine.js
│   │   ├── hazardSystem.js
│   │   ├── missionSystem.js
│   │   ├── resourceSystem.js
│   │   └── scoringSystem.js
│   ├── hooks/              # Custom React hooks (game loop, audio, window size)
│   ├── pages/              # Flow screens (Briefing, OutpostBuilder, MissionControl, etc.)
│   ├── scenes/             # 3D R3F components (MoonScene, MarsScene, Rover, Base models)
│   ├── utils/              # Math helpers, formatting, storage utilities
│   ├── App.jsx             # Top-level screen coordinator & state controller
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global Tailwind styles & layout definitions
├── index.html              # Entry HTML template
├── package.json            # Project manifest & dependencies
├── tailwind.config.js      # Custom theme, typography & color palette
└── vite.config.js          # Vite build & chunking configuration
```

---

## 🚦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version **18.0.0** or higher) and `npm` installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mdshopnil071/ZERO-G-Junior-Astronaut-Trainer.git
   cd ZERO-G-Junior-Astronaut-Trainer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with hot module replacement (HMR). |
| `npm run build` | Compiles and bundles production-ready assets into the `dist/` directory. |
| `npm run preview` | Locally serves the production build from `dist/` for verification. |
| `npm run test:engine` | Runs a headless balance simulation of the game engine directly in Node.js (no browser required) to verify win/loss ratios across difficulty levels. |

---

## 🛰️ NASA Science & Educational Realism

ZERO-G incorporates real space science concepts and research cited in `src/data/nasaSources.js`, including:
- **Artemis Program & Lunar Regolith**: Utilizing in-situ resource utilization (ISRU) and lunar soil for passive radiation protection.
- **Mars Design Reference Architecture**: Balancing solar power degradation against severe martian dust storm seasons.
- **Closed-Loop Life Support (ECLSS)**: Simulating real International Space Station (ISS) water recovery and oxygen generation dynamics.

> *Note: While module balances, resource consumption numbers, and hazard probabilities are calibrated for gameplay and learning pacing, all scientific foundations are directly inspired by publicly available NASA publications.*

---

## 👥 The Team — Team 55 CANCRI E

Proudly developed for the **NASA Space Apps Challenge** by **Team 55 CANCRI E**:

| Member | Role |
| :--- | :--- |
| **Md. Khairul Anam Shopnil** | Mission Architect |
| **Ibnul Jobayer Hossain** | Mission Architect |
| **Farhana Hossain Asmi** | Recon Navigator |
| **Kazi Adiba Rahman Adhora** | Creative Designer |
| **Rashedul Islam Robin** | Research Curator |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.

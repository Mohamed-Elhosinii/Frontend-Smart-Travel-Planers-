# Vantio — Frontend Application

**Vantio** is an enterprise-grade, AI-powered travel-planning Single-Page Application (SPA) built with **Angular**. It transforms user preferences into polished, day-by-day itineraries—complete with smart budgets, real-time weather forecasts, interactive mapping, and seamless offline PDF exports.

🌐 **Live Demo:** [Check out the live application here](https://frontend-smart-travel-planers.vercel.app/)

This repository contains the frontend codebase. For the backend API (.NET Core Web API & AI Orchestration), please refer to the backend repository.

---

## 🌟 What Vantio Does

Vantio is organized around seamless, user-centric journeys:

| Area | Route | What it offers |
| --- | --- | --- |
| **Landing** | `/` | Marketing hero, feature highlights, and the entry point into planning. |
| **Authentication** | `/login`, `/signup` | Secure login, registration, password recovery, and Google OAuth 2.0 flows. |
| **Trip Planner** | `/plan` | Captures the trip brief (destinations, dates, budget, preferences) to generate AI-driven itineraries. |
| **My Trips** | `/my-trips` | A personalized dashboard listing the user's planned and saved trips. |
| **Itinerary View** | `/itinerary/:id` | Day-by-day timeline, flight & hotel details, interactive map, and 1-click PDF export. |
| **Admin Dashboard**| `/admin` | Comprehensive analytics for managing user roles, subscription tiers, and transaction metrics. |

> **Backend Integration:** Vantio's frontend is fully integrated with a robust **ASP.NET Core Web API**. All complex operations—including AI orchestration via Semantic Kernel, payment processing via Paymob, and data fetching from third-party APIs (AirLabs, StayAPI, Foursquare, Visual Crossing)—are securely handled by the backend and seamlessly consumed by this Angular client via RESTful endpoints.

---

## 🛠️ Tech Stack

| Concern | Technology |
| --- | --- |
| Framework | **Angular** (TypeScript, RxJS) |
| Styling | **Bootstrap 5**, HTML5, CSS3 |
| State & APIs | **RxJS Observables**, Angular HTTP Client |
| Interactive Maps | **Leaflet.js** & OpenStreetMap |
| Document Export | **jsPDF** |
| Authentication | **JWT** (Access/Refresh Token Rotation) |
| Tooling | Angular CLI, Git, GitHub |

---

## 🏗️ Architecture at a Glance

The frontend is built with a strong focus on modularity, performance, and clean code principles. It utilizes a layered, feature-first architecture:
*   **Core Module:** Houses singleton services for HTTP API calls, JWT interceptors, auth guards, and global error handling.
*   **Shared Module:** Contains reusable UI components (custom buttons, modals, loaders) and pipes used across the application.
*   **Feature Modules:** Lazy-loaded modules (e.g., Auth, Itinerary, Admin) to ensure optimal bundle sizes and fast initial load times.
*   **Dynamic UI Integrations:** Complex DOM manipulations for rendering interactive maps (Leaflet) and generating downloadable client-side PDFs (jsPDF) are encapsulated within dedicated services.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **Angular CLI**

### Install & Run

```bash
# 1. Clone the repository
git clone [https://github.com/YourUsername/Frontend-Smart-Travel-Planers.git](https://github.com/YourUsername/Frontend-Smart-Travel-Planers.git)
cd Frontend-Smart-Travel-Planers

# 2. Install dependencies
npm install

# 3. Start the development server
npm start

# TaskFlow: Enterprise Work Management Platform

TaskFlow is an enterprise-grade work management platform built with React, TypeScript, Ruby on Rails, PostgreSQL, Redis, and Sidekiq. It features multi-tenancy, RBAC, Kanban boards, sprint planning, real-time collaboration, notifications, audit logs, analytics, and scalable API architecture following modern software engineering best practices.

---

## 🎯 Project Vision
TaskFlow is engineered as a production-ready SaaS solution, prioritizing scalability, security, and developer velocity. It serves as a comprehensive demonstration of senior-level engineering, bridging the gap between high-level strategic planning and granular task execution.

---

## 🛠 Tech Stack
* **Frontend:** React 19, TypeScript, TanStack Query, Zustand, Tailwind CSS, Shadcn UI
* **Backend:** Ruby on Rails 8 (API-only), PostgreSQL, Redis, Sidekiq, ActionCable
* **Infrastructure:** Docker, GitHub Actions, AWS

---

## 🏗 Key Engineering Features
* **Multi-Tenant Architecture:** Isolated data ownership per organization.
* **Granular RBAC:** Role-Based Access Control using Pundit.
* **Event-Driven Design:** Decoupled architecture using domain events for notifications and audit logging.
* **Real-Time Collaboration:** Powered by Rails ActionCable and WebSockets.
* **Background Processing:** Resilient job queue management via Sidekiq.
* **Full-Text Search:** High-performance search powered by PostgreSQL.

---

## 🚀 Getting Started
1. **Clone the repository:** `git clone https://github.com/your-org/TaskForge.git`
2. **Launch Infrastructure:** `docker-compose up --build`
3. **Initialize Backend:** `cd backend && rails db:setup && rails s`
4. **Initialize Frontend:** `cd frontend && bun install && bun dev`

---

## 🤝 Contributing
We welcome contributions that align with our architectural standards. Please review the [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

---

## 📄 License
This project is proprietary and governed by the **MIT License**.
# TaskFlow-

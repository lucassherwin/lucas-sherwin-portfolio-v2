---
title: Rails URL Shortener
date: 2026-05-05T00:00:00.000Z
summary: A URL Shortener built on Rails + React
metaDescription: Lucas Sherwin URL Shortener. Built with Rails + React
tags:
  - rails
  - react
  - docker
---

# URL Shortener

https://github.com/lucassherwin/rails-url-shortener

**Stack:** Ruby on Rails 8 · React 19 · TypeScript · PostgreSQL · Solid Queue · Docker · Kamal

---

## Task

Build a full-stack URL shortener that lets authenticated users and guests shorten links, track click analytics, and manage their URLs through a modern web interface.

Include features such as:
- Docker
- Auth
- Task Queues
- SSR

---

## Solution

### Architecture

The application follows a Rails 8 API + React frontend pattern, with React components embedded in ERB views via **React on Rails** and **Shakapacker**. Background work is offloaded to **Solid Queue**, a database-backed job queue shipped with Rails 8 that eliminates the need for Redis or Sidekiq in production.

### Backend

- **Rails 8.1** with PostgreSQL 16. URL records store a long URL, a unique 7-character alphanumeric alias (auto-generated via `SecureRandom.alphanumeric` or user-supplied), an optional expiration timestamp, and a counter cache for click counts.
- **Authentication** uses Rails 8's built-in `has_secure_password` with session-based auth, signed cookies, and `ActiveSupport::CurrentAttributes` for thread-safe current-user context. Login is rate-limited to 10 attempts per 3 minutes using Rails 8's built-in rate limiting.
- **Guest support** is handled by issuing a UUID `guest_token` stored in the session, which is tagged to any URLs created without an account — allowing anonymous users to view their own recent links without logging in.
- **Click tracking** is non-blocking: the redirect controller immediately issues a `301` and enqueues a `TrackClickJob` with the request context (referrer, user agent, IP, timestamp). The job writes a `Click` record and increments the counter cache.

### Frontend

- **React 19 + TypeScript** with strict mode and path aliases (`@/*`).
- **TanStack React Query** manages server state — the recent URLs list is automatically invalidated and refetched after a successful shorten request.
- **Tailwind CSS 4** and **shadcn/ui** (Radix UI primitives) compose the component library. A design-system layer (`@/design-system/*`) wraps shadcn components to enforce consistent variants across the app.
- Custom hooks (`useShortenUrl`, `useRecentUrls`, `useFetch`) encapsulate API calls and loading/error state.

### Data Model

```
User ──< Session
User ──< ShortUrl ──< Click
         (guest_token on ShortUrl for unauthenticated users)
```

Key indexes include a composite `(short_url_id, clicked_at)` index on `clicks` for analytics queries and unique indexes on `short_urls.alias` and `users.email_address`.

### Infrastructure

- **Docker Compose** for local development: PostgreSQL, Rails app, and Solid Queue worker run as separate services with health checks ensuring the DB is ready before app boot.
- **Kamal** handles production deployments — Docker images are built, pushed, and deployed with zero-downtime rolling restarts. **Thruster** sits in front of Puma for HTTP/2 and caching, and **Jemalloc** reduces memory fragmentation.
- A `Makefile` wraps common operations (`make up`, `make migrate`, `make console`, etc.) so developers never need to call `docker compose` or `bin/rails` directly.

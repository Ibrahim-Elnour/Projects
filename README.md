# Neighborhood Incident Reporting Platform

A full-stack web application that allows users to create, update, and track real-time neighborhood infrastructure and safety incidents.

Built to explore how modern platforms handle user-generated reports, location-based feeds, and stateful workflows across APIs, databases, and dashboards.

---

## Tech Stack
**Backend:** Flask, PostgreSQL, REST APIs  
**Frontend:** React  
**Auth:** JWT  
**Deployment:** Cloud-hosted  

---

## Core Features
- User authentication and role-based access
- Create, update, and view incident reports
- Filter and paginate incident feeds by location, severity, and time
- Real-time status updates (open → in progress → resolved)
- Analytics endpoints for incident trends

---

## API Endpoints

### Authentication
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

### Incidents
POST /api/incidents
GET /api/incidents
GET /api/incidents/{id}
PATCH /api/incidents/{id}
PATCH /api/incidents/{id}/status
DELETE /api/incidents/{id}

### Comments
POST /api/incidents/{id}/comments
GET /api/incidents/{id}/comments

### Analytics
GET /api/analytics/top-categories
GET /api/analytics/average-resolution-time


---

## Example Request

```http
POST /api/incidents
Content-Type: application/json
Authorization: Bearer <JWT>

{
  "title": "Power outage on Main St",
  "description": "Multiple houses lost power after a transformer failure",
  "severity": "high",
  "latitude": 38.6270,
  "longitude": -90.1994
}

React Frontend
       ↓
Flask REST API  →  PostgreSQL
       ↓
    JWT Authentication

GET /api/incidents/42
Authorization: Bearer <JWT>
```

Why I Built This
I wanted to build a production-style system that mirrors how platforms like Nextdoor, airlines, and operations teams manage real-time, stateful data across users, APIs, and dashboards.

<img width="1470" height="807" alt="Screenshot 2026-09-04 at 9 41 32 PM" src="https://github.com/user-attachments/assets/6e3e90d4-b834-45a7-acbd-a684de204bdc" />


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
POST /api/auth/logout
GET  /api/auth/me

### Incidents
GET   /api/neighborhoods/:neighborhoodId/reports
POST  /api/reports
PATCH /api/reports/:reportId

### Comments
GET  /api/neighborhoods/:neighborhoodId/chat
POST /api/neighborhoods/:neighborhoodId/chatc

### Analytics
GET /api/neighborhoods/:neighborhoodId/analytics


---

## Example Request

```
curl -X POST http://127.0.0.1:5001/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{
    "neighborhoodId": 1,
    "title": "Book bag theft",
    "category": "Theft",
    "status": "New",
    "severity": "Watch",
    "location": "N High St & E 14th Ave",
    "lat": 39.9981,
    "lng": -83.0085,
    "details": "Book bag was stolen near 14th St."
  }'
```
This returns the full incident record, including status, location, and associated comments.

## System Architecture
```
React Frontend
- Renders the dashboard, map, reports, neighborhood join flow, and chat
- Sends JSON requests to the API
- Displays incidents from the database as map pins and report cards

Flask REST API
- Exposes endpoints for neighborhoods, reports, chat, and membership
- Validates incoming request data
- Creates and updates incident reports
- Returns JSON responses to the frontend

PostgreSQL
- Stores users, neighborhoods, reports, comments, chat messages, and memberships
- Keeps incident location data as latitude/longitude for map display
```

Why I Built This
I wanted to build a production-style system that mirrors how platforms like Nextdoor, airlines, and operations teams manage real-time, stateful data across users, APIs, and dashboards.

<img width="1469" height="808" alt="Screenshot 2026-09-04 at 9 41 41 PM" src="https://github.com/user-attachments/assets/38c62d7f-707a-4283-9968-82a0726b3f21" />



![Release v1.1.0](https://img.shields.io/badge/release-v1.1.0-blue)
# QuickShare

A secure, peer-to-peer file sharing web application that enables instant file transfers between devices without uploading files to any server.

## Release Notes
### v1.2.0 – 2025-10-18
- Feature Launch: Room-Based Persistent Sharing.
- Introduced the ability to create public or private, long-running rooms for file exchange.
- Implemented automatic, unique animal naming (e.g., "Daring Monkey's Room") and icons for new rooms and participants.
- Added real-time file management (upload, list, download, delete) within rooms.
- Introduced the ability to mark rooms as "Featured" for easy access by all users.

**Stability Fixes:**
- Resolved the critical LazyInitializationException error in scheduled room cleanup by applying @Transactional.
- Ensured data integrity by filtering the API response to only show files marked as isAvailable = true.
- UI/UX Improvements:
- Enhanced the FileCard component with chat-style visuals (uploader avatar, name tooltip, left/right alignment).
- Fixed file name truncation and responsiveness issues in the file list UI.

### v1.1.0 – 2025-10-13
- Added **multi-recipient broadcast session support**
- Completed frontend/backend broadcast sharing fixes
- SEO improvements for SPA build
- Migrated to Spring Boot native **WebSocket** implementation
- Added **Dockerfile** and updated `docker-compose.yml`

> See [v1.1.0 Release on GitHub](https://github.com/rayanweragala/LocalShare/releases/tag/v1.1.0) for full release assets.

## Overview

QuickShare allows users to share files directly between browsers using WebRTC technology. Files are transferred peer-to-peer, ensuring privacy and speed. The Spring Boot backend serves only as a signaling server for establishing peer connections.

**Live Demo:** [https://localshare-15ui.onrender.com/](https://localshare-15ui.onrender.com/)

## Key Features

- **Room-Based Sharing (NEW)**: Create dedicated, long-running spaces for file sharing with persistent file lists.
    - **Auto-Generated Identity**: New rooms and participants receive unique, auto-generated animal names (e.g., "Daring Monkey's Room") and icons if no name is provided.
    - **Room Visibility**: Support for Public Rooms (discoverable on the homepage) and Private Rooms (joinable only via room code).
    - **File Management**: Participants can upload, view, download, and delete shared files within the room.
    - **Featured Rooms**: Any participant can mark a room as 'Featured' for quick access on the main interface.

- **Direct Browser-to-Browser Transfer**: Files never pass through a server during transfer
- **End-to-End Encryption**: Files are AES-encrypted in the browser before transmission
- **Session-Based Sharing**: Simple session ID or QR code for connecting devices
- **Real-Time Progress Tracking**: Visual feedback for upload and download progress
- **Cross-Platform**: Works seamlessly on desktop and mobile browsers
- **Connection Fallback**: Automatic relay proxy when direct P2P connection fails
- **Local History**: Previous share sessions stored in browser using IndexedDB
- **Progressive Web App**: Installable with offline support via service workers
- **Multi-Recipient Broadcast**: Share files or sessions with multiple devices at once

**Future Plans**: File scanning for malware and viruses is a high-priority feature slated for the next major release.
## Architecture

QuickShare uses a hybrid architecture combining client-side WebRTC for file transfers with a lightweight Spring Boot backend for signaling:

<img width="2025" height="694" alt="architecture_diagram" src="https://github.com/user-attachments/assets/a76622c6-368e-40e6-a6fd-0f66c401618b" />

### Components

**Frontend**
- React with Vite for fast development and optimized builds
- Tailwind CSS for responsive styling
- WebRTC APIs for peer-to-peer data channels
- WebSocket client for signaling
- AES encryption/decryption in browser
- IndexedDB for local session history

**Backend**
- Spring Boot (Java 17) REST APIs and WebSocket server
- Native Spring WebSocket implementation (refactored from Netty-SocketIO)
- PostgreSQL for persistent room and file metadata storage
- Redis for active session metadata storage
- Integration with Cloudflare APIs for file uploads and access links
- Cloudflare R2 (S3-compatible) for secure and scalable file storage
- Automatic session cleanup and expiration

**Deployment**
- Docker containerization with multi-stage build
- Frontend bundled into Spring Boot static resources
- Hosted on Render

## Technical Details

### WebRTC Signaling

The application uses WebSocket for exchanging WebRTC signaling messages:

1. **OFFER**: Sender proposes connection parameters (SDP)
2. **ANSWER**: Receiver responds with their parameters
3. **ICE_CANDIDATE**: Network route information exchanged between peers

### Security

- **Transport Layer**: HTTPS/WSS for all signaling communication
- **Data Channel**: DTLS encryption for WebRTC data transfers
- **File Encryption**: Client-side AES encryption before transmission
- **Session Management**: Time-based expiration and automatic cleanup

### Room Flow (NEW)

1. User joins or creates a Room → Backend generates/retrieves persistent Room ID and unique user ID.
2. User is assigned a fun animal name/icon (e.g., "Trusty Koala").
3. Room details (files, participants) are fetched via REST API and updated via WebSocket.
4. When a user uploads a file, it's transferred via WebRTC to the recipient(s) **or** temporarily stored in Cloudflare R2.
5. File metadata is saved to the Room object (Redis/Database).
6. Participants can download shared files directly (P2P when possible, Cloudflare fallback).

### Session Flow

1. Sender creates a session → Backend generates unique session ID
2. Receiver joins via session ID or QR code scan
3. WebSocket signaling establishes WebRTC peer connection
4. Direct P2P data channel opens between browsers
5. Encrypted file chunks stream through WebRTC channel
6. Receiver decrypts and reconstructs file locally

### Architecture Improvements

The project was refactored to use Spring Boot's native WebSocket implementation instead of Netty-SocketIO. This change:

- Eliminates the need for a separate port for Socket.IO
- Simplifies deployment with a single port configuration
- Reduces infrastructure complexity
- Maintains full WebRTC signaling capabilities

## Technology Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| Frontend | React (Vite) | UI framework and build tool |
| Frontend | Tailwind CSS | Utility-first responsive styling |
| Frontend | WebRTC APIs | Peer-to-peer file transfer channels |
| Frontend | WebSocket Client | Real-time room and file event updates |
| Frontend | AES Encryption | End-to-end encryption in browser |
| Frontend | IndexedDB | Local session and history storage |
| Backend | Spring Boot (Java 17) | REST APIs and WebSocket server |
| Backend | Spring WebSocket | Native WebSocket signaling implementation |
| Backend | Redis | Active session metadata and caching |
| Backend | PostgreSQL | Persistent storage for room and file metadata |
| Backend | Cloudflare API | Secure file upload and access management |
| Storage | Cloudflare R2 (S3-Compatible) | Scalable cloud storage for shared files |
| Deployment | Docker Compose | Containerization and orchestration |
| Hosting | Render | Application hosting and deployment |


## Performance

- **Concurrent Sessions**: Handles 100+ simultaneous signaling sessions
- **Server Load**: Minimal backend load as file transfers are P2P
- **Scalability**: Redis-backed session management for horizontal scaling

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start

1. Clone the repository
```bash
git clone <repository-url>
cd QuickShare
```
2. Build and run the entire application
 ```bash
docker-compose up --build
```
This single command will:

- Build the React frontend
- Copy the frontend build to Spring Boot static resources
- Build the Spring Boot application
- Start Redis container
- Start the application container
- Set up all necessary networking

Access the application at http://localhost:8080

Development Setup
- For local development without Docker:
- Prerequisites: Java 17+, Node.js 16+, Redis

Start Redis locally on port 6379
Run the backend
```bash
cd backend
./mvnw spring-boot:run
```
3. Run the frontend (in a separate terminal)
 ```bash
cd frontend
npm install
npm run dev
```
4. Access the application at [http://localhost:5173](http://localhost:5173)

### Deployment

The application uses a multi-stage Docker build that:

- Builds the React frontend with Vite
- Packages the frontend into Spring Boot's static resources
- Builds the Spring Boot application with Maven
- Creates a minimal runtime image

Deploy using Docker Compose:
```bash
docker-compose up -d
```
### License

This project is licensed under the MIT License.

## Abbreviations

| Abbreviation | Full Term |
|--------------|-----------|
| AES | Advanced Encryption Standard |
| API | Application Programming Interface |
| DTLS | Datagram Transport Layer Security |
| ICE | Interactive Connectivity Establishment |
| NAT | Network Address Translation |
| P2P | Peer-to-Peer |
| PWA | Progressive Web Application |
| SDP | Session Description Protocol |
| WebRTC | Web Real-Time Communication |
| WSS | WebSocket Secure |


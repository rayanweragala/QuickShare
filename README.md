# LocalShare

A secure, peer-to-peer file sharing web application that enables instant file transfers between devices without uploading files to any server.

## Overview

LocalShare allows users to share files directly between browsers using WebRTC technology. Files are transferred peer-to-peer, ensuring privacy and speed. The Spring Boot backend serves only as a signaling server for establishing peer connections.

**Live Demo:** [https://localshare-15ui.onrender.com/](https://localshare-15ui.onrender.com/)

## Key Features

- **Direct Browser-to-Browser Transfer**: Files never pass through a server during transfer
- **End-to-End Encryption**: Files are AES-encrypted in the browser before transmission
- **Session-Based Sharing**: Simple session ID or QR code for connecting devices
- **Real-Time Progress Tracking**: Visual feedback for upload and download progress
- **Cross-Platform**: Works seamlessly on desktop and mobile browsers
- **Connection Fallback**: Automatic relay proxy when direct P2P connection fails
- **Local History**: Previous share sessions stored in browser using IndexedDB
- **Progressive Web App**: Installable with offline support via service workers

## Architecture

LocalShare uses a hybrid architecture combining client-side WebRTC for file transfers with a lightweight Spring Boot backend for signaling:

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
- Redis for active session metadata storage
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
|-------|------------|---------|
| Frontend | React (Vite) | UI framework and build tool |
| Frontend | Tailwind CSS | Utility-first styling |
| Frontend | WebRTC APIs | Peer-to-peer data channels |
| Frontend | WebSocket | Real-time signaling |
| Backend | Spring Boot (Java 17) | REST APIs and WebSocket server |
| Backend | Spring WebSocket | Native WebSocket implementation |
| Database | Redis | Session metadata storage |
| Deployment | Docker Compose | Orchestration and containerization |
| Hosting | Render | Cloud hosting platform |

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
cd LocalShare
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


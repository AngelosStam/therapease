# TherapEase

This repository contains the **TherapEase** psychotherapy platform, with a **Node.js/Express + MongoDB** backend and an **Angular** frontend. 
Below is a detailed overview of what TherapEase offers—first from the therapist’s perspective, then from the client’s—and a step-by-step of how the system works for each user type.

### For the Therapist

***One-Time Setup & Secure Login***

- The therapist registers using their special email **(angelos_stamatis@outlook.com)** and chooses a password at first login.
- Their account is automatically approved and given the therapist role (no waiting).
- Subsequent logins use JWT-backed auth, keeping sessions secure.

***Centralized Dashboard (“Appointments” Tab)***

Appointment Requests: The therapist sees every pending request from guests or registered clients in a sortable table.

Columns include:

- Client/Guest – distinguishes existing clients vs one-time guests.
- Full Name & Phone Number.
- Email.
- Requested On – timestamp of when the request arrived.
- Proposed Date & Time (you can edit in-line).
- Message – expandable card for longer notes.
- Actions – “Modify,” “Approve,” or “Reject”.
- Approving automatically moves the entry into upcoming sessions and sends the client notification.

Upcoming Sessions: The sessions that the therapist has with clients.

A calendar view showing approved sessions:

- Days with dots indicate appointments.
- Clicking a date reveals a details card with that day’s sessions.
- From there you can modify or cancel any session in-line.
- Month-by-month navigation, responsive mobile-friendly grid.

***Client Management (“MyAccount” Tab → Clients & Access Management)***

Clients:

- Lists all approved clients with registration date.
- “Session History” button per client opens a card showing every past session (date & time).

Access Management:

- Shows pending registration requests from new clients.
- Approve or reject with one click; approved clients immediately gain full access.

### For the Client

***A. Guest (First Appointment)***

Book an Appointment

- Accessible without registration under “Book an Appointment.”
- Info Card: Highlights a free initial consultation, encouraging guests to try the service risk-free.
- Fill in Full Name, E-mail, Phone Number, Preferred Date & Time, and an optional message.
- On submission, you see “Appointment request submitted successfully,” and the therapist is notified.

Approval Workflow

- The therapist reviews your request, and after he communicates with you and proposes/approves a final date & time, 
the appointment is set.

***B. Registered Client (Ongoing Care)***

Registration

- After your first session, you can register: First Name, Last Name, E-mail, Phone Number, Password.
- Therapist approves you; then you log in.

Logged-In Experience

- Book an Appointment: now only asks for date & time + message (your name, email & phone are pre-filled from your profile).
- My Account → Session History: see a chronological list of all past and upcoming sessions.
- My Account → Bookings: view or cancel upcoming sessions.

## How It Works (Workflows)

### Therapist Workflow

- Log in → land on Home.
- Click Appointments → see Requests tab.
- Select a request → set or tweak the date/time → click Approve.
- Switch to Upcoming Sessions → verify your calendar → modify/cancel as needed.
- Use MyAccount → View client list & open history cards.
- Use MyAccount → Access Management to handle new client registrations.

### Guest→Client Workflow

- Guest visits Home → clicks Book an Appointment → views info card → submits request.
- Therapist approves → attend free consultation.
- If you choose to continue, register under Register tab → wait for therapist approval → log in.
- As Client, go to Book an Appointment → pick date/time & message only → submit.
- Use My Account to view past sessions and manage upcoming ones (modify/cancel).

With TherapEase, the therapist enjoys a unified console for client & appointment management, while clients get a smooth, guided experience from first contact through ongoing care— all in one modern, secure platform.

---

## 📦 Build & Deploy

### Prerequisites

- Node.js ≥ 16 & npm  
- MongoDB instance (tested with MongoDB Community Edition)  
- Angular CLI (globally):  
  ```bash
  npm install -g @angular/cli

**Backend**

- Install dependencies:  
  ```bash
  cd backend
  npm install 

- Run in development
  ```bash
  npm run dev

Starts server with nodemon on port 5000.
API root: http://localhost:5000/api.

**Frontend**

- Install dependencies:  
  ```bash
  cd frontend
  npm install

- Run in development
  ```bash
  npm start

Launches ng serve --open on http://localhost:4200.

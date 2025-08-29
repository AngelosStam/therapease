# TherapEase

This repository contains the **TherapEase** psychotherapy platform, with a **Node.js/Express + MongoDB** backend and an **Angular** frontend.  
It provides a unified digital workspace where the therapist can manage clients, sessions, and notes, while clients enjoy a simple interface to request, view, and manage appointments.

---

### For the Therapist

***One-Time Setup & Secure Login***

- The therapist registers using their special email **(angelos_stamatis@outlook.com)** and chooses a password at first login.
- Their account is automatically approved and given the therapist role (no waiting).
- Subsequent logins use JWT-backed auth, keeping sessions secure.

***Centralized Dashboard (“Appointments” Tab)***

**Appointment Requests**: A sortable, filterable table of all pending requests (from guests or registered clients).  
Columns include:

- Client/Guest – distinguishes existing clients vs one-time guests.
- Full Name, Phone Number, Email.
- Requested On – timestamp of when the request arrived.
- Proposed Date & Time – inline editable.
- Message – expandable view for longer notes.
- Actions – **Modify**, **Approve**, or **Reject**.

Approving moves the entry into *Upcoming Sessions*. Rejected requests are excluded from history.

**Upcoming Sessions**: Calendar view of all approved sessions.

- Days with dots indicate appointments.
- Clicking a date reveals a card with all sessions for that day.
- Modify or cancel sessions in-line.
- Month-by-month navigation, responsive mobile-friendly grid.

***Client Management (“MyAccount” Tab → Clients & Access Management)***

**Clients tab:**

- Lists all approved clients with registration date.
- Each row includes:
  - **Schedule Session** → schedule one-off or recurring sessions (repeat weekly/biweekly/monthly until chosen end date).  
  - **Session History** → card showing all past & upcoming sessions, with cancelled/rejected ones hidden.  
  - **Open Notes** → therapist’s private notes area (create, edit, delete notes). Notes display date & time of creation.

**Access Management tab:**

- Displays pending registration requests.
- Approve or reject with one click; approved clients gain full access.

---

### For the Client

***A. Guest (First Appointment)***

**Book an Appointment**

- Accessible without registration under “Book an Appointment.”
- Fill in: Full Name, Email, Phone, Preferred Date & Time, and optional message.
- On submission, you see a success message, and the therapist is notified.

**Approval Workflow**

- The therapist reviews your request and sets/approves a final date & time.  
- Approved requests appear in your session history (if you later register as client).

***B. Registered Client (Ongoing Care)***

**Registration**

- After first session, you may register with your personal details and password.
- Therapist approves your account.

**Logged-In Experience**

- Book an Appointment: only provide date & time + optional message (name/email/phone prefilled).  
- My Account → **Session History**: chronological list of sessions.  
- Cancel upcoming sessions if needed.  

---

## 🔄 How It Works (Workflows)

### Therapist Workflow
1. Log in with therapist email → land on Home.  
2. Go to **Appointments → Requests**.  
3. Select request → edit date/time → Approve or Reject.  
4. Go to **Upcoming Sessions** calendar → verify, modify, or cancel sessions.  
5. In **MyAccount → Clients**, manage client list, schedule sessions, and view session history.  
6. In **MyAccount → Open Notes**, write/edit/delete private notes per client.  
7. In **MyAccount → Access Management**, approve or reject new client registrations.  

### Guest → Client Workflow
1. Guest books first appointment.  
2. Therapist approves → attend free consultation.  
3. Guest registers → waits for therapist approval.  
4. Approved client logs in → books follow-up sessions.  
5. My Account → Session History shows all past/future sessions.  

---

## 📦 Build & Deploy

### Prerequisites
- Node.js ≥ 16 & npm  
- MongoDB instance (tested with MongoDB Community Edition)  
- Angular CLI (globally):  
  ```bash
  npm install -g @angular/cli

- Clone repository:
  ```bash 
  git clone https://github.com/AngelosStam/therapease.git
  cd therapease

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

👨‍💻 Author

Angelos Stamatis

Final Project for Coding Factory (Athens University of Economics & Business)

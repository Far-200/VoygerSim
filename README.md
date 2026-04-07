# 🚀 VoyagerPulse

### Deep-Space Telemetry Signal Simulation & Error-Correction Visualization

**VoyagerPulse** is an interactive, full-stack simulation inspired by NASA’s Voyager missions.  
It explores how binary telemetry signals survive the vast, noisy vacuum of interstellar space using **Forward Error Correction (FEC)** — specifically the **Hamming (7,4)** algorithm.

---

## 🛰️ The Challenge: Interstellar Noise

Voyager 1 and 2 transmit faint signals across **billions of miles**.  
As the **Signal-to-Noise Ratio (SNR)** drops, cosmic radiation causes **bit flips**.

Without protection:

- A single flipped bit can corrupt an entire telemetry frame
- Mission data is permanently lost

**VoyagerPulse visualizes the “Digital Cliff”** — the point where noise overwhelms the signal and communication collapses.

---

## ✨ Features

### 🌌 Real-Time Link Simulation

- Toggle **FEC ON/OFF**
- Compare raw vs protected transmission under identical noise

### ❤️ Heartbeat Visualization

Frame-by-frame telemetry “pulse” showing signal health:

- 🟢 **Clean** — no errors
- 🔵 **Corrected** — errors detected & repaired via Hamming logic
- 🔴 **Lost** — noise exceeded recovery threshold

### 📊 BER Sweep & Analytics

- Automated noise sweep from **0.00 → 0.20**
- Plots:
  - Bit Error Rate (BER) vs Noise
  - Integrity vs Noise
- Clearly demonstrates the **digital cliff effect**

### 🧾 FEC Decision Log

- Low-level backend trace of every frame:
  - Saved
  - Corrected
  - Lost

### 📱 Mobile-First Design

- Fully responsive **“Mission Cockpit” UI**
- Works seamlessly on desktop & mobile

---

## 📸 Interface Gallery

> _(Add screenshots here)_

- Live Telemetry Analysis
- Research Data — The Digital Cliff
- Frame-level Recovery Visualization
- Integrity Collapse vs Noise Plots

---

## 🧠 Technical Deep Dive

### The “Digital Cliff” Effect

In digital communications, integrity does **not degrade linearly**.

As seen in the **Integrity vs Noise** chart:

- The signal remains near-perfect up to a threshold
- Beyond it, integrity collapses catastrophically

This mirrors real deep-space communication behavior.

---

### FEC Logic: Hamming (7,4)

The simulation uses a **custom Python DSP engine**:

1. **Encoding**
   - Every 4 data bits → 3 parity bits
   - Forms a 7-bit codeword

2. **Noise Injection**
   - Probabilistic bit-flip model
   - Simulates interstellar interference (AWGN-style)

3. **Correction**
   - Parity bits detect & correct **single-bit errors**
   - Frames exceeding correction capability are marked **LOST**

---

## 🛠️ Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS (Atomic Design)
- Chart.js

### Backend

- Python 3.10
- FastAPI (Uvicorn)

### DSP Logic

- Custom Hamming (7,4) implementation
- Noise modeling & BER analytics

---

## 🧪 How to Run Locally

### 1️⃣ Backend (Python / FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
2️⃣ Frontend (React / Vite)
cd frontend
npm install
npm run dev
📡 API Reference
POST /simulate
Runs a single-pass simulation of the telemetry link.

Payload

{
  "frames": 30,
  "bit_flip_prob": 0.05,
  "use_fec": true,
  "bits_per_frame": 64
}
POST /sweep
Generates research data for BER & Integrity charts across a noise spectrum.

📜 License
MIT License — free to use, modify, and learn from.

👤 Author
Farhaan Khan
B.Tech CSE
Signal Processing • Systems • Visualization

Built with curiosity, caffeine, and cosmic despair ☄️
Halted Work
```

# Sanctii

Sanctii is an **intelligent healthcare platform** that unifies patients, doctors, and hospitals through automation and real-time insights.

### **Key Features**

- **AI Symptom Triage:** Patients describe symptoms and receive instant, AI-powered guidance on care severity and recommended facilities.
- **Smart Hospital Routing:** Geolocation and mapping APIs find the nearest hospitals, estimate travel times, and display live wait data.
- **Automated Scheduling:** Gemini AI coordinates appointments, optimizes patient flow, and reduces bottlenecks.
- **Health Card Scanning:** Computer vision and OCR extract patient info from health cards, eliminating manual entry.
- **Live Vital Monitoring:** Presage simulates and visualizes real-time vitals for clinicians.
- **3D Hospital Visualization:** Immersive, interactive hospital maps powered by Three.js.
- **Secure Patient Data:** All records are stored securely in MongoDB, with enterprise-grade Auth0 authentication.

---

## What’s Next

- Integrate **real hospital wait-time data**
- Expand AI Doctor with **medical datasets**
- Add secure patient portals for long-term records
- Support telemedicine and remote consultations
- Deploy across **multiple healthcare networks**

**Our vision:** Help patients reach the right care faster, while reducing administrative burdens for providers.

---

## Project Structure

```
sanctii/
├── backend/           # FastAPI, models, routes
├── public/            # Static assets (CSV, images, workers)
├── src/               # React frontend, components, pages
├── README.md
├── package.json
└── ...
```

---

## Getting Started

1. **Clone the repository:**
  ```sh
  git clone https://github.com/your-org/sanctii.git
  cd sanctii
  ```

2. **Install dependencies:**
  ```sh
  npm install
  cd backend && pip install -r requirements.txt
  ```

3. **Run the app:**
  ```sh
  npm run start:all
  ```

4. **Visit:** [http://localhost:3000](http://localhost:3000)

---

## Contributing

We welcome contributions! Please open issues or submit pull requests for improvements.

---

## License

© 2026 Sanctii Health Technologies. All rights reserved.

---

**Secured by Auth0 · Powered by Gemini AI · Built with ❤️ for healthcare**

---

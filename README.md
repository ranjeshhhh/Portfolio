# Ranjesh Animated Portfolio — Clean Version

A dark futuristic portfolio inspired by the supplied reference design.

## Changes made

- Removed the floating left-side navigation rail.
- Removed the custom/edit mode UI completely.
- Removed the About-section second photo.
- Kept the main hero portrait.
- Added proper GitHub, LinkedIn, X/Twitter and Instagram icons using Font Awesome.
- Social icons are clickable and open in a new tab.
- Added professional Devicon logos for the skills.
- Added hover-reveal actions on project cards:
  - Live Project
  - GitHub Repository
- Added responsive mobile navigation.
- Kept day/night theme switching.
- Kept scroll animations and AI Assistant.
- Kept the Node/Express backend and contact/chat API.
- Fixed the Express 5 wildcard route in `backend/server.js`.

## Run

```bash
cd backend
npm install
npm start
```

Then open:

```text
http://localhost:5000
```

## Important links to replace

Open `index.html` and replace the placeholder LinkedIn/X/Instagram URLs with your real profile URLs.

Project cards also contain `#` placeholders for projects whose live/repository URLs were not provided.

For the CV button, add:

```text
assets/Ranjesh_Yadav_CV.pdf
```

## AI

For the real AI assistant, create `backend/.env` from `.env.example` and add your API key.

Do not commit `.env` or API keys to GitHub.
# Portfolio-Ranjesh

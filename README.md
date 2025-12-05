# TAG – Trusted Adult Games

A web-accessible adult gaming hub for the sex-positive community.

## Overview

TAG (Trusted Adult Games) is an inclusive, accessible platform designed for adults to discover and enjoy quality games. Our mission is to provide a safe, welcoming environment built on respect and consent.

## Features

- **Age Verification** - Responsible content gating for adult audiences
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Accessibility First** - WCAG-compliant design with keyboard navigation, screen reader support, and reduced motion preferences
- **Inclusive Community** - Welcoming to all identities and orientations

## Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/MarcMercury/TAGS.git
   cd TAGS
   ```

2. Open `index.html` in your browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (npx)
   npx serve
   ```

3. Visit `http://localhost:8000` in your browser

### Deployment

This is a static website that can be deployed to any web hosting service:

- **GitHub Pages** - Enable in repository settings
- **Netlify** - Connect your repository for automatic deployments
- **Vercel** - Import the project for instant deployment

## Project Structure

```
TAGS/
├── index.html          # Main HTML file
├── src/
│   ├── css/
│   │   └── styles.css  # Main stylesheet
│   └── js/
│       └── main.js     # Main JavaScript file
└── README.md           # This file
```

## Accessibility

TAG is built with accessibility in mind:

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Skip links for screen readers
- Respects `prefers-reduced-motion`
- High contrast mode support

## Contributing

We welcome contributions that align with our values of inclusivity, respect, and consent. Please ensure any contributions maintain our commitment to accessibility.

## License

All rights reserved. © 2025 TAG - Trusted Adult Games

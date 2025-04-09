# Installation and Usage Guide

## Overview
This guide provides instructions for installing and using the improved MPBF web application with enhanced responsive design, bilingual support, and cross-browser compatibility.

## Prerequisites
- Node.js 14.x or higher
- npm 6.x or higher
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

### 1. Extract the Application
Extract the MPBF-NewUI.zip file to your desired location.

### 2. Install Dependencies
Navigate to the application directory and install the dependencies:

```bash
cd MPBF-NewUI
npm install
```

### 3. Build the Application
Build the application for production:

```bash
npm run build
```

### 4. Serve the Application
You can serve the built application using a static server:

```bash
npx serve -s build
```

The application will be available at http://localhost:3000 (or another port if 3000 is already in use).

## Key Features

### Responsive Design
The application now provides an optimal viewing experience across a wide range of devices:
- Mobile phones (portrait and landscape)
- Tablets
- Desktop computers
- Different screen sizes and resolutions

### Bilingual Support
The application fully supports both English and Arabic languages:
- Language switching with smooth transitions
- Right-to-left (RTL) layout for Arabic
- Proper formatting of numbers, dates, and currency
- Bidirectional text handling

### Cross-Browser Compatibility
The application works consistently across different browsers:
- Chrome
- Firefox
- Safari
- Edge
- Internet Explorer 11 (with polyfills)

## Using the Language Switcher

To switch between English and Arabic:
1. Look for the language toggle button in the top navigation bar (globe icon)
2. Click the button to switch languages
3. The application will automatically adjust the layout and direction for the selected language

## Testing Browser Compatibility

The application includes a built-in compatibility testing tool:
1. Navigate to the settings page
2. Click on "Browser Compatibility Test"
3. View detailed information about your browser's compatibility with the application

## Troubleshooting

### Layout Issues
If you experience layout issues:
1. Clear your browser cache
2. Refresh the page
3. If issues persist, try a different browser

### Language Switching Issues
If language switching doesn't work properly:
1. Clear your browser's local storage
2. Refresh the page
3. Try switching languages again

### Performance Issues
If the application is slow:
1. Ensure you're using a modern browser
2. Close unnecessary browser tabs and applications
3. If using a mobile device, ensure you have a stable internet connection

## Support
For additional support, please contact the MPBF support team.

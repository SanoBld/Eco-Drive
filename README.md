# 🍃 Eco-Drive

**Eco-Drive** is an intelligent eco-driving calculator designed to help drivers estimate the cost and ecological impact of their journeys in real time. Built with **Material Design 3** principles, it provides a fluid and responsive experience on both mobile and desktop.

Live Demo: [https://sanobld.github.io/Eco-Drive/](https://sanobld.github.io/Eco-Drive/)

---

## ✨ Key Features

### 🗺️ Smart Trip Planning
* **Interactive Mapping:** Powered by Leaflet.js for precise route calculation and visualization.
* **Real-time Data:** Automatic fetching of current fuel prices (Gasoline, Diesel, etc.).
* **Advanced Statistics:** Instant breakdown of total trip cost and carbon footprint.

### 🚗 Vehicle Customization
* **Profiles:** Choose from various vehicle types (Sedan, SUV, City car, Motorcycle, Van).
* **Fuel & Consumption:** Adjustable L/100km settings and fuel type selection.
* **Driving Styles:** Toggle between Eco, Normal, and Sport modes to see impact on consumption.

### 🎨 User Experience
* **Dynamic Themes:** 5 color palettes (Eco Green, Ocean Blue, Purple Night, Sunset Orange, Rose) with a full Dark Mode.
* **Data Portability:** Save frequent trips and export/import your configurations via JSON.
* **PWA Ready:** Installable as a mobile app with offline support (Service Workers).

---

## ⚙️ Technical Stack

* **Frontend:** HTML5, CSS3 (Variables, Flexbox/Grid), Vanilla JavaScript (ES6+).
* **Maps:** [Leaflet.js](https://leafletjs.com/) for routing and tile rendering.
* **Design:** Google Sans & Roboto typography with Material Symbols.
* **Storage:** LocalStorage for persistent user settings and theme preferences.
* **Offline:** Service Worker implementation for resource caching and tile management.

---

## 💡 Integrated Eco-Tips

The app provides dynamic suggestions to lower fuel consumption:
* Maintaining constant speeds and smooth acceleration.
* Anticipating braking zones.
* Monitoring tire pressure and vehicle load.

---

## 📄 License

This project is open-source and available under the MIT License.
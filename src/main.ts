/* ============================================
   TENAXIS - Application Entry Point
   Enterprise Asset & Operations Management
   ============================================ */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';

// Import global styles
import './assets/main.css';

// Create Vue app instance
const app = createApp(App);

// Install Pinia for state management
app.use(createPinia());

// Install Vue Router
app.use(router);

// Mount the application
app.mount('#app');

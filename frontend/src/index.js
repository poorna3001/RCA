import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // Assuming your index.css is here based on App.jsx
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
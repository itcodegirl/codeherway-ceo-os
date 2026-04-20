import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import './styles/base.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/opportunities.css';
import './styles/content.css';
import './styles/weekly.css';
import './styles/chief-of-staff.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import CandlestickPredictionApp from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <CandlestickPredictionApp />
  </React.StrictMode>
);
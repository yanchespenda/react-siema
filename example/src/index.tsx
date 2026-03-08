import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './Template/GoogleEdu/App';
import reportWebVitals from './reportWebVitals';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <React.Fragment>
      <div className="block-info">
        <h1 className="title">Google Edu Carousel Like:</h1> <br />
        <a className="source" href="https://github.com/yanchespenda/react-siema/tree/main/example/src/Template/GoogleEdu">Source github</a><br />
      </div>
      <App />
    </React.Fragment>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

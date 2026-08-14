import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { ToastProvider } from './context/ToastContext';
import './index.css';

// Global Fetch Interceptor to attach JWT token to all requests
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('jordan_token') || sessionStorage.getItem('jordan_token');
  
  const url = typeof input === 'string' ? input : (input && typeof input === 'object' && 'url' in input ? (input as any).url : '');
  
  // Do not append local auth headers to external third-party APIs (e.g., open-api.vn, cloudinary)
  const isKnownThirdParty = url.includes('open-api.vn') || url.includes('api.cloudinary.com');

  if (token && !isKnownThirdParty) {
    init = init || {};
    const headers = init.headers || {};

    if (headers instanceof Headers) {
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(headers)) {
      const hasAuth = headers.some(([key]) => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      const hasAuth = Object.keys(headers).some(key => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        init.headers = {
          ...(headers as Record<string, string>),
          'Authorization': `Bearer ${token}`
        };
      }
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);


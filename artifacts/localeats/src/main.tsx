import { createRoot } from 'react-dom/client';

import App from './App';
import { setBaseUrl } from '@workspace/api-client-react';
const apiOrigin = import.meta.env.VITE_API_ORIGIN;
if (apiOrigin) {
  if (new URL(apiOrigin).protocol !== 'https:') throw new Error('VITE_API_ORIGIN must use HTTPS');
  setBaseUrl(apiOrigin);
}
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

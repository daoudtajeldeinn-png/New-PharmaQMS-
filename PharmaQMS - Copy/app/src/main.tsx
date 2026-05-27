import { StrictMode } from 'react' 
import { createRoot } from 'react-dom/client' 
import './index.css' 
import './i18n' 
import App from './App.tsx' 
import { isElectron } from '@/utils/env'

// Service workers are for the web PWA only; they break offline file:// loads in Electron.
if (isElectron() && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister());
  });
  if ('caches' in window) {
    void caches.keys().then((keys) => keys.forEach((key) => void caches.delete(key)));
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) { 
  throw new Error('Root element not found!') 
} 
 
createRoot(rootElement).render( 
  <StrictMode> 
    <App /> 
  </StrictMode>, 
) 

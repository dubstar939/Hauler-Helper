
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GlobalProvider } from './src/context/GlobalContext';
import { DatabaseProvider } from './src/context/DatabaseContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalProvider>
      <DatabaseProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }>
          <App />
        </Suspense>
      </DatabaseProvider>
    </GlobalProvider>
  </React.StrictMode>
);

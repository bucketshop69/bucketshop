'use client';

import { Provider } from 'react-redux';
import { store } from './index';

/**
 * Redux Provider component
 * 
 * This component wraps the entire app to provide Redux store access
 * to all components. It must be a client component since Redux only
 * works in the browser.
 */
interface ReduxProviderProps {
  children: React.ReactNode;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}
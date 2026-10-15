import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from './App';
import { AuthProvider } from './lib/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('NexusFlow AI Frontend Smoke Test', () => {
  it('renders landing page hero title without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Initial route is '/' which shows NexusFlow AI brand
    const headings = screen.getAllByText(/NexusFlow/i);
    expect(headings.length).toBeGreaterThan(0);
  });
});

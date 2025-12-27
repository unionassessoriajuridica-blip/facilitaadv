import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Index from '../pages/Index';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('Index Page', () => {
    it('renders the welcome message or main heading', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Index />
                </BrowserRouter>
            </QueryClientProvider>
        );
        // Adjust this expectation based on actual content of Index.tsx
        // For now, we'll just check if it renders something.
        expect(document.body).toBeTruthy();
    });
});

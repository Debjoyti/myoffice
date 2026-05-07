import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState, ErrorState } from './empty-state';

describe('Design System Components', () => {
  it('renders EmptyState correctly', () => {
    render(<EmptyState title="No Data Found" description="Try creating a new record." />);
    expect(screen.getByText('No Data Found')).toBeInTheDocument();
    expect(screen.getByText('Try creating a new record.')).toBeInTheDocument();
  });

  it('renders ErrorState correctly and shows retry button when passed', () => {
    const mockRetry = jest.fn();
    render(<ErrorState title="Fetch Failed" description="Network error." retry={mockRetry} />);
    expect(screen.getByText('Fetch Failed')).toBeInTheDocument();
    expect(screen.getByText('Network error.')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});

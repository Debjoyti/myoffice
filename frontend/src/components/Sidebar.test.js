import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Sidebar user={{ name: 'Test User', role: 'admin' }} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('sidebar-title')).toBeInTheDocument();
  });
});

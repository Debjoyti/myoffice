import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';

// Mock Recharts to avoid issues in JSDOM
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => <div />,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

describe('Dashboard', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Dashboard user={{ name: 'Test User', role: 'admin' }} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('sidebar-title')).toBeInTheDocument();
  });
});

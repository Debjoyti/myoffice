import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import NotificationCenter from './NotificationCenter';

jest.mock('axios');

describe('NotificationCenter', () => {
  const mockUser = { name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and shows data on successful fetch', async () => {
    const mockStats = {
      pending_leaves: 2,
      total_tickets: 5,
      total_leads: 10,
      projected_revenue: 600000,
    };
    axios.get.mockResolvedValueOnce({ data: mockStats });

    render(<NotificationCenter user={mockUser} />);

    // Open notification panel
    const bellBtn = screen.getByTitle('Notifications');
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('2 Leave Requests Pending')).toBeInTheDocument();
      expect(screen.getByText('5 Support Tickets Open')).toBeInTheDocument();
      expect(screen.getByText(/Test, your AI brief is ready\. 2 approvals, 5 tickets, 10 leads tracked\./)).toBeInTheDocument();
    });
  });

  it('handles fetch error and shows fallback notification', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    render(<NotificationCenter user={mockUser} />);

    // Open notification panel
    const bellBtn = screen.getByTitle('Notifications');
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText(/Test, your AI brief is ready\. 0 approvals, 0 tickets, 0 leads tracked\./)).toBeInTheDocument();
    });
  });
});

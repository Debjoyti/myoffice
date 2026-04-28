import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { toast } from 'sonner';
import OfferLetterModal from './OfferLetterModal';

jest.mock('axios');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('OfferLetterModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => 'fake-token');
  });

  it('handles API error during offer letter generation', async () => {
    const errorMessage = 'Network Error';
    axios.post.mockRejectedValueOnce(new Error(errorMessage));

    render(<OfferLetterModal show={true} onClose={() => {}} onSave={() => {}} />);

    fireEvent.click(screen.getByText('Next Step')); // Step 1 -> 2
    fireEvent.click(screen.getByText('Next Step')); // Step 2 -> 3

    const changeInputByLabelText = (labelText, value) => {
        const labels = screen.getAllByText(labelText);
        const label = labels[labels.length - 1];
        const input = label.nextElementSibling;
        fireEvent.change(input, { target: { value } });
    };

    changeInputByLabelText('First Name', 'John');
    changeInputByLabelText('Last Name', 'Doe');
    changeInputByLabelText('Phone', '1234567890');
    changeInputByLabelText('Email', 'john@example.com');
    changeInputByLabelText('Designation', 'Engineer');

    fireEvent.click(screen.getByText('Next Step')); // Step 3 -> 4
    fireEvent.click(screen.getByText('Next Step')); // Step 4 -> 5

    // "Generate Offer Letter" text is present twice (header and button)
    const generateButtons = screen.getAllByText(/Generate Offer Letter/i);
    // Usually the button is the last one
    fireEvent.click(generateButtons[generateButtons.length - 1]);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed:'));
  });
});

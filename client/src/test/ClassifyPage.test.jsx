import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClassifyPage from '../pages/ClassifyPage';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, useNavigate: () => mockNavigate };
});

// Mock the API module
vi.mock('../services/api', () => ({
  classifyIssue: vi.fn(),
}));

import { classifyIssue } from '../services/api';

function renderClassify() {
  return render(
    <MemoryRouter>
      <ClassifyPage />
    </MemoryRouter>
  );
}

describe('ClassifyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form fields', () => {
    renderClassify();
    expect(screen.getByLabelText(/issue title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /classify issue/i })).toBeInTheDocument();
  });

  it('shows validation error when title is empty', async () => {
    renderClassify();
    fireEvent.click(screen.getByRole('button', { name: /classify issue/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    classifyIssue.mockImplementation(() => new Promise(() => {})); // never resolves
    renderClassify();
    fireEvent.change(screen.getByLabelText(/issue title/i), { target: { value: 'Test issue' } });
    fireEvent.click(screen.getByRole('button', { name: /classify issue/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /classifying/i })).toBeDisabled();
    });
  });

  it('navigates to result page on success', async () => {
    classifyIssue.mockResolvedValueOnce({ data: { data: { id: 'abc123' } } });
    renderClassify();
    fireEvent.change(screen.getByLabelText(/issue title/i), { target: { value: 'Real issue title' } });
    fireEvent.click(screen.getByRole('button', { name: /classify issue/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/result/abc123');
    });
  });

  it('shows error message on API failure', async () => {
    classifyIssue.mockRejectedValueOnce(new Error('ML service unavailable'));
    renderClassify();
    fireEvent.change(screen.getByLabelText(/issue title/i), { target: { value: 'Some title' } });
    fireEvent.click(screen.getByRole('button', { name: /classify issue/i }));
    expect(await screen.findByText(/ml service unavailable/i)).toBeInTheDocument();
  });
});

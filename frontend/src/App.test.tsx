import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from './App';

// Mock Tauri invoke function
const mockInvoke = vi.fn();

describe('Password Generator App', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup global Tauri mocks before each test
    (window as any).__TAURI__ = {
      core: {
        invoke: mockInvoke,
      },
    };
  });

  it('should generate password when password and salt are entered', async () => {
    mockInvoke.mockResolvedValue({ password: 'GeneratedPass123' });

    render(<App />);

    // Enter password - use exact placeholder text to avoid ambiguity
    const passwordInput = screen.getByPlaceholderText('Enter your master password');
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

    // Enter salt
    const saltInput = screen.getByPlaceholderText('Enter salt value');
    fireEvent.change(saltInput, { target: { value: 'mysalt' } });

    // Wait for invoke to be called
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate_password_cmd', {
        password: 'mypassword',
        salt: 'mysalt',
        length: 16,
        useSymbols: false,
      });
    });

    // Check result is displayed
    const resultField = screen.getByPlaceholderText('Generated password will appear here') as HTMLInputElement;
    expect(resultField.value).toBe('GeneratedPass123');
  });

  it('should regenerate password when length changes', async () => {
    mockInvoke.mockResolvedValue({ password: 'NewLengthPass' });

    render(<App />);

    // Set initial values
    const passwordInput = screen.getByPlaceholderText('Enter your master password');
    fireEvent.change(passwordInput, { target: { value: 'test' } });

    const saltInput = screen.getByPlaceholderText('Enter salt value');
    fireEvent.change(saltInput, { target: { value: 'salt' } });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled();
    });

    // Clear mock to reset call count after initial calls
    mockInvoke.mockClear();

    // Change length slider
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: 32 } });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate_password_cmd', {
        password: 'test',
        salt: 'salt',
        length: 32,
        useSymbols: false,
      });
    });
  });

  it('should regenerate password when symbols toggle changes', async () => {
    mockInvoke.mockResolvedValue({ password: 'WithSymbols!@#' });

    render(<App />);

    // Set initial values
    const passwordInput = screen.getByPlaceholderText('Enter your master password');
    fireEvent.change(passwordInput, { target: { value: 'test' } });

    const saltInput = screen.getByPlaceholderText('Enter salt value');
    fireEvent.change(saltInput, { target: { value: 'salt' } });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled();
    });

    // Clear mock to reset call count after initial calls
    mockInvoke.mockClear();

    // Toggle symbols button - find by aria-label
    const toggleButton = screen.getByRole('button', { name: /special symbols/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate_password_cmd', {
        password: 'test',
        salt: 'salt',
        length: 16,
        useSymbols: true,
      });
    });
  });

  it('should copy result to clipboard when copy button is clicked', async () => {
    mockInvoke.mockImplementation(async (cmd: string, _args?: any) => {
      if (cmd === 'generate_password_cmd') {
        return { password: 'CopyMe123' };
      }
      if (cmd === 'copy_to_clipboard') {
        return undefined;
      }
    });

    render(<App />);

    // Set values to trigger generation
    const passwordInput = screen.getByPlaceholderText('Enter your master password');
    fireEvent.change(passwordInput, { target: { value: 'test' } });

    const saltInput = screen.getByPlaceholderText('Enter salt value');
    fireEvent.change(saltInput, { target: { value: 'salt' } });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate_password_cmd', expect.anything());
    });

    // Click copy button
    const copyButton = screen.getByText(/copy to clipboard/i);
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('copy_to_clipboard', { text: 'CopyMe123' });
    });

    // Check copied feedback appears
    expect(await screen.findByText(/✓/)).toBeInTheDocument();
  });

  it('should handle empty password gracefully', async () => {
    mockInvoke.mockResolvedValue({ password: '' });

    render(<App />);

    // Only enter salt, leave password empty
    const saltInput = screen.getByPlaceholderText('Enter salt value');
    fireEvent.change(saltInput, { target: { value: 'mysalt' } });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('generate_password_cmd', {
        password: '',
        salt: 'mysalt',
        length: 16,
        useSymbols: false,
      });
    });

    const resultField = screen.getByPlaceholderText('Generated password will appear here') as HTMLInputElement;
    expect(resultField.value).toBe('');
  });

  it('should have empty result when both password and salt are empty', async () => {
    render(<App />);

    // Don't enter anything - both fields should be empty
    const passwordInput = screen.getByPlaceholderText('Enter your master password') as HTMLInputElement;
    const saltInput = screen.getByPlaceholderText('Enter salt value') as HTMLInputElement;

    expect(passwordInput.value).toBe('');
    expect(saltInput.value).toBe('');

    // Wait a bit to ensure useEffect has run
    await waitFor(() => {
      const resultField = screen.getByPlaceholderText('Generated password will appear here') as HTMLInputElement;
      expect(resultField.value).toBe('');
    });

    // Invoke should not be called when both fields are empty
    expect(mockInvoke).not.toHaveBeenCalledWith('generate_password_cmd', expect.anything());
  });

  it('should handle multiple input changes in sequence', async () => {
    mockInvoke.mockResolvedValue({ password: 'FinalResult' });

    render(<App />);

    // Enter password
    const passwordInput = screen.getByPlaceholderText('Enter your master password');
    fireEvent.change(passwordInput, { target: { value: 'pass1' } });

    await waitFor(() => expect(mockInvoke).toHaveBeenCalled());

    // Clear to track subsequent calls
    mockInvoke.mockClear();

    // Enter salt
    const saltInput = screen.getByPlaceholderText('Enter salt value');
    fireEvent.change(saltInput, { target: { value: 'salt1' } });

    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(1));

    // Change length
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: 24 } });

    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(2));

    // Toggle symbols - click the button by aria-label
    const toggleButton = screen.getByRole('button', { name: /special symbols/i });
    fireEvent.click(toggleButton);

    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(3));

    // Verify final call has all updated values
    expect(mockInvoke).toHaveBeenLastCalledWith('generate_password_cmd', {
      password: 'pass1',
      salt: 'salt1',
      length: 24,
      useSymbols: true,
    });
  });

  it('should handle invoke errors gracefully', async () => {
    mockInvoke.mockRejectedValue(new Error('Backend error'));

    render(<App />);

    const passwordInput = screen.getByPlaceholderText('Enter your master password');
    fireEvent.change(passwordInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled();
    });

    // Result should be empty on error
    const resultField = screen.getByPlaceholderText('Generated password will appear here') as HTMLInputElement;
    expect(resultField.value).toBe('');
  });
});

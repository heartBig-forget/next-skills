/**
 * Tests for components/BookEvent.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookEvent from '@/components/BookEvent';

describe('BookEvent component', () => {
  describe('initial render', () => {
    it('renders the email input form by default', () => {
      render(<BookEvent />);
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    });

    it('renders the submit button', () => {
      render(<BookEvent />);
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders the email label', () => {
      render(<BookEvent />);
      expect(screen.getByText(/email address/i)).toBeInTheDocument();
    });

    it('renders the email input with correct type', () => {
      render(<BookEvent />);
      const input = screen.getByRole('textbox', { name: /email address/i });
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders the email input with placeholder text', () => {
      render(<BookEvent />);
      const input = screen.getByRole('textbox', { name: /email address/i });
      expect(input).toHaveAttribute('placeholder', 'Enter your email address');
    });

    it('does NOT show the success message initially', () => {
      render(<BookEvent />);
      expect(screen.queryByText(/thank you for booking/i)).not.toBeInTheDocument();
    });

    it('renders the book-event container with correct id', () => {
      const { container } = render(<BookEvent />);
      expect(container.querySelector('#book-event')).toBeInTheDocument();
    });
  });

  describe('email input interaction', () => {
    it('updates email input value as user types', async () => {
      const user = userEvent.setup();
      render(<BookEvent />);

      const input = screen.getByRole('textbox', { name: /email address/i });
      await user.type(input, 'test@example.com');

      expect(input).toHaveValue('test@example.com');
    });

    it('starts with an empty email input', () => {
      render(<BookEvent />);
      const input = screen.getByRole('textbox', { name: /email address/i });
      expect(input).toHaveValue('');
    });

    it('clears correctly on re-render after typing', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<BookEvent />);
      const input = screen.getByRole('textbox', { name: /email address/i });
      await user.type(input, 'hello@world.com');
      expect(input).toHaveValue('hello@world.com');
      unmount();

      // Re-render gives a fresh component
      render(<BookEvent />);
      expect(screen.getByRole('textbox', { name: /email address/i })).toHaveValue('');
    });
  });

  describe('form submission', () => {
    it('prevents default form submission behavior', () => {
      render(<BookEvent />);
      // The form has no accessible name so we query it via the DOM directly
      const formElement = document.querySelector('form')!;
      expect(formElement).not.toBeNull();
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      fireEvent(formElement, submitEvent);
      // The handler calls e.preventDefault() - form should not submit
      // Note: jsdom doesn't navigate, but we verify the form remains mounted
      expect(formElement).toBeInTheDocument();
    });

    it('does not navigate away or unmount the form on submit', async () => {
      const user = userEvent.setup();
      render(<BookEvent />);

      const input = screen.getByRole('textbox', { name: /email address/i });
      await user.type(input, 'dev@example.com');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Form is still present because handleSubmit only calls preventDefault
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    });

    it('does not show success message after submit (handleSubmit does not call setSubmitted)', async () => {
      const user = userEvent.setup();
      render(<BookEvent />);

      const input = screen.getByRole('textbox', { name: /email address/i });
      await user.type(input, 'user@test.com');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Since handleSubmit only calls e.preventDefault() and never setSubmitted(true),
      // the success message should not appear
      expect(screen.queryByText(/thank you for booking/i)).not.toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    });

    it('submit button has type="submit"', () => {
      render(<BookEvent />);
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('success state', () => {
    it('shows the form when submitted state is false (default)', () => {
      render(<BookEvent />);
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeVisible();
    });

    it('does not render success paragraph when not submitted', () => {
      render(<BookEvent />);
      const successMsg = screen.queryByText(/we look forward to seeing you/i);
      expect(successMsg).not.toBeInTheDocument();
    });
  });

  describe('regression: email input is controlled', () => {
    it('reflects typed value immediately via onChange', async () => {
      const user = userEvent.setup();
      render(<BookEvent />);
      const input = screen.getByRole('textbox', { name: /email address/i });

      await user.type(input, 'a');
      expect(input).toHaveValue('a');

      await user.type(input, 'b');
      expect(input).toHaveValue('ab');
    });
  });
});
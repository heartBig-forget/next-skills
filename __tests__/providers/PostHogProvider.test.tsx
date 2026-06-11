/**
 * Tests for app/providers.tsx
 * Focus: conditional PostHog initialization based on env key presence.
 */

import React from 'react';
import { render, act } from '@testing-library/react';

const mockPosthogInit = jest.fn();
const mockPosthogClient = {};

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: mockPosthogInit,
  },
}));

jest.mock('posthog-js/react', () => ({
  __esModule: true,
  PostHogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="posthog-provider">{children}</div>
  ),
}));

import { PostHogProvider } from '@/app/providers';

describe('PostHogProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('when NEXT_PUBLIC_POSTHOG_KEY is present', () => {
    it('calls posthog.init with the key', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_testkey123';
      process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.posthog.com';

      await act(async () => {
        render(
          <PostHogProvider>
            <div>child</div>
          </PostHogProvider>
        );
      });

      expect(mockPosthogInit).toHaveBeenCalledTimes(1);
      expect(mockPosthogInit).toHaveBeenCalledWith(
        'phc_testkey123',
        expect.objectContaining({ api_host: 'https://us.posthog.com' })
      );
    });

    it('sets capture_pageview to false', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_key';
      process.env.NEXT_PUBLIC_POSTHOG_HOST = undefined;

      await act(async () => {
        render(
          <PostHogProvider>
            <span />
          </PostHogProvider>
        );
      });

      expect(mockPosthogInit).toHaveBeenCalledWith(
        'phc_key',
        expect.objectContaining({ capture_pageview: false })
      );
    });

    it('sets capture_pageleave to true', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_key';

      await act(async () => {
        render(
          <PostHogProvider>
            <span />
          </PostHogProvider>
        );
      });

      expect(mockPosthogInit).toHaveBeenCalledWith(
        'phc_key',
        expect.objectContaining({ capture_pageleave: true })
      );
    });

    it('passes the host from env to posthog.init', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_abc';
      process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://eu.posthog.com';

      await act(async () => {
        render(
          <PostHogProvider>
            <span />
          </PostHogProvider>
        );
      });

      expect(mockPosthogInit).toHaveBeenCalledWith(
        'phc_abc',
        expect.objectContaining({ api_host: 'https://eu.posthog.com' })
      );
    });
  });

  describe('when NEXT_PUBLIC_POSTHOG_KEY is missing', () => {
    it('does NOT call posthog.init', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

      await act(async () => {
        render(
          <PostHogProvider>
            <div>child</div>
          </PostHogProvider>
        );
      });

      expect(mockPosthogInit).not.toHaveBeenCalled();
    });

    it('logs a warning when key is missing', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        render(
          <PostHogProvider>
            <div />
          </PostHogProvider>
        );
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('NEXT_PUBLIC_POSTHOG_KEY')
      );
      warnSpy.mockRestore();
    });

    it('still renders children when key is missing', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

      let container: HTMLElement;
      await act(async () => {
        const result = render(
          <PostHogProvider>
            <p data-testid="child-element">hello</p>
          </PostHogProvider>
        );
        container = result.container;
      });

      expect(container!.querySelector('[data-testid="child-element"]')).toBeTruthy();
    });
  });

  describe('rendering', () => {
    it('wraps children in the PHProvider', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_key';

      let getByTestId: (id: string) => HTMLElement;
      await act(async () => {
        const result = render(
          <PostHogProvider>
            <button data-testid="inner-btn">Click</button>
          </PostHogProvider>
        );
        getByTestId = result.getByTestId;
      });

      expect(getByTestId!('posthog-provider')).toBeInTheDocument();
      expect(getByTestId!('inner-btn')).toBeInTheDocument();
    });

    it('renders children regardless of key presence', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

      let getByText: (text: string) => HTMLElement;
      await act(async () => {
        const result = render(
          <PostHogProvider>
            <span>test child</span>
          </PostHogProvider>
        );
        getByText = result.getByText;
      });

      expect(getByText!('test child')).toBeInTheDocument();
    });
  });
});
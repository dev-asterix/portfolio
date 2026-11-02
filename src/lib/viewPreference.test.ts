import { describe, it, expect, beforeEach } from 'vitest';
import { parseDefaultView, shouldRedirectToOS, readDefaultView, writeDefaultView, VIEW_COOKIE } from './viewPreference';

describe('default view preference', () => {
  it('defaults to the website for missing or unknown values', () => {
    expect(parseDefaultView(undefined)).toBe('site');
    expect(parseDefaultView('')).toBe('site');
    expect(parseDefaultView('desktop')).toBe('site');
    expect(parseDefaultView('os')).toBe('os');
  });

  it('redirects "/" to the OS only when opted in and not forced to the site', () => {
    expect(shouldRedirectToOS(undefined, null)).toBe(false);
    expect(shouldRedirectToOS('os', null)).toBe(true);
    expect(shouldRedirectToOS('os', 'site')).toBe(false);
    expect(shouldRedirectToOS('site', null)).toBe(false);
  });

  describe('cookie round-trip', () => {
    beforeEach(() => writeDefaultView('site'));

    it('stores "os" and clears the cookie for "site"', () => {
      expect(readDefaultView()).toBe('site');
      writeDefaultView('os');
      expect(document.cookie).toContain(`${VIEW_COOKIE}=os`);
      expect(readDefaultView()).toBe('os');
      writeDefaultView('site');
      expect(document.cookie).not.toContain(`${VIEW_COOKIE}=os`);
      expect(readDefaultView()).toBe('site');
    });
  });
});

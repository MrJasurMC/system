// ValidationService — client-side form checks. These are UX guardrails
// only (fast feedback before a round trip); the backend re-validates
// everything with the same rules and is the actual source of truth.

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ValidationService = {
  username(value: string): string | null {
    if (!value.trim()) return 'Username is required.';
    if (!USERNAME_RE.test(value)) {
      return 'Username must be 3-20 characters: letters, numbers, underscores only.';
    }
    return null;
  },

  email(value: string): string | null {
    if (!value.trim()) return 'Email is required.';
    if (!EMAIL_RE.test(value)) return 'Enter a valid email address.';
    return null;
  },

  password(value: string): string | null {
    if (!value) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    return null;
  },

  confirmPassword(password: string, confirm: string): string | null {
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  },
};

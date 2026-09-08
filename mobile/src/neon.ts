import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const neon = createClient({
  auth: {
    url: process.env.EXPO_PUBLIC_NEON_AUTH_URL,
    adapter: BetterAuthReactAdapter(),
  },
});
// Environment configuration for H2Oil Well Testing App

// Get the current origin, handling both client and server-side rendering
const getCurrentOrigin = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side rendering or build time
  return import.meta.env.VITE_APP_URL || 'https://welltest-calculator.vercel.app';
};

export const config = {
  // App URL - automatically detects current origin
  appUrl: getCurrentOrigin(),
  
  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Backend API URL - use localhost in development, production URL in production
  backendUrl: import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://h2oil-backend.vercel.app'),
  
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "https://woywfcpcbqgeeqcinwoz.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveXdmY3BjYnFnZWVxY2lud296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDUwNDUsImV4cCI6MjA3MzYyMTA0NX0.9f-HUst5HA4KYnkt2CqsLaylXQN1DBf_J9gXNtms3Tk"
  }
};

// Helper function to get the correct redirect URL
export const getRedirectUrl = (): string => {
  return config.appUrl;
};

// Helper function to get the correct OAuth redirect URL for Supabase
export const getOAuthRedirectUrl = (): string => {
  return `${config.supabase.url}/auth/v1/callback`;
};

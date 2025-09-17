// Environment configuration for H2Oil Well Testing App

export const config = {
  // App URL - defaults to current origin, can be overridden with VITE_APP_URL
  appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
  
  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
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

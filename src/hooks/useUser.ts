import { useCurrentUser } from "./useUsers";

export function useUser() {
  const { data: userResponse, isLoading, error } = useCurrentUser();
  
  // Enhanced debugging for authentication issues
  if (error) {
    console.error('User profile API error:', error);
    
    // Check if this is a token issue
    if ((error as any)?.response?.status === 401) {
      console.error('Authentication failed - token may be invalid or expired');
      console.error('Current auth_token:', localStorage.getItem('auth_token') ? 'Present' : 'Missing');
      console.error('Current token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    }
  }
  
  if (userResponse) {
    console.log('User profile API response:', userResponse);
  } else if (!isLoading && !error) {
    console.warn('No user data received from API - user may need to log in');
  }
  
  return {
    user: userResponse?.data || null,
    loading: isLoading,
    error,
  };
}

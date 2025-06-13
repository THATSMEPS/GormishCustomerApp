import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gormishbackend.onrender.com/api';

// Google OAuth parameters
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'myapp://auth'; // Custom scheme or deep link

export const LoginPopup = ({ isOpen, onClose }: Props) => {
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Function to open Google login page externally
  const openGoogleLogin = () => {
    setIsSigningIn(true);
    setAuthMessage(null);

    // Construct the Google OAuth URL with required parameters
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=token` +
      `&scope=openid%20email%20profile` +
      `&prompt=select_account`;

    // Open Google login page in a new popup window with specified dimensions
    // This allows the user to sign in and then redirect back to the app via the redirect URI
    window.open(googleAuthUrl, '_blank', 'width=500,height=600');
  };

  // Listen for redirect back with token in URL hash
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, token } = event.data || {};
      if (type === 'GOOGLE_AUTH_SUCCESS' && token) {
        // Handle token received from external login
        setAuthMessage('Google Sign-In successful! Redirecting...');
        localStorage.setItem('authToken', token);
        setIsSigningIn(false);
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);

    // Also check URL hash for token (in case of redirect in same window)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setAuthMessage('Google Sign-In successful! Redirecting...');
        localStorage.setItem('authToken', accessToken);
        setIsSigningIn(false);
        onClose();
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-200 bg-opacity-50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#6552FF]/80 backdrop-blur-xl rounded-[30px] p-8 w-full max-w-md text-white shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20"
            style={{
              WebkitBackdropFilter: 'blur(8px)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold mb-6">
                Login To Order
              </h2>

              <div className="space-y-6 flex justify-center">
                <button
                  onClick={openGoogleLogin}
                  disabled={isSigningIn}
                  className="flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md px-6 py-3 shadow-sm hover:shadow-md disabled:opacity-50 transition-shadow"
                >
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 533.5 544.3"
                  >
                    <path
                      fill="#4285F4"
                      d="M533.5 278.4c0-18.5-1.5-36.3-4.3-53.6H272v101.3h146.9c-6.3 34-25.4 62.8-54.3 82v68h87.7c51.3-47.3 81.2-116.7 81.2-197.7z"
                    />
                    <path
                      fill="#34A853"
                      d="M272 544.3c73.7 0 135.7-24.4 180.9-66.1l-87.7-68c-24.4 16.3-55.7 26-93.2 26-71.6 0-132.3-48.3-154.1-113.1H27.6v70.9c45.2 89.1 137.7 150.3 244.4 150.3z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M117.9 323.1c-10.7-31.8-10.7-66.1 0-97.9v-70.9H27.6c-38.6 75.3-38.6 164.7 0 240l90.3-71.2z"
                    />
                    <path
                      fill="#EA4335"
                      d="M272 107.7c39.9 0 75.7 13.7 103.9 40.7l77.9-77.9C405.7 24.6 344.1 0 272 0 165.3 0 72.8 61.2 27.6 150.3l90.3 70.9c21.8-64.8 82.5-113.5 154.1-113.5z"
                    />
                  </svg>
                  {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                </button>

                {authMessage && (
                  <p className={`text-sm mt-1 ${authMessage.includes('successful') ? 'text-green-200' : 'text-red-200'}`}>{authMessage}</p>
                )}
              </div>
            </motion.div>

            <p className="text-sm text-center mt-6 text-white/70">
              By Signing In You Are Agreeing Our Terms & Conditions And Privacy Policies
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

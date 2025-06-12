/**
 * This file contains minimal integration code to support Expo WebView communication.
 * It does not modify existing functionality or APIs.
 */

declare global {
  interface Window {
    authToken?: string;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export function setupWebViewIntegration() {
  // Listen for injected authToken and dispatch 'authTokenReady' event
  function checkAuthToken() {
    if (window.authToken) {
      const event = new Event('authTokenReady');
      window.dispatchEvent(event);
      console.log('[webview-integration] authTokenReady event dispatched');
    }
  }

  // Check periodically for authToken injected by Expo app
  const intervalId = setInterval(() => {
    if (window.authToken) {
      checkAuthToken();
      clearInterval(intervalId);
    }
  }, 500);

  // Send message to Expo app via postMessage
  function sendMessageToExpo(type: string, token: string | null = null) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      const message: { type: string; token?: string } = { type };
      if (token) {
        message.token = token;
      }
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
      console.log('[webview-integration] Sent message to Expo:', message);
    }
  }

  // Example usage: send APP_READY when app loads
  window.addEventListener('load', () => {
    sendMessageToExpo('APP_READY');
  });

  // Export functions for login/logout events to call
  return {
    sendLoginMessage: (token: string) => sendMessageToExpo('LOGIN', token),
    sendLogoutMessage: () => sendMessageToExpo('LOGOUT'),
  };
}

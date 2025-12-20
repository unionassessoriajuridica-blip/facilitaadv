import * as React from "react";
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useGoogleAuth } from './useGoogleAuth';

const googleConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  scopes: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send"
  ]
};

export const useCombinedAuth = () => {
  const auth = useAuth();
  const {
    isAuthenticated,
    signOut,
    setAccessToken,
    setIsAuthenticated
  } = useGoogleAuth(googleConfig);

  useEffect(() => {
    if (!auth.user && isAuthenticated) {
      signOut();
    }
  }, [auth.user, isAuthenticated, signOut]);

  useEffect(() => {
    if (auth.user && !isAuthenticated) {
      const savedTokens = localStorage.getItem(`google_tokens_${auth.user.id}`);
      if (savedTokens) {
        const { accessToken } = JSON.parse(savedTokens);
        setAccessToken(accessToken);
        setIsAuthenticated(true);
      }
    }
  }, [auth.user, isAuthenticated, setAccessToken, setIsAuthenticated]);

  return {
    ...auth,
    googleAuth: {
      isAuthenticated,
      signOut,
      setAccessToken,
      setIsAuthenticated
    },
    fullSignOut: async () => {
      await auth.signOut();
      signOut();
    },
    storeGoogleTokens: (tokens: { accessToken: string; refreshToken?: string }) => {
      if (auth.user) {
        localStorage.setItem(`google_tokens_${auth.user.id}`, JSON.stringify(tokens));
      }
    }
  };
};

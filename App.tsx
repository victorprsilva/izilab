import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CustomAbbreviation } from './types';
import { authService, UserProfile } from './services/authService';
import AuthScreen from './components/auth/AuthScreen';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PlansPage from './pages/PlansPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const location = useLocation();
  
  // Authentication State
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [customAbbreviations, setCustomAbbreviations] = useState<CustomAbbreviation[]>([]);

  // Check authentication on mount and listen for auth changes
  useEffect(() => {
    authService.getSession().then(({ session }) => {
      setSession(session);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile and customizations when session changes
  useEffect(() => {
    if (session?.user?.id) {
      // Fetch profile
      authService.getProfile(session.user.id).then(({ profile }) => {
        setUserProfile(profile);
      });
      
      // Fetch customizations from Supabase
      authService.getCustomizations(session.user.id).then(({ abbreviations }) => {
        if (abbreviations && abbreviations.length > 0) {
          setCustomAbbreviations(abbreviations);
        }
      });
    } else {
      setUserProfile(null);
      setCustomAbbreviations([]);
    }
  }, [session]);

  const handleAuthSuccess = () => {
    // Session will be updated automatically via onAuthStateChange
  };

  const handleLogout = async () => {
    await authService.signOut();
    setSession(null);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  // Render Logic
  if (isAuthChecking) return null;

  // Allow access to reset-password page without session
  if (location.pathname === '/reset-password') {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    );
  }

  if (!session) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            session={session}
            userProfile={userProfile}
            onLogout={handleLogout}
            customAbbreviations={customAbbreviations}
            setCustomAbbreviations={setCustomAbbreviations}
          />
        }
      />
      <Route
        path="/profile"
        element={
          <ProfilePage
            session={session}
            userProfile={userProfile}
            onProfileUpdate={handleProfileUpdate}
          />
        }
      />
      <Route
        path="/plans"
        element={<PlansPage session={session} />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
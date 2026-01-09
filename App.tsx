import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomAbbreviation } from './types';
import { authService, UserProfile } from './services/authService';
import AuthScreen from './components/auth/AuthScreen';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PlansPage from './pages/PlansPage';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
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

  // Fetch user profile when session changes
  useEffect(() => {
    if (session?.user?.id) {
      authService.getProfile(session.user.id).then(({ profile }) => {
        setUserProfile(profile);
      });
    } else {
      setUserProfile(null);
    }
  }, [session]);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('seo_custom_abbreviations');
    if (saved) {
      try {
        setCustomAbbreviations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

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
        element={<PlansPage currentPlan="free" />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
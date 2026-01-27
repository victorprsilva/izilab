import React, { useState } from 'react';
import AuthContainer from './AuthContainer';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

type AuthView = 'login' | 'signup' | 'forgot-password';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const getTitle = () => {
    switch (currentView) {
      case 'login':
        return 'Acesso à Plataforma';
      case 'signup':
        return 'Criar Conta';
      case 'forgot-password':
        return 'Recuperar Senha';
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'login':
        return 'Área exclusiva para Mentorados da Inteligência Híbrida.';
      case 'signup':
        return 'Crie sua conta para acessar a plataforma.';
      case 'forgot-password':
        return 'Recupere o acesso à sua conta.';
    }
  };

  return (
    <AuthContainer title={getTitle()} subtitle={getSubtitle()}>
      {currentView === 'login' && (
        <LoginForm
          onSuccess={onAuthSuccess}
          onSwitchToSignup={() => setCurrentView('signup')}
          onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
        />
      )}
      {currentView === 'signup' && (
        <SignupForm
          onSuccess={onAuthSuccess}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
      {currentView === 'forgot-password' && (
        <ForgotPasswordForm
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
    </AuthContainer>
  );
};

export default AuthScreen;

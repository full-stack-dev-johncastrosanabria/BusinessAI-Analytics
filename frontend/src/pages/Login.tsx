import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import './Login.css';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: 'demo@businessai.com',
    password: 'demo123'
  });

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = await login(credentials.email, credentials.password);
    
    if (success) {
      navigate(from, { replace: true });
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const fillDemoCredentials = () => {
    setCredentials({
      email: 'demo@businessai.com',
      password: 'demo123'
    });
  };

  return (
    <div className="login-container">
      {/* Background Elements */}
      <div className="login-background">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-pattern"></div>
      </div>

      {/* Header Controls */}
      <div className="login-header">
        <div className="login-controls">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="login-content">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 100 100" className="logo-svg">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="30" r="8" fill="url(#logoGradient)" />
                  <circle cx="30" cy="50" r="6" fill="url(#logoGradient)" opacity="0.8" />
                  <circle cx="70" cy="50" r="6" fill="url(#logoGradient)" opacity="0.8" />
                  <circle cx="50" cy="70" r="8" fill="url(#logoGradient)" />
                  <path d="M30 50 L50 30 L70 50 L50 70 Z" stroke="url(#logoGradient)" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h1 className="brand-title">BusinessAI</h1>
              <p className="brand-subtitle">Analytics Platform</p>
            </div>
            
            <div className="brand-description">
              <h2>{t('login.welcome')}</h2>
              <p>{t('login.description')}</p>
              
              <div className="feature-highlights">
                <div className="feature-item">
                  <div className="feature-icon">📊</div>
                  <span>{t('login.feature1')}</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🤖</div>
                  <span>{t('login.feature2')}</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📈</div>
                  <span>{t('login.feature3')}</span>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🌍</div>
                  <span>{t('login.feature4')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="login-form-content">
            <div className="form-header">
              <h2>{t('login.signIn')}</h2>
              <p>{t('login.signInDescription')}</p>
            </div>

            {/* Demo Credentials Banner */}
            <div className="demo-banner">
              <div className="demo-icon">🎯</div>
              <div className="demo-text">
                <strong>{t('login.demoMode')}</strong>
                <p>{t('login.demoInstructions')}</p>
              </div>
              <button 
                type="button" 
                className="demo-fill-btn"
                onClick={fillDemoCredentials}
              >
                {t('login.fillDemo')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">{t('login.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleInputChange}
                  placeholder="demo@businessai.com"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('login.password')}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  placeholder="demo123"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  {t('login.rememberMe')}
                </label>
                <a href="#" className="forgot-link">{t('login.forgotPassword')}</a>
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    {t('login.signingIn')}
                  </div>
                ) : (
                  t('login.signIn')
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                {t('login.noAccount')} 
                <a href="#" className="signup-link">{t('login.signUp')}</a>
              </p>
            </div>

            {/* Mock Credentials Display */}
            <div className="credentials-display">
              <h4>{t('login.mockCredentials')}</h4>
              <div className="credential-item">
                <span className="credential-label">{t('login.email')}:</span>
                <code>demo@businessai.com</code>
              </div>
              <div className="credential-item">
                <span className="credential-label">{t('login.password')}:</span>
                <code>demo123</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
      </div>
    </div>
  );
};

export default Login;
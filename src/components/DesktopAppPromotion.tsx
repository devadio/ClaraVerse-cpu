/**
 * Desktop App Promotion Component
 *
 * Shows notifications when users try to access desktop-only features
 * in the web version of the app.
 */

import React, { useEffect, useState } from 'react';
import { isElectron } from '../utils/electronEnvironment';

interface DesktopPromptEvent extends CustomEvent {
  detail: {
    feature: string;
    method: string;
    message: string;
  };
}

interface Notification {
  id: string;
  feature: string;
  method: string;
  message: string;
  timestamp: number;
}

export const DesktopAppPromotion: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Don't show notifications in Electron
    if (isElectron()) return;

    const handleDesktopPrompt = (event: Event) => {
      const customEvent = event as DesktopPromptEvent;
      const { feature, method, message } = customEvent.detail;

      // Create unique ID for this notification
      const id = `${feature}-${method}`;

      // Don't show if already dismissed
      if (dismissed.has(id)) return;

      // Check if this notification already exists
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === id);
        if (exists) return prev;

        return [
          ...prev,
          {
            id,
            feature,
            method,
            message,
            timestamp: Date.now(),
          },
        ];
      });

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        dismissNotification(id);
      }, 10000);
    };

    window.addEventListener('show-desktop-prompt', handleDesktopPrompt);

    return () => {
      window.removeEventListener('show-desktop-prompt', handleDesktopPrompt);
    };
  }, [dismissed]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setDismissed((prev) => new Set(prev).add(id));
  };

  const dismissAll = () => {
    notifications.forEach((n) => {
      setDismissed((prev) => new Set(prev).add(n.id));
    });
    setNotifications([]);
  };

  // Don't render anything in Electron
  if (isElectron()) return null;

  // Don't render if no notifications
  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            color: '#e2e8f0',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>💻</span>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
                Desktop App Required
              </h4>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0',
                lineHeight: '1',
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#cbd5e1' }}>
            {notification.message}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <a
              href="https://github.com/badboysm890/ClaraVerse/releases"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
                textAlign: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              Download Desktop App
            </a>

            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Feature: {notification.feature} → {notification.method}
            </div>
          </div>
        </div>
      ))}

      {notifications.length > 1 && (
        <button
          onClick={dismissAll}
          style={{
            backgroundColor: '#334155',
            border: '1px solid #475569',
            borderRadius: '6px',
            padding: '8px',
            color: '#cbd5e1',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          Dismiss All
        </button>
      )}

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

/**
 * Banner component to show at the top of the page in web mode
 */
export const WebModeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('web-mode-banner-dismissed') === 'true';
  });

  useEffect(() => {
    // Don't show in Electron
    if (isElectron()) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('web-mode-banner-dismissed', 'true');
  };

  if (dismissed || isElectron()) return null;

  return (
    <div
      style={{
        backgroundColor: '#1e40af',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>ℹ️</span>
        <div>
          <strong>You're using the web version.</strong> Some features like Docker management, local AI models, and
          system integration require the desktop app.
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <a
          href="https://github.com/badboysm890/ClaraVerse/releases"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: 'white',
            color: '#1e40af',
            padding: '6px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          Get Desktop App
        </a>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '0',
            lineHeight: '1',
          }}
          aria-label="Dismiss banner"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default DesktopAppPromotion;

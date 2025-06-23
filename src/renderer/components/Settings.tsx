import React, { useState, useEffect } from 'react';

interface SettingsProps {
  settings: {
    openaiApiKey: string;
  };
  onSave: (settings: { openaiApiKey: string }) => void;
}

export default function Settings({ settings, onSave }: SettingsProps) {
  const [apiKey, setApiKey] = useState(settings.openaiApiKey || '');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  useEffect(() => {
    setApiKey(settings.openaiApiKey || '');
  }, [settings.openaiApiKey]);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      await onSave({ openaiApiKey: apiKey });
      setSaveStatus('saved');

      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const getSaveButtonText = () => {
    if (saveStatus === 'saving') return 'שומר...';
    if (saveStatus === 'saved') return '✓ נשמר';
    if (saveStatus === 'error') return '✗ שגיאה';
    return 'שמור הגדרות';
  };

  const getSaveButtonClass = () => {
    const baseClass = 'save-button';
    if (saveStatus === 'saved') return `${baseClass} success`;
    if (saveStatus === 'error') return `${baseClass} error`;
    return baseClass;
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        <h2>הגדרות</h2>

        <div className="setting-group">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label htmlFor="api-key-input" className="setting-label">
            מפתח API של OpenAI
          </label>
          <input
            id="api-key-input"
            type="password"
            className="setting-input"
            placeholder="הכנס את מפתח ה-API של OpenAI"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="setting-description">
            המפתח נשמר באופן מקומי במחשב שלך ולא נשלח לשום מקום מלבד OpenAI.
          </p>
        </div>

        <div className="setting-actions">
          <button
            type="button"
            className={getSaveButtonClass()}
            onClick={handleSave}
            disabled={isLoading || !apiKey.trim()}
          >
            {getSaveButtonText()}
          </button>
        </div>

        <div className="settings-info">
          <h3>מידע נוסף</h3>
          <ul>
            <li>המפתח נשמר באופן מקומי במחשב שלך</li>
            <li>המפתח משמש לשליחת בקשות ל-OpenAI API</li>
            <li>ללא מפתח תקין לא ניתן לבצע ניתוח נתונים</li>
            <li>
              ניתן לקבל מפתח API מ-
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                אתר OpenAI
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import QueryInput from './components/QueryInput';
import ResultDisplay from './components/ResultDisplay';
import Settings from './components/Settings';
import History from './components/History';
import './App.css';

interface AnalysisResult {
  id: number;
  query: string;
  response: string;
  fileName: string;
  timestamp: string;
}

export default function App() {
  const [uploadedData, setUploadedData] = useState<any[] | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'analysis' | 'settings' | 'history'
  >('analysis');
  const [settings, setSettings] = useState<{ openaiApiKey: string }>({
    openaiApiKey: '',
  });
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  // Load settings and history on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.electron.settings.getAll();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch {
        // Failed to load settings, using defaults
      }
    };

    const loadHistory = async () => {
      try {
        const savedHistory = await window.electron.history.get();
        if (savedHistory) {
          setHistory(savedHistory);
        }
      } catch {
        // Failed to load history, using empty array
      }
    };

    loadSettings();
    loadHistory();
  }, []);

  const handleFileUpload = (data: any[], fileName: string) => {
    setUploadedData(data);
    setUploadedFileName(fileName);
    setResult(null);
    setError(null);
  };

  const handleQuery = async (queryText: string) => {
    if (!uploadedData || uploadedData.length === 0) {
      setError('אנא העלה קובץ נתונים תחילה');
      return;
    }

    if (!settings.openaiApiKey) {
      setError('אנא הגדר מפתח OpenAI API בהגדרות');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Prepare data sample for analysis (first 10 rows to avoid token limits)
      const dataSample = uploadedData.slice(0, 10);
      const dataHeaders = Object.keys(uploadedData[0] || {});

      const systemPrompt = `אתה אנליסט נתונים מומחה. אתה מקבל נתונים בעברית ונדרש לענות על שאילתות בעברית.
      
הנתונים כוללים את העמודות הבאות: ${dataHeaders.join(', ')}
דוגמת נתונים (10 שורות ראשונות):
${JSON.stringify(dataSample, null, 2)}

כשאתה יוצר תרשימים, החזר את התשובה בפורמט הבא:
1. תחילה תן הסבר טקסטואלי של הניתוח
2. אם נדרש תרשים, הוסף JSON בפורמט הבא:
{
  "chartType": "bar|line|pie|doughnut|radar|polarArea|scatter",
  "data": {
    "labels": ["תווית1", "תווית2"],
    "datasets": [{
      "label": "שם הסדרה",
      "data": [1, 2, 3],
      "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56"]
    }]
  },
  "options": {
    "plugins": {
      "title": {
        "display": true,
        "text": "כותרת התרשים"
      }
    }
  }
}

ענה בעברית בלבד.`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: queryText,
              },
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 'שגיאה בקריאה ל-OpenAI API',
        );
      }

      const data = await response.json();
      const analysisResult = data.choices[0]?.message?.content || '';

      // Try to extract and validate chart data
      const chartMatch = analysisResult.match(/\{[\s\S]*"chartType"[\s\S]*\}/);

      if (chartMatch) {
        try {
          JSON.parse(chartMatch[0]); // Validate JSON
        } catch {
          // Invalid JSON, remove it
        }
      }

      setResult(analysisResult);

      // Save to history
      const historyItem = {
        query: queryText,
        response: analysisResult,
        fileName: uploadedFileName,
      };

      try {
        const savedItem = await window.electron.history.add(historyItem);
        setHistory((prev) => [savedItem, ...prev.slice(0, 99)]); // Keep max 100 items
      } catch {
        // Failed to save to history, continue anyway
      }
    } catch (analysisError) {
      if (analysisError instanceof Error) {
        setError(analysisError.message);
      } else {
        setError('שגיאה בעיבוד הבקשה');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async (newSettings: Settings) => {
    try {
      await window.electron.settings.set(
        'openaiApiKey',
        newSettings.openaiApiKey,
      );
      setSettings(newSettings);
    } catch {
      throw new Error('שגיאה בשמירת ההגדרות');
    }
  };

  const handleHistoryView = (item: AnalysisResult) => {
    setResult(item.response);
    setActiveTab('analysis');
  };

  const handleHistoryClear = async () => {
    try {
      await window.electron.history.clear();
      setHistory([]);
    } catch {
      // Failed to clear history
    }
  };

  const handleHistoryDelete = async (id: number) => {
    try {
      await window.electron.history.delete(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // Failed to delete item
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>ניתוח סקרים וסטטיסטיקות</h1>
        <p>כלי לייבוא, שאילת נתונים וייצוג גרפי באמצעות AI</p>
      </div>

      <div className="app-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          ניתוח נתונים
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          היסטוריה
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          הגדרות
        </button>
      </div>

      <div className="app-content">
        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            <div className="upload-section">
              <h2>העלאת קובץ נתונים</h2>
              <FileUpload onFileUpload={handleFileUpload} />
              {uploadedData && (
                <div className="upload-success">
                  <p>
                    ✅ הועלה בהצלחה: <strong>{uploadedFileName}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="query-section">
              <h2>שאילתת נתונים</h2>
              <QueryInput
                value={query}
                onChange={setQuery}
                onSubmit={handleQuery}
                disabled={!uploadedData || !settings.openaiApiKey}
                loading={loading}
              />
            </div>

            <div className="results-section">
              <h2>תוצאות</h2>
              <ResultDisplay result={result} error={error} loading={loading} />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <History
            history={history}
            onView={handleHistoryView}
            onClear={handleHistoryClear}
            onDelete={handleHistoryDelete}
          />
        )}

        {activeTab === 'settings' && (
          <Settings settings={settings} onSave={handleSettingsSave} />
        )}
      </div>
    </div>
  );
}

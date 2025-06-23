import { useState } from 'react';

interface HistoryItem {
  id: number;
  timestamp: string;
  query: string;
  response: string;
  chartData?: any;
  fileName?: string;
}

interface HistoryProps {
  history: HistoryItem[];
  onClear: () => void;
  onDelete: (id: number) => void;
  onItemSelect: (item: HistoryItem) => void;
}

export default function History({
  history,
  onClear,
  onDelete,
  onItemSelect,
}: HistoryProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const handleClear = () => {
    if (showConfirmClear) {
      onClear();
      setShowConfirmClear(false);
    } else {
      setShowConfirmClear(true);
    }
  };

  const handleCancelClear = () => {
    setShowConfirmClear(false);
  };

  return (
    <div className="history-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">היסטוריית ניתוחים</h2>
          {history.length > 0 && (
            <div className="history-actions">
              {showConfirmClear ? (
                <div className="confirm-clear">
                  <span>למחוק את כל ההיסטוריה?</span>
                  <button
                    onClick={handleClear}
                    className="confirm-btn danger"
                    type="button"
                  >
                    מחק
                  </button>
                  <button
                    onClick={handleCancelClear}
                    className="cancel-btn"
                    type="button"
                  >
                    ביטול
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClear}
                  className="clear-btn"
                  type="button"
                >
                  מחק הכל
                </button>
              )}
            </div>
          )}
        </div>

        <div className="history-content">
          {history.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">📊</div>
              <p>אין עדיין ניתוחים בהיסטוריה</p>
              <p className="empty-subtitle">
                בצע ניתוח ראשון כדי לראות אותו כאן
              </p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-content">
                    <div className="history-item-header">
                      <div className="history-item-meta">
                        <span className="history-date">
                          {formatDate(item.timestamp)}
                        </span>
                        {item.fileName && (
                          <span className="history-file">
                            📄 {item.fileName}
                          </span>
                        )}
                        {item.chartData && (
                          <span className="history-chart-badge">📊 תרשים</span>
                        )}
                      </div>
                      <div className="history-item-actions">
                        <button
                          onClick={() => onItemSelect(item)}
                          className="view-btn"
                          type="button"
                          title="הצג ניתוח"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="delete-btn"
                          type="button"
                          title="מחק ניתוח"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="history-item-body">
                      <div className="history-query">
                        <strong>שאילתה:</strong> {truncateText(item.query, 100)}
                      </div>
                      <div className="history-response">
                        <strong>תגובה:</strong>{' '}
                        {truncateText(item.response, 150)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

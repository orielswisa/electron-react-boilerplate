import React from 'react';

interface QueryInputProps {
  disabled?: boolean;
  loading?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit: (query: string) => void;
}

export default function QueryInput({
  disabled = false,
  loading = false,
  value = '',
  onChange = () => {},
  onSubmit,
}: QueryInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  const exampleQueries = [
    'הצג התפלגות בן לפי מין',
    'מהו הממוצע של כל השדות הנומריים?',
    'צור תרשים עוגה של הקטגוריות הפופולריות ביותר',
    'הצג מגמות לפי חודשים',
    'השווה בין קבוצות שונות בנתונים',
  ];

  return (
    <div className="query-input-container">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <textarea
            className="query-textarea"
            placeholder="מה תרצה לדעת על הנתונים? (לדוגמה: 'הצג התפלגות לפי גיל', 'צור תרשים עוגה של הקטגוריות')"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || loading}
            rows={3}
          />
          <button
            type="submit"
            className={`submit-button ${loading ? 'loading' : ''}`}
            disabled={disabled || loading || !value.trim()}
          >
            {loading ? <div className="btn-spinner" /> : 'שלח שאילתה'}
          </button>
        </div>
      </form>

      <div className="example-queries">
        <p className="examples-title">דוגמאות לשאילתות:</p>
        <div className="example-buttons">
          {exampleQueries.map((query) => (
            <button
              key={`example-${query}`}
              type="button"
              className="example-button"
              onClick={() => onChange(query)}
              disabled={disabled || loading}
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

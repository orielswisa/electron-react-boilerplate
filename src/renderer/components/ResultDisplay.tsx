import React, { useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import {
  Bar,
  Line,
  Pie,
  Doughnut,
  PolarArea,
  Radar,
  Scatter,
} from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Filler,
);

interface ChartData {
  chartType: string;
  data: any;
  options?: any;
}

interface ResultDisplayProps {
  result: string | null;
  error: string | null;
  loading: boolean;
}

export default function ResultDisplay({
  result,
  error,
  loading,
}: ResultDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSection((prevKey) => (prevKey === section ? null : section));
  };

  // Extract chart data from result if present
  const extractChartData = (resultText: string): ChartData | null => {
    try {
      // Look for JSON structure containing chart data
      const chartMatch = resultText.match(/\{[\s\S]*"chartType"[\s\S]*\}/);
      if (chartMatch) {
        const chartData = JSON.parse(chartMatch[0]);
        return chartData;
      }
    } catch {
      // If parsing fails, return null
    }
    return null;
  };

  const renderChart = (chartData: ChartData) => {
    const { chartType, data, options } = chartData;

    // Use object destructuring
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: data.title || 'תרשים',
        },
      },
      ...options,
    };

    const chartProps = {
      data,
      options: chartOptions,
      height: 400,
    };

    switch (chartType.toLowerCase()) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'polararea':
        return <PolarArea {...chartProps} />;
      case 'radar':
        return <Radar {...chartProps} />;
      case 'scatter':
        return <Scatter {...chartProps} />;
      default:
        return <div className="error">סוג תרשים לא נתמך: {chartType}</div>;
    }
  };

  if (loading) {
    return (
      <div className="result-display loading">
        <div className="loading-spinner" />
        <p>מעבד נתונים...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-display error">
        <div className="error-content">
          <h3>שגיאה</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const chartData = extractChartData(result);
  const textContent = result
    .replace(/\{[\s\S]*"chartType"[\s\S]*\}/, '')
    .trim();

  return (
    <div className="result-display">
      <div className="result-content">
        {chartData && (
          <div className="chart-section">
            <div className="section-header">
              <h3>תרשים</h3>
              <button
                type="button"
                className="toggle-button"
                onClick={() => toggleSection('chart')}
              >
                {expandedSection === 'chart' ? '−' : '+'}
              </button>
            </div>
            {expandedSection === 'chart' && (
              <div ref={chartContainerRef} className="chart-container">
                {renderChart(chartData)}
              </div>
            )}
          </div>
        )}

        {textContent && (
          <div className="text-section">
            <div className="section-header">
              <h3>ניתוח</h3>
              <button
                type="button"
                className="toggle-button"
                onClick={() => toggleSection('analysis')}
              >
                {expandedSection === 'analysis' ? '−' : '+'}
              </button>
            </div>
            {expandedSection === 'analysis' && (
              <div className="analysis-content">
                <pre className="analysis-text">{textContent}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

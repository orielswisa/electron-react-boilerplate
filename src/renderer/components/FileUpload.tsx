import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileUpload: (data: any[], fileName: string) => void;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setIsProcessing(true);

      // Check file type
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (!fileType || !['csv', 'xlsx', 'xls'].includes(fileType)) {
        setError('אנא העלה קובץ CSV או Excel.');
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            throw new Error('Failed to read file');
          }

          let data: any[] = [];

          if (fileType === 'csv') {
            // Parse CSV
            const text = result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map((header) => header.trim());

            for (let i = 1; i < lines.length; i += 1) {
              if (!lines[i].trim()) {
                // Skip empty lines
              } else {
                const values = lines[i].split(',');
                const row: Record<string, string> = {};

                headers.forEach((header, index) => {
                  row[header] = values[index]?.trim() || '';
                });

                data.push(row);
              }
            }
          } else {
            // Parse Excel
            const arrayBuffer = result as ArrayBuffer;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(worksheet);
          }

          if (data.length === 0) {
            throw new Error('הקובץ ריק או לא מכיל נתונים תקינים');
          }

          onFileUpload(data, file.name);
          setIsProcessing(false);
        } catch {
          setError('שגיאה בעיבוד הקובץ. אנא בדוק את פורמט הקובץ ונסה שוב.');
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError('שגיאה בקריאת הקובץ. אנא נסה שוב.');
        setIsProcessing(false);
      };

      if (fileType === 'csv') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    },
    [onFileUpload],
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [processFile],
  );

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !isProcessing && document.getElementById('fileInput')?.click()
        }
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') &&
          !isProcessing &&
          document.getElementById('fileInput')?.click()
        }
      >
        <input
          id="fileInput"
          type="file"
          style={{ display: 'none' }}
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        <div className="upload-content">
          {isProcessing ? (
            <>
              <div className="upload-spinner" />
              <p className="upload-text">מעבד קובץ...</p>
            </>
          ) : (
            <>
              <div className="file-upload-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </div>
              <div className="upload-text">
                <span className="upload-link">לחץ להעלאה</span> או גרור ושחרר
                קובץ
              </div>
              <p className="upload-formats">CSV, XLS או XLSX (עד 10MB)</p>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

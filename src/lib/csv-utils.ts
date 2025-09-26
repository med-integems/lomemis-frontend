import { CSVOptions } from "@/types/export";

export class CSVGenerator {
  static generate(
    headers: string[],
    data: string[][],
    options: CSVOptions = {}
  ): string {
    const {
      delimiter = ',',
      lineEnding = '\n',
      escapeQuotes = true,
      includeHeaders = true,
      encoding = 'utf-8-bom'
    } = options;

    const rows: string[] = [];

    // Add headers if requested
    if (includeHeaders && headers.length > 0) {
      const headerRow = headers.map(header => 
        this.escapeField(header, delimiter, escapeQuotes)
      ).join(delimiter);
      rows.push(headerRow);
    }

    // Add data rows
    data.forEach(row => {
      const csvRow = row.map(field => 
        this.escapeField(field, delimiter, escapeQuotes)
      ).join(delimiter);
      rows.push(csvRow);
    });

    let csvContent = rows.join(lineEnding);

    // Add BOM for UTF-8 encoding to ensure Excel compatibility
    if (encoding === 'utf-8-bom') {
      csvContent = '\uFEFF' + csvContent;
    }

    return csvContent;
  }

  static escapeField(field: string | null | undefined, delimiter = ',', escapeQuotes = true): string {
    if (field === null || field === undefined) {
      return '';
    }

    const stringField = String(field);
    
    // Check if field needs quoting (contains delimiter, quotes, or line breaks)
    const needsQuoting = stringField.includes(delimiter) || 
                        stringField.includes('"') || 
                        stringField.includes('\n') || 
                        stringField.includes('\r');

    if (!needsQuoting) {
      return stringField;
    }

    // Escape quotes by doubling them
    const escaped = escapeQuotes ? stringField.replace(/"/g, '""') : stringField;
    
    // Wrap in quotes
    return `"${escaped}"`;
  }

  static downloadCSV(content: string, filename: string): void {
    try {
      // Create blob with CSV content
      const blob = new Blob([content], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Create download URL
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = this.sanitizeFilename(filename);
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV download failed:', error);
      throw new Error('Failed to download CSV file');
    }
  }

  static sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    const sanitized = filename
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
      .replace(/\s+/g, '-') // Replace spaces with dash
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase();

    // Ensure .csv extension
    if (!sanitized.endsWith('.csv')) {
      return sanitized + '.csv';
    }

    // Limit filename length (max 255 chars, leave room for extension)
    if (sanitized.length > 250) {
      const nameWithoutExt = sanitized.slice(0, sanitized.lastIndexOf('.csv'));
      return nameWithoutExt.slice(0, 246) + '.csv';
    }

    return sanitized;
  }
}

// Utility functions for data formatting
export const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'number') {
    // Handle currency formatting if needed
    return value.toString();
  }

  return String(value);
};

export const generateTimestamp = (): string => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const createFilename = (
  section: string, 
  context?: string, 
  timestamp?: string
): string => {
  const parts = [section];
  
  if (context) {
    parts.push(context);
  }
  
  parts.push(timestamp || generateTimestamp());
  
  return parts.join('-') + '.csv';
};

// Validation utilities
export const validateCSVData = (
  headers: string[], 
  data: string[][]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!headers || headers.length === 0) {
    errors.push('Headers are required');
  }

  if (!data || data.length === 0) {
    errors.push('Data is required');
  }

  if (headers && data) {
    // Check if all data rows have the same number of columns as headers
    const headerCount = headers.length;
    data.forEach((row, index) => {
      if (row.length !== headerCount) {
        errors.push(
          `Row ${index + 1} has ${row.length} columns, expected ${headerCount}`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Memory-efficient streaming CSV generation for large datasets
export class StreamingCSVGenerator {
  private buffer: string[] = [];
  private readonly bufferSize: number;

  constructor(bufferSize = 1000) {
    this.bufferSize = bufferSize;
  }

  async generateStreamingCSV<T>(
    data: T[],
    headers: string[],
    transform: (item: T) => string[],
    onChunk: (chunk: string) => void,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Add headers first
    const headerRow = headers.map(header => 
      CSVGenerator.escapeField(header)
    ).join(',');
    onChunk(headerRow + '\n');

    // Process data in chunks
    for (let i = 0; i < data.length; i += this.bufferSize) {
      const chunk = data.slice(i, i + this.bufferSize);
      const csvRows = chunk.map(item => {
        const row = transform(item);
        return row.map(field => CSVGenerator.escapeField(field)).join(',');
      });
      
      onChunk(csvRows.join('\n') + (i + this.bufferSize < data.length ? '\n' : ''));
      
      // Report progress
      if (onProgress) {
        const progress = Math.min(100, ((i + this.bufferSize) / data.length) * 100);
        onProgress(progress);
      }
      
      // Allow UI thread to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}
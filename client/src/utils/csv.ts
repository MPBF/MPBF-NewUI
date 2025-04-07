/**
 * Download data as CSV file
 * @param endpoint API endpoint to fetch data from
 * @param filename Name of the file to download (without extension)
 */
export const downloadCsv = async (endpoint: string, filename: string) => {
  try {
    const response = await fetch(endpoint, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error;
  }
};

/**
 * Upload CSV file
 * @param endpoint API endpoint to upload to
 * @param file File to upload
 */
export const uploadCsv = async (endpoint: string, file: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload CSV');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error uploading CSV:', error);
    throw error;
  }
};

/**
 * Parse CSV string into array of objects
 * @param csvString CSV string to parse
 * @param delimiter Column delimiter, default is comma
 * @returns Array of objects representing the CSV data
 */
export const parseCsv = (csvString: string, delimiter: string = ','): any[] => {
  const lines = csvString.split('\n');
  const headers = lines[0].split(delimiter);
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const data = line.split(delimiter);
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = data[index]?.trim() || '';
      return obj;
    }, {} as Record<string, string>);
  });
};

/**
 * Convert array of objects to CSV string
 * @param data Array of objects to convert
 * @param delimiter Column delimiter, default is comma
 * @returns CSV string
 */
export const objectsToCsv = (data: any[], delimiter: string = ','): string => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(delimiter);
  
  const rows = data.map(obj => 
    headers.map(header => {
      const cell = obj[header]?.toString() || '';
      // Escape quotes and wrap in quotes if the cell contains a delimiter, quote, or newline
      return cell.includes(delimiter) || cell.includes('"') || cell.includes('\n')
        ? `"${cell.replace(/"/g, '""')}"`
        : cell;
    }).join(delimiter)
  );
  
  return [headerRow, ...rows].join('\n');
};

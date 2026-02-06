/**
 * Format user role for display
 */
export const formatRole = (role) => {
  if (role === 'admin') return 'Administrator';
  return 'Employee';
};

/**
 * Truncate text to maxLength with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from a full name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Convert data array to CSV string for download
 */
export const arrayToCSV = (data, columns) => {
  if (!data || data.length === 0) return '';
  
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => 
    columns.map(c => {
      const val = row[c.key] || '';
      // Escape commas and quotes in CSV
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

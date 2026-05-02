/**
 * Converts user data array to CSV string.
 * @param {Array} data - Array of { user: string, data: { labels: [], userSteps: [] } }
 * @returns {string} CSV content
 */
export function convertToCSV(data) {
  const headers = ['User', 'Time (ms)', 'Movement Count'];
  const rows = [];
  data.forEach(user => {
    const { labels, userSteps } = user.data;
    labels.forEach((time, i) => {
      rows.push([user.user, time, userSteps[i]?.y ?? 0].join(','));
    });
  });
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers a file download in the browser.
 * @param {string} filename
 * @param {string} content
 */
export function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
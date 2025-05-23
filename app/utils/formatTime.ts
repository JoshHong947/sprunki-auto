export function formatTime(seconds: number): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  
  return `${pad(minutes)}:${pad(secs)}`;
} 
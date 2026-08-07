/**
 * セレクタの最終成功時刻を "3 minutes ago" のような相対表記にする。
 * now を引数に取るのはテストで時刻を固定できるようにするため。
 * 7 日以上前は絶対日付 (toLocaleDateString) に切り替える (旧実装踏襲)。
 */
export function formatRelativeTime(timestamp: number, now: number): string {
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  return new Date(timestamp).toLocaleDateString();
}

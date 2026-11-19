import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} empty={leaderboard.length === 0 ? 'No leaderboard scores yet.' : undefined}>
    {leaderboard.length > 0 && <ol>{leaderboard.map((entry) => <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} points</li>)}</ol>}
  </CapabilityCard>;
}

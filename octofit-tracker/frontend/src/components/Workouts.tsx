import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason?: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} empty={suggestions.length === 0 ? 'No workout suggestions yet.' : undefined}>
    {suggestions.length > 0 && <ul>{suggestions.map((workout, index) => <li key={index}><strong>{workout.title}</strong>{workout.reason ? ` - ${workout.reason}` : ''}</li>)}</ul>}
  </CapabilityCard>;
}

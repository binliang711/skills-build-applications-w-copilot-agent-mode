import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} empty={activities.length === 0 ? 'No activities yet.' : undefined}>
    {activities.length > 0 && <ul>{activities.map((activity, index) => <li key={index}>{activity.type} - {activity.minutes} minutes ({activity.points} points)</li>)}</ul>}
  </CapabilityCard>;
}

import { ConnectionsList } from '@/components/connections/connections-list';

export default function ConnectionsPage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Connections</h1>
      <ConnectionsList />
    </div>
  );
} 
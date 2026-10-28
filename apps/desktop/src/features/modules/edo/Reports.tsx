import { BarChart3 } from 'lucide-react';
import { Card, EmptyState } from '../../../components';
import { te } from './messages';

export function Reports() {
  return (
    <Card>
      <EmptyState icon={BarChart3} title={te('reports.title')} description={te('reports.text')} />
    </Card>
  );
}

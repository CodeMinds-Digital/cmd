import ProcessClient from './ProcessClient';
import { getProcessSteps } from '@/lib/cms/blocks';

export default async function Process() {
  const steps = await getProcessSteps();
  return <ProcessClient steps={steps} />;
}

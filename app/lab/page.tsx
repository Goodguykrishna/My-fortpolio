import type { Metadata } from 'next';
import Lab from '@/components/Lab';

export const metadata: Metadata = { title: 'Lab — Krishna Singh', description: 'Experiments: real-time WebGL, shaders and motion tests.' };

export default function Page() {
  return <Lab />;
}

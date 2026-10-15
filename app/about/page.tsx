import type { Metadata } from 'next';
import About from '@/components/About';

export const metadata: Metadata = { title: 'About — Krishna Singh', description: 'Video editor, photographer and full-stack developer in Surat, India.' };

export default function Page() {
  return <About />;
}

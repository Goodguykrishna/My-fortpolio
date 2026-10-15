import type { Metadata } from 'next';
import { PROJECTS } from '@/lib/projects';
import CaseStudy from '@/components/CaseStudy';

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECTS.find(x => x.slug === slug)!;
  return { title: `${p.title} — Krishna Singh`, description: p.line };
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  return <CaseStudy slug={slug} />;
}

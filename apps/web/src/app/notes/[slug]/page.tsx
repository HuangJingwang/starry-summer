import { permanentRedirect } from 'next/navigation';

export default async function NoteRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  permanentRedirect(`/posts/${slug}`);
}

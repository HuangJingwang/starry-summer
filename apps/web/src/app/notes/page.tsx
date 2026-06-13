import { permanentRedirect } from 'next/navigation';

export default function NotesRedirectPage() {
  permanentRedirect('/posts');
}

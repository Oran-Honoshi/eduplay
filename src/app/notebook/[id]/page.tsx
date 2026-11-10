import { redirect } from 'next/navigation'
// The first-version notebook sections were replaced by the explanation notebook.
export default function OldNotebookSection() {
  redirect('/notebook')
}

import { redirect } from 'next/navigation'
// The study booklet became Create's explanation pages.
export default function BookletPage() {
  redirect('/create?kind=explanation')
}

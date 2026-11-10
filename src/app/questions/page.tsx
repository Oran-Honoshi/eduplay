import { redirect } from 'next/navigation'
// The detailed question generator became part of Create.
export default function QuestionsPage() {
  redirect('/create')
}

import { redirect } from 'next/navigation'
// The worksheet builder became part of Create (ready sheets from the bank are
// in Create's quick start). Old links land in the right place.
export default function WorksheetsPage({ searchParams }: { searchParams: { view?: string } }) {
  redirect(searchParams.view === 'history' ? '/create?view=history' : '/create')
}

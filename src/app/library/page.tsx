'use client'
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import ParentPage, { chip, pillBtn } from '@/components/parent/ParentPage'
import LibrarySearch from '@/components/LibrarySearch'
import { PARENT_COLORS as C } from '@/lib/parentTheme'
import { useFamilyChildren, type FamilyChild } from '@/lib/useFamilyChildren'

// Parents' library of ready workbooks: search by tags (suggested as you type),
// subject, grade and type, then use one for a child in one tap.
export default function LibraryPage() {
  const { children } = useFamilyChildren()
  const [child, setChild] = useState<FamilyChild | null>(null)
  const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : ''
  useEffect(() => { if (!child && children.length) setChild(children[0]) }, [children, child])
  return (
    <ParentPage section="library" title="ספרייה מוכנה"
      subtitle="מאות חוברות תרגול מוכנות לכל נושא, מגן ועד כיתה ו׳, ועוד חוברות שהורים שיתפו. מחפשים, בוחרים — ומדפיסים או שולחים לילד. לא מצאתם? יוצרים אחת בדקה."
      actions={<a href="/create" style={pillBtn()}><Sparkles size={16} /> ליצור בעצמי</a>}>
      {children.length > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.textMuted }}>בשביל</span>
          {children.map(c => <button key={c.id} onClick={() => setChild(c)} style={chip(child?.id === c.id)}>{c.name}</button>)}
        </div>
      )}
      {child !== undefined && <LibrarySearch key={child?.id || 'none'} mode="parent" childId={child?.id} grade={child ? Math.min(child.grade, 12) : null} initialText={q} />}
    </ParentPage>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { CHILD_AVATAR_COLORS } from '@/lib/parentTheme'

export interface FamilyChild { id: string; name: string; grade: number; theme: string; color: string; accent: string }

// The logged-in family's children, from GET /api/family/children (session-
// scoped). Replaces child lists that used to be hard-coded in the worksheet
// builder and curriculum pages, which only worked for one dev family.
export function useFamilyChildren() {
  const [children, setChildren] = useState<FamilyChild[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    fetch('/api/family/children')
      .then(r => (r.ok ? r.json() : { children: [] }))
      .then(d => {
        setChildren((d.children || []).map((c: any, i: number) => {
          const color = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
          return { id: c.id, name: c.display_name, grade: c.grade ?? 0, theme: c.theme || 'plain', color, accent: color }
        }))
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])
  return { children, loaded }
}

export const EMPTY_CHILD: FamilyChild = { id: '', name: '', grade: 0, theme: 'plain', color: CHILD_AVATAR_COLORS[0], accent: CHILD_AVATAR_COLORS[0] }

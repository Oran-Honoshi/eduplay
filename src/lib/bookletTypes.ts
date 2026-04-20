export type Subject = 'math' | 'hebrew' | 'english'

export interface TopicMeta {
  topic_slug: string
  subject: Subject
  grade: number
  title_en: string
  title_he: string
}

export interface Visual {
  type: string
  description: string
  steps?: string[]
}

export interface Example {
  problem_en: string
  problem_he: string
  visual?: Visual
  solution_steps_en: string[]
  solution_steps_he: string[]
  answer_en: string
  answer_he: string
}

export interface TopicExplanation extends TopicMeta {
  summary_en: string
  summary_he: string
  key_points_en: string[]
  key_points_he: string[]
  main_visual: Visual
  examples: Example[]
}
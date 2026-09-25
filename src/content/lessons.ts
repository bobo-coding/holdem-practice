import type { LessonContent } from './types'
import { L0 } from './l0'
import { L1 } from './l1'
import { L2 } from './l2'
import { L3 } from './l3'
import { L4 } from './l4'
import { L5 } from './l5'
import { L6 } from './l6'
import { L7 } from './l7'

/**
 * 课程正文总表。按级分文件，课号与 docs/curriculum.md 对应。
 * 没有正文的课在目录里显示为「未上线」。
 */
export const LESSONS: Record<string, LessonContent> = {
  ...L0,
  ...L1,
  ...L2,
  ...L3,
  ...L4,
  ...L5,
  ...L6,
  ...L7,
}

export function hasContent(lessonId: string): boolean {
  return lessonId in LESSONS
}

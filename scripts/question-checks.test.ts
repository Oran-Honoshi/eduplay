// run: npx tsx scripts/question-checks.test.ts   (known failures from real questions must stay caught)
import { deterministicIssues } from '../src/lib/questionRules'
let bad = 0
const expect = (name: string, q: any, codes: string[]) => {
  const got = deterministicIssues(q).map(i => i.code).sort()
  const ok = JSON.stringify(got) === JSON.stringify([...codes].sort())
  if (!ok) { bad++; console.log('FAIL', name, 'expected', codes, 'got', got) } else console.log('ok  ', name)
}
const mc = (right: number, n = 4) => Array.from({ length: n }, (_, i) => ({ label: 'ABCD'[i], value_he: String(i + 1), isCorrect: i === right }))
const rect = { type: 'coordinate', steps: 10, points: [[2, 1, 'A'], [6, 1, 'B'], [6, 5, 'C'], [2, 5, 'D'], [4, 8, 'E']], polygon: [[2, 1], [6, 1], [6, 5], [2, 5]] }
expect('open triangle (flag question 1)', { prompt_he: 'במערכת הצירים מצויר מלבן ABCD ועליו משולש CDE. מהם שיעורי D?', options: mc(0), correct_answer: '1', visual_data: { ...rect, segments: [[[4, 8], [6, 5]]] } }, ['FIGURE_NOT_DRAWN'])
expect('closed triangle', { prompt_he: 'מלבן ABCD ועליו משולש CDE. מהם שיעורי D?', options: mc(0), correct_answer: '1', visual_data: { ...rect, segments: [[[2, 5], [4, 8]], [[4, 8], [6, 5]]] } }, [])
expect('three rays, two drawn', { prompt_he: 'יוצאות מנקודה O שלוש קרניים: OD, OE, OF.', options: mc(1), correct_answer: '2', visual_data: { type: 'angle', degrees: 60, letters: ['D', 'O', 'E'] } }, ['RAY_COUNT_MISMATCH', 'TEXT_NAMES_MISSING_POINT'])
expect('three rays, three drawn', { prompt_he: 'יוצאות מנקודה O שלוש קרניים: OD, OE, OF.', options: mc(1), correct_answer: '2', visual_data: { type: 'angle', vertex: 'O', rays: [{ deg: 0, letter: 'D' }, { deg: 60, letter: 'E' }, { deg: 115, letter: 'F' }] } }, [])
expect('wrong arithmetic', { prompt_he: 'כמה זה 7 × 5 = ?', options: [{ label: 'A', value_he: '30', isCorrect: true }, { label: 'B', value_he: '35' }], correct_answer: '30' }, ['ARITHMETIC_WRONG'])
expect('right arithmetic', { prompt_he: '12 ÷ 4 = ___', options: [{ label: 'A', value_he: '3', isCorrect: true }, { label: 'B', value_he: '4' }], correct_answer: '3' }, [])
expect('signed arithmetic', { prompt_he: '(+546) + (+100) = ☐', options: [{ label: 'A', value_he: '646', isCorrect: true }, { label: 'B', value_he: '446' }], correct_answer: '646' }, [])
expect('no correct option', { prompt_he: 'איזה מספר גדול?', options: mc(0).map(o => ({ ...o, isCorrect: false })), correct_answer: '1' }, ['NO_CORRECT'])
expect('two correct options', { prompt_he: 'איזה מספר?', options: mc(0).map(o => ({ ...o, isCorrect: true })), correct_answer: '1' }, ['MULTIPLE_CORRECT'])
expect('key does not match option', { prompt_he: 'איזה מספר?', options: mc(1), correct_answer: '9' }, ['ANSWER_KEY_MISMATCH'])
expect('fraction arithmetic', { prompt_he: '5/6 − 1/6 = ☐', options: [{ label: 'A', value_he: '4/6', isCorrect: true }, { label: 'B', value_he: '1/6' }], correct_answer: '4/6' }, [])
const klm = { prompt_he: 'משורטט משולש KLM, ובקשת מסומנת הזווית שקודקודה K. איזה מהסימונים הבאים אינו מתאים לזווית זו?', options: mc(0), correct_answer: '1' }
expect('triangle without letters or marked angle', { ...klm, visual_data: { type: 'triangle', sides: ['6', '5', '4'] } }, ['TEXT_NAMES_MISSING_POINT', 'ANGLE_MARK_MISSING'])
expect('triangle with letters and marked angle', { ...klm, visual_data: { type: 'triangle', sides: ['6', '5', '4'], vertices: ['K', 'L', 'M'], mark_angle: 'K' } }, [])
expect('dash as separator', { prompt_he: 'הנקודות הן: יום א׳ - 15 תלמידים, יום ב׳ - 25 תלמידים. באיזה יום?', options: mc(0), correct_answer: '1' }, ['DASH_AS_SEPARATOR'])
expect('dash minus is fine', { prompt_he: 'חשבו 20 - 5 = ☐', options: [{ label: 'A', value_he: '15', isCorrect: true }, { label: 'B', value_he: '10' }], correct_answer: '15' }, [])
expect('figure missing', { ...klm, visual_data: null, prompt_he: 'במשולש KLM מסומנת בקשת זווית אחת, ליד הקודקוד L. אילו סימונים מתאימים?' }, ['FIGURE_MISSING'])
expect('sign after number', { prompt_he: 'חשבו (-55)+(+20)', options: [{ label: 'A', value_he: '(-55)-(+20)=75-', value_en: '-55+20=-35 correct', isCorrect: true }, { label: 'B', value_he: '35', value_en: '35' }], correct_answer: '(-55)-(+20)=75-' }, ['SIGN_AFTER_NUMBER', 'ANSWER_LEAK'])
expect('sign in prompt', { prompt_he: 'חשבו: (4-) - (7-) = ?', options: [{ label: 'A', value_he: '3', isCorrect: true }, { label: 'B', value_he: '11' }], correct_answer: '3' }, ['SIGN_AFTER_NUMBER'])
process.exit(bad ? 1 : 0)

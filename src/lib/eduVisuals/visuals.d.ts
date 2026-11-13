// Types for questions.visual_data, as drawn by visuals.js
export type Subject = 'math' | 'hebrew' | 'english' | 'reading';
export type Q = number | '?' | null;              // '?' / null = unknown, drawn as an empty box
type Base = { alt?: string; subject?: Subject };
type Pt = { h: number; m: number };

export type VisualData = Base & (
  | { type: 'objects'; icon: string; count: number; crossed?: number; faded?: number; flying?: number; circled?: number; color2?: number; icon2?: string; branch?: boolean; target?: string }
  | { type: 'compare_groups'; a: { icon: string; count: number }; b: { icon: string; count: number }; labels?: string[] }
  | { type: 'ten_frame'; filled: number; frames?: 1 | 2; color2?: number; crossed?: number; icon?: string; icon2?: string }
  | { type: 'number_track' | 'hundred_chart'; from: number; to: number; highlight?: number[]; blank?: number[]; circled?: number[]; arrow?: { from: number; dir: 'down' | 'up' | 'left' | 'right' } }
  | { type: 'number_line'; min?: number; max?: number; step?: number; denominator?: number; fractionLabels?: boolean; marked?: number[]; mark?: number; circled?: number[]; blank?: number[]; segment?: [number, number]; jumps?: { from: number; size: number; count: number }; labels?: 'all' | 'ends' | 'none'; label?: string; lines?: Omit<Extract<VisualData, { type: 'number_line' }>, 'type' | 'lines'>[] }
  | { type: 'groups'; groups: number; each: number; icon: string; container?: string }
  | { type: 'plates'; count: number; icon?: string }
  | { type: 'share'; total: number; groups: number; icon: string; receiver?: string }
  | { type: 'array'; rows: number; cols: number; icon?: string; hideRows?: boolean }
  | { type: 'base_ten'; hundreds?: number; tens?: number; ones?: number; arriving?: { tens: number } }
  | { type: 'place_value'; hundreds?: Q; tens?: Q; ones?: Q; highlight?: 'hundreds' | 'tens' | 'ones'; hideDigits?: boolean; blocks?: boolean }
  | { type: 'bar_model'; parts?: Q[]; total?: Q; labels?: string[]; plusBetween?: boolean; rows?: { label: string; parts: Q[]; partLabels?: string[]; unknownSize?: number }[] }
  | { type: 'op_cards'; items: ({ icon: string; text: string | '?'; label?: string; crossed?: boolean } | string)[] }
  | { type: 'function_machine'; start: Q; ops: string[]; result: Q }
  | { type: 'money'; items: { value: 1 | 2 | 5 | 10 | 20 | 50 | 100 | 200; kind: 'coin' | 'note'; count: number }[]; price?: number }
  | { type: 'clock'; h?: number; m?: number; digital?: boolean; hideHands?: boolean }
  | { type: 'clock_span'; from?: Pt; to?: Pt; duration?: string }
  | { type: 'minutes_pie'; hours: number; minutes?: number }
  | { type: 'ruler'; unit: 'cm' | 'm'; length?: number; object?: string; start?: number; objectLength?: number }
  | { type: 'strips'; items: { label: string; cm: number }[] }
  | { type: 'graph' | 'bar_chart'; xlabels: string[]; values: Q[]; ylabel?: string; step?: number; colors?: string[] }
  | { type: 'pictograph'; key: number; keyIcon?: string; rows: { label: string; icon: string; count: number }[] }
  | { type: 'tally'; rows: { label?: string; count: number }[] }
  | { type: 'pattern_strip'; items: (string | number)[] }
  | { type: 'pairs'; count?: number; counts?: number[] }
  | { type: 'position_scene'; layout: 'row' | 'grid' | 'line'; items?: any[]; rows?: number; cols?: number; arrow?: boolean }
  | { type: 'symmetry'; shape: string; line?: 'vertical' | 'horizontal'; half?: boolean }
  | { type: 'triangle' | 'square' | 'rectangle' | 'circle' | 'pentagon' | 'hexagon' | 'parallelogram' | 'trapezoid' | 'equilateral' | 'shape'; shape?: string; highlight?: 'sides' | 'corners'; numbered?: boolean }
  | { type: 'shape_cards'; shapes: { shape?: string; icon?: string; label?: string | false; scale?: number }[] }
  | { type: 'squares_on_grid'; sizes: number[] }
  | { type: 'cube' | 'cuboid' | 'cylinder' | 'cone' | 'sphere' | 'pyramid' | 'net_cube'; real?: string }
  | { type: 'fraction'; n: number; d: number; shade?: boolean }
  | { type: 'fraction_pie'; n?: number; d?: number; label?: string; pies?: { n: number; d: number; label?: string }[]; shade?: boolean }
  | { type: 'fraction_compare'; a?: string | { n: number; d: number }; b?: string | { n: number; d: number }; bars?: (string | { n: number; d: number })[]; labels?: string[]; shade?: boolean }
  | { type: 'grid'; cols: number; rows: number; filled?: number }
  | { type: 'scale'; mode?: 'balance' | 'kitchen'; bags?: { label: string }[]; left?: string[]; right?: string[] }
  | { type: 'measuring_cup'; max: number; unit?: 'ml' | 'l'; marks?: number[]; level?: number }
  | { type: 'syllable_beats'; word: string; picture: string; beats: number; showBeats?: boolean }
  | { type: 'letter_card'; letter: string; picture?: string }
  | { type: 'picture_card'; icon: string }
  | { type: 'picture_cards'; icons: string[]; labels?: string[] }
  | { type: 'color_swatch'; color: string }
  | { type: 'steps'; items: (VisualData | string)[]; scale?: number }
);

export function renderVisual(data: VisualData, opts?: { subject?: Subject; mode?: 'color' | 'print'; maxWidth?: number; label?: string }): string;
export function iconSvg(name: string, size?: number, label?: string): string;
export const VISUAL_TYPES: string[];
export default renderVisual;

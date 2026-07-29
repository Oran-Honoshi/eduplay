// Investigation 5, Phase 1 (dry run): regenerates hint_en/hint_he/explanation_en
// for the 183 approved questions the Phase 0 LLM-judge pass classified as
// RESTATEMENT — an explanation that repeats the correct answer without showing
// the derivation/rule/textual evidence behind it. See project memory
// project_hint_he_gap.md's sibling investigation for the scoring writeup.
//
// This script is DRY RUN ONLY: it calls the LLM for a better hint/explanation
// per row and writes old-vs-new pairs to a review JSON file. It never writes
// to the questions table. A separate apply script (not yet written) will read
// the reviewed output and do the actual UPDATE once a human has spot-checked
// a sample of these pairs.
//
// Scope discipline: only hint_en, hint_he, explanation_en are regenerated.
// prompt_en/prompt_he/options/correct_answer/topic/difficulty are read-only
// context passed to the model, never touched — the question a child sees and
// answers is unchanged, so this content doesn't need to go back through
// Pending Review.
//
// The 7 rows where hint_en === explanation_en ("spoiler hints" — the hint
// fully solves the problem instead of nudging) are deliberately NOT in this
// list — see project_spoiler_hint_rows.md. Their explanations were judged
// fine; their defect is the hint, a separate small task. Do not add them here.
//
// Idempotent / safe to re-run: read-only against the DB, only ever appends/
// overwrites the local review file.
//
// Usage: set -a && source .env.local && set +a && node scripts/2026-07-29-regen-explanations-investigation5-dryrun.mjs [--limit=N]

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const REVIEW_FILE = new URL('../2026-07-29-investigation5-dryrun-review.json', import.meta.url)
const CONCURRENCY = 6

const limitArg = process.argv.find(a => a.startsWith('--limit='))
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : undefined

// ─── the exact 183-row target list from the Phase 0 judge pass ───
const TARGET_LIST = [
  { id: 'cbb6b084-af5e-4a49-afef-4208f711a9b7', category: 'bare_restatement', topic_slug: 'algebra_basics' },
  { id: '2f02c99b-c66e-4e42-974a-3db8543f59ed', category: 'bare_restatement', topic_slug: 'basic_fractions' },
  { id: '5967eb34-eb03-4c36-83f6-8f8c23e32256', category: 'bare_restatement', topic_slug: 'basic_fractions' },
  { id: '7757eb15-a9d9-492f-910d-51e04fd1d556', category: 'bare_restatement', topic_slug: 'basic_fractions' },
  { id: '90494d65-bd36-4dba-965d-20baa1ceffac', category: 'bare_restatement', topic_slug: 'basic_fractions' },
  { id: 'a4a00eaa-96fc-4839-9692-c1c61a0a7859', category: 'bare_restatement', topic_slug: 'basic_fractions' },
  { id: 'f04185ce-510c-4da6-b6c4-9383289b4681', category: 'bare_restatement', topic_slug: 'basic_fractions' },
  { id: '90596474-4069-4822-b504-c9ed85965e15', category: 'bare_restatement', topic_slug: 'decimal_fractions' },
  { id: 'c74d748b-3830-4b48-a6ba-5539c1931fea', category: 'bare_restatement', topic_slug: 'decimal_fractions' },
  { id: '1d922ad7-75d6-440d-8472-2979c044605f', category: 'bare_restatement', topic_slug: 'fraction_division' },
  { id: '9ba21ab9-8584-422f-be4b-c518df9e5e83', category: 'bare_restatement', topic_slug: 'fraction_multiplication' },
  { id: '05adeaae-26e1-45a3-9e6b-252c3741b14a', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '07fbc62b-3f77-499f-adc5-6d96ac3007f3', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '1415358a-9c09-4045-93bb-48210c4a6291', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '30497b4b-d505-47d8-aace-ef45e4c26105', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '31cf3981-78ee-4698-b7d1-1b8e58bf105a', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '3451ef27-8eda-4683-b825-b8fae8db3319', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '3983b1d4-aac1-4dd7-8e63-afaff5d0d87f', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '664d908f-2f91-4c71-8058-b5b9ac534e8a', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '859f88fe-d32f-40e9-9a46-019458821ea8', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '9d9abaa0-11c5-4f0d-b1e8-c8cb0c0d3ce7', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: 'b10ca689-ff75-498c-862b-4a461ac09a1c', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: 'b689ccf8-c89f-4910-84ef-b9cd12c7d32c', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: 'ba75710c-530a-4721-8bcf-3e2eb06466b6', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: 'ce384235-6738-49e7-b1db-1b4f6a41645b', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: 'f1d4234b-ef91-460a-aba1-30a247bcdf0e', category: 'bare_restatement', topic_slug: 'future_tense_g3' },
  { id: '26feed7f-a31c-46eb-b064-85bd34f5e4c1', category: 'bare_restatement', topic_slug: 'grammar_g3' },
  { id: '5aa9fe4a-caae-448e-943c-f25beb8fc5f8', category: 'bare_restatement', topic_slug: 'grammar_g3' },
  { id: '8dcb1631-5761-4c32-98f9-e6fa7c96bc31', category: 'bare_restatement', topic_slug: 'grammar_g3' },
  { id: 'b0859953-c979-44ed-9a94-3d9dfd6e5f41', category: 'bare_restatement', topic_slug: 'grammar_g3' },
  { id: 'c8172a59-28ad-47b0-9598-a09317909231', category: 'bare_restatement', topic_slug: 'grammar_g3' },
  { id: 'e61b7642-abbd-48a9-a7e9-bb031aed78cb', category: 'bare_restatement', topic_slug: 'grammar_g3' },
  { id: 'f9e40114-c81e-4ed9-9f73-41647d001649', category: 'bare_restatement', topic_slug: 'grammar_g3' },
  { id: 'fea80707-01ac-4a6a-b2a4-9db56057b394', category: 'bare_restatement', topic_slug: 'grammar_g3' },
  { id: '16221fb8-77e2-4742-b30b-c7d250abec1a', category: 'bare_restatement', topic_slug: 'numbers_to_10000' },
  { id: 'ce7194f2-7739-4ac8-b62d-b558ed3a016d', category: 'bare_restatement', topic_slug: 'numbers_to_10000' },
  { id: '06b5b562-af9a-42a0-9b8b-e952b017304e', category: 'bare_restatement', topic_slug: 'perimeter_area_g3' },
  { id: '14cb4d5e-0cab-491e-8f1c-96ef35c8c858', category: 'bare_restatement', topic_slug: 'perimeter_area_g3' },
  { id: '3659c632-51f9-46f3-b1fe-4ee01895e2bc', category: 'bare_restatement', topic_slug: 'perimeter_area_g3' },
  { id: '9f49e8a0-a8d1-48d4-bb50-f12dde6f2ff4', category: 'bare_restatement', topic_slug: 'perimeter_area_g3' },
  { id: '1b8f6a19-aa35-4106-bb1c-dbf96e225931', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_advanced' },
  { id: '26399e23-744f-4473-94c3-18330c73ce19', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_advanced' },
  { id: '464e7cb1-dd45-4659-b43f-e9e25f9c9904', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_advanced' },
  { id: '4cc166c6-2c75-44bc-9360-c0e56c2141f0', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_advanced' },
  { id: '4f3ced7d-2061-4f64-a070-0c5614c3bcce', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_advanced' },
  { id: 'bdee1014-68a7-4876-bc37-1d6004ac1b91', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_advanced' },
  { id: 'd1bbe59e-995c-4c2a-b9bf-9bb232c54888', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_advanced' },
  { id: 'e762ee5e-49d0-4143-bba0-711dd29b48db', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_advanced' },
  { id: '19807414-a9b7-44bc-af17-75188433f2cd', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: '21723fff-f683-4a62-b1a3-f47ae3080f24', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: '30e031dc-2da3-4302-938d-bdd78a15128a', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: '3dce39b1-b0b0-4075-873d-6cd56479d393', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: '760ef77d-4a5a-4ce9-aa9d-8bff88f7d40b', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: '97001cd9-702d-4e49-8111-57547872323a', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: '9fa8ecaa-e6a6-4d14-9a6f-a1ff337fef7e', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: 'a2288884-5d34-422c-8f65-1977dd5b75e3', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: 'a9eb2dec-82be-492f-938c-f45fdc887a05', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: 'b7fb8314-8443-4218-9426-f24c8fc01b2f', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: 'c90addc8-641f-4e57-8a51-1f362fba2eca', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: 'cd171166-f16d-4dbb-8a0c-6f422d8e2447', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: 'd64e3cad-1ffe-4423-b63f-a45a70164cf6', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: 'f249af41-4b46-41b8-a412-49890e33bf51', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: 'fb604460-a0a4-4194-9d67-4af18f7f1f7c', category: 'hebrew_grammar_conjugation', topic_slug: 'binyan_paal' },
  { id: '31aaf269-433b-49ad-8abb-2b2066698767', category: 'hebrew_grammar_conjugation', topic_slug: 'dikduk_4' },
  { id: '64808f1f-c7e2-440a-a820-d162de17b9a5', category: 'hebrew_grammar_conjugation', topic_slug: 'dikduk_4' },
  { id: '6bb653c3-bb53-424e-b5d8-3a1c7938998b', category: 'hebrew_grammar_conjugation', topic_slug: 'dikduk_4' },
  { id: '8588e9b5-2b1d-4ebb-a7e5-ca81c9d86f9f', category: 'hebrew_grammar_conjugation', topic_slug: 'dikduk_4' },
  { id: 'c340f141-764f-4e8c-a84a-693651d5aab1', category: 'hebrew_grammar_conjugation', topic_slug: 'dikduk_4' },
  { id: '9898bd45-3a8f-496e-9f92-7b1de8fdf61f', category: 'hebrew_grammar_conjugation', topic_slug: 'dikduk_4' },
  { id: 'f1d7a363-8af0-401d-8005-30a3d4fd8549', category: 'hebrew_grammar_conjugation', topic_slug: 'dikduk_4' },
  { id: '0e79cf21-f0e0-404c-b91c-9f4e20ec3547', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '12e5463b-e67f-4ee4-b8fd-3a8040808eae', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '150a3ea9-47c6-4576-a309-cb7c273b95cb', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '21c473e1-742e-45e2-adc9-dd57de230423', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '2c125348-e2c5-4f10-8ee4-5e5d6f9abcb5', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '2fec4f8d-5046-44b7-8eef-b78ae01a7a3c', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '44b96a31-487c-4483-a659-abc9b41576ef', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '50e37ad7-cf66-4913-89e2-b54a60a5e750', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '535b397b-0856-4400-979a-5120b6e0696f', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '708f411a-db04-484f-86ce-69cd5eca04b9', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: 'a1723faf-4745-4ea0-80de-549dc87fa70c', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: 'a294769e-c28f-4799-993b-7a4fee244636', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: 'c7ddc525-de03-4591-bfd1-e921f8a0e1ca', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: 'cc97c37a-be7b-464b-97be-cd3b4492b116', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: 'f009d71d-339f-4069-bbeb-8130f2bfb437', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: 'fc67fc17-e843-4291-80f2-a7a65091be2f', category: 'hebrew_grammar_conjugation', topic_slug: 'grammar_g3' },
  { id: '0906af23-22f0-41c7-a053-497a94c50f78', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '1676fd8c-b97c-4d38-9129-d6cc690c0f7f', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '1d6ea0e6-cf90-46ea-8a8f-1763deadfc9f', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '1ddcfdb1-ae77-4b1f-8cff-e33cd460c3d0', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '1f05659f-7cb7-4713-84dd-9d5e55c00a8c', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '36957f2b-ce11-449b-a41d-28f5b918ebb3', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '3cea8a81-dedf-420b-9b8e-68135fe87321', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '4fd0e330-ea74-4f16-afe8-de0d1835bc64', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '52169b63-05e9-4aba-8584-18580501fac8', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '5fe4d331-8595-4592-808f-8ebc2b2f9037', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '693a2685-ed60-4d0b-9b53-404789dee9e2', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '6c2db724-3cd5-45ab-8cad-0cae9815a70c', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '743d2ff2-823e-4a34-8094-8896dbfdc28c', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '7cf17ca9-5eee-451e-b27c-ced177302a85', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '820c205a-e700-4073-adb6-a142c008fe67', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '87fe664e-2802-4e48-b625-7302210ed497', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '919ea4f5-654f-4795-8197-706e5bc146f2', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'a1cc5406-5fb4-4093-8ba0-80bd4424db9d', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'a5a274f0-245e-4844-acba-b7955d76daba', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'c6bac355-351d-4aea-8539-067fc8a34430', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'ca007c06-b973-4d39-a120-870539e53240', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'd05a7c45-f576-4616-89c4-76d65afd6894', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'd87cdcfa-96ff-4193-8598-04e27fee168a', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'db17999c-c4d4-4015-a727-e9042ed60010', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'f420112e-bd24-4b9e-bebe-be431582a580', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: 'fc57d10b-c0bc-4879-95db-d72f97ab0e11', category: 'hebrew_grammar_conjugation', topic_slug: 'nouns_verbs_g2' },
  { id: '0c7ebe8f-ec22-478a-835d-584a013a2e7e', category: 'reading_comprehension', topic_slug: 'advanced_reading' },
  { id: '3be99123-b9a2-4156-b0ab-1cbda399fe99', category: 'reading_comprehension', topic_slug: 'advanced_reading' },
  { id: '5368b74d-d283-4fe6-85a1-a2ca7098f7bc', category: 'reading_comprehension', topic_slug: 'advanced_reading' },
  { id: '6aeec0e7-aa2b-4641-9768-475cce1bc7d6', category: 'reading_comprehension', topic_slug: 'advanced_reading' },
  { id: 'af41470f-8e61-47c4-997a-23a200a6ef82', category: 'reading_comprehension', topic_slug: 'advanced_reading' },
  { id: 'f52878b8-1996-49fa-b9eb-8488a5e6152d', category: 'reading_comprehension', topic_slug: 'advanced_reading' },
  { id: '25856638-1c68-4d99-a222-2ed8f2207149', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: '47fd2741-617d-4fb9-953a-a84f42b00d64', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: '5d058696-ec45-49ac-8ea3-55a8958a9184', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: '61b778e3-cf77-486a-93da-6732fcea640e', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: '732414c3-b5bf-4e8e-a2a2-0ead0778b04b', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: '7f62f733-707d-4da5-a98d-84b7c5a7a482', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: 'bea8a34e-0545-4a91-9163-223bbe72461c', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: 'cdac503b-fc2b-42d0-be7b-dec6470320ae', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: 'e181b98a-192e-4702-a0b9-6b7024cb62ff', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: 'e90373d0-2084-48fb-93f3-96923c9358dd', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: 'f60521f2-ddc3-4f7b-98d4-c2e053de4ce9', category: 'reading_comprehension', topic_slug: 'kriya_6' },
  { id: '215c8f88-e29d-4cb6-bba9-518f30c39675', category: 'reading_comprehension', topic_slug: 'reading_acquisition' },
  { id: '435ae429-449d-470c-8a7a-406188bd1341', category: 'reading_comprehension', topic_slug: 'reading_acquisition' },
  { id: 'cf847bc6-4a67-4057-841c-3897d5f13e58', category: 'reading_comprehension', topic_slug: 'reading_acquisition' },
  { id: 'd4dacc4b-e9c3-4304-985c-12e362fcd190', category: 'reading_comprehension', topic_slug: 'reading_acquisition' },
  { id: 'd4e5a823-7be3-404e-86e2-5a075b6fdfcf', category: 'reading_comprehension', topic_slug: 'reading_acquisition' },
  { id: 'dab2e244-b43d-4cac-abdb-4aca03eccc13', category: 'reading_comprehension', topic_slug: 'reading_acquisition' },
  { id: 'e9723883-5401-4f7e-8003-4d4b6706cc4a', category: 'reading_comprehension', topic_slug: 'reading_acquisition' },
  { id: 'ebf99f37-7bfa-4c1b-bae9-aec82ea80f3b', category: 'reading_comprehension', topic_slug: 'reading_acquisition' },
  { id: '1e415018-1eca-4d7a-a389-f0928a8908d3', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: '2801b967-027c-4b4b-9e8f-0dc2f7980540', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: '4117b6a9-541f-4f43-8298-ce425b447c1e', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: '47dd7260-ece3-4b17-b6d3-2cb005a56846', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: '5a449c16-da38-40bc-bb00-01e247ee30e8', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: '911cfc30-789d-47d8-904e-9bca00d7b4f4', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: '93f6e564-466e-494c-a797-14398a5e3358', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: 'ca4f0f00-57d9-4fa8-b1a0-514d0ca980e6', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: 'd66d6706-310a-48d0-977d-28e3e76bd9d6', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: 'f977e795-7c9c-425f-b890-16148f469352', category: 'reading_comprehension', topic_slug: 'reading_comprehension_paragraphs' },
  { id: '00317556-144d-438a-9a86-8fa8361d55cf', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '0ca66185-232f-42e1-8182-09cfb2b9250a', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '0d08c09d-94e0-401b-a068-cd17514bb330', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '14ab5925-342c-4503-abcd-497aacfd6e9e', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '42a80b4f-3b7e-4024-b2b6-64807251d262', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '44bb38ad-dbe9-4d8e-9201-37e936351d3c', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '48c5ba41-a4a5-487f-8cec-04e1cb5b98b8', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '5b3a7e74-1f14-4da4-acb6-66ad93f73f2d', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '62d7a74b-850a-4245-8792-df2a5792027c', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '765eeb22-fe29-460a-ab85-7224bdec5ed1', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '77978b37-5788-4d80-9a4a-0174e6635a42', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '81f7c6f9-1174-40fb-8419-bbb08c5326c0', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: 'cbbe8016-da3c-4125-bd78-31d27b5f5e65', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: 'e2e3838c-ad35-4926-8511-c9816e6e2dd2', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: 'ff9546a7-fd75-43f1-a06d-2798a723767c', category: 'reading_comprehension', topic_slug: 'reading_fluency_g2' },
  { id: '0ea917e9-a5d3-4281-a17c-f6fab50e7bc2', category: 'reading_comprehension', topic_slug: 'reading_sentences_g1' },
  { id: '51df6565-49d6-45c0-b0d6-4935ff4623ed', category: 'reading_comprehension', topic_slug: 'reading_sentences_g1' },
  { id: '89d45160-bb48-480e-a04a-ef60adb9ca87', category: 'reading_comprehension', topic_slug: 'reading_sentences_g1' },
  { id: 'af4ff2f5-94c1-44b8-afec-481b6d8bbcad', category: 'reading_comprehension', topic_slug: 'reading_sentences_g1' },
  { id: 'b3c272ec-4f95-499c-98ee-d9fb86a22fa9', category: 'reading_comprehension', topic_slug: 'reading_sentences_g1' },
  { id: 'cb2e3385-2f70-4018-9048-52482fe63efa', category: 'reading_comprehension', topic_slug: 'reading_sentences_g1' },
  { id: '4d45e763-d577-417b-aaaf-4d86b94b0a87', category: 'reading_comprehension', topic_slug: 'reading_stories_g2' },
  { id: '61aa3e35-6ab5-4934-8384-9cbc249646fe', category: 'reading_comprehension', topic_slug: 'reading_stories_g2' },
  { id: '6417217a-395a-46e8-ab05-9ac0169d78a5', category: 'reading_comprehension', topic_slug: 'reading_stories_g2' },
  { id: '66536842-2750-48b2-afa3-bb06e5239033', category: 'reading_comprehension', topic_slug: 'reading_stories_g2' },
  { id: '72b4fdcd-77a8-4b6b-96eb-6a7e177dba10', category: 'reading_comprehension', topic_slug: 'reading_stories_g2' },
  { id: '7ac4b644-123a-4a15-aa34-82d0936fd6cf', category: 'reading_comprehension', topic_slug: 'reading_stories_g2' },
  { id: 'afb0542f-4849-4a69-8eae-6f8b079ec33d', category: 'reading_comprehension', topic_slug: 'reading_stories_g2' },
  { id: '45722792-cdaa-4658-99c4-f1ca1e1165aa', category: 'reading_comprehension', topic_slug: 'sfrut_6' },
  { id: '57433184-1369-4493-8c6b-988bdb4c7f61', category: 'reading_comprehension', topic_slug: 'sfrut_6' },
  { id: '5a84d0c0-0d8f-4aec-9b42-26d7d9252909', category: 'reading_comprehension', topic_slug: 'sfrut_6' },
  { id: 'cb88f75b-e1e0-4aac-844e-a475ad682559', category: 'reading_comprehension', topic_slug: 'sfrut_6' },
  { id: 'd0690a90-dd1d-4d4e-89be-e5202864b4ab', category: 'reading_comprehension', topic_slug: 'sfrut_6' },
  { id: 'd09d17a5-1b4f-4644-8ca1-ccbcce8c7db2', category: 'reading_comprehension', topic_slug: 'sfrut_6' },
  { id: 'daca5d1f-8796-4a66-9a17-2f02dfea6a44', category: 'reading_comprehension', topic_slug: 'sfrut_6' },
  { id: 'f2d51a85-163b-4d08-9003-c616836b4c9a', category: 'reading_comprehension', topic_slug: 'sfrut_6' },
]

if (new Set(TARGET_LIST.map(r => r.id)).size !== TARGET_LIST.length) {
  throw new Error('duplicate id in TARGET_LIST — aborting before spending API calls')
}

const SYSTEM_PROMPT = `You are rewriting the hint and explanation for an existing, already-approved K-6 practice question for Israeli students. The question itself (prompt, options, correct answer, topic, difficulty) is FINAL and must never be changed or contradicted — you are only replacing hint_en, hint_he, and explanation_en.

The current explanation was flagged by a quality audit as a bare RESTATEMENT: it repeats the correct answer without showing why it's correct. Your job is to write a replacement that actually teaches the reasoning:

- explanation_en must show the real derivation, grammatical rule, or textual evidence that makes the answer correct — substituted numbers for a math calculation, the specific morphological rule applied to THIS word (not a generic definition of the grammar term), or textual evidence/reasoning tied to THIS specific question/passage for reading comprehension. Brevity is fine — a one-line calculation or a rule-plus-example is enough, as long as a student could follow *why* the answer is correct from reading it. Do not just restate the answer. Do not write a generic dictionary-style definition disconnected from this specific item.
- hint_en must nudge toward the method WITHOUT fully solving it — name the operation, rule, or what to look for, but do not execute the calculation or state the final answer. The hint must always be strictly weaker than the explanation.
- hint_he: only include it if the question currently HAS a non-null Hebrew hint (you'll be told). If so, write a natural Hebrew hint with the same nudge-not-solve property — not a literal word-for-word translation, but equivalent in what it reveals. If the current hint_he is null, leave your hint_he null too — do not introduce Hebrew content that wasn't there before, that's a separate tracked gap.
- Never change what correct answer the explanation supports. If you're unsure of the underlying rule, infer it correctly from the prompt/correct_answer/options given — do not invent an incorrect justification.

Output ONLY a JSON object: {"hint_en": "..." | null, "hint_he": "..." | null, "explanation_en": "..."}`

function buildUserPrompt(row) {
  const optionsText = Array.isArray(row.options)
    ? row.options.map(o => `  ${o.label}: ${[o.value_en, o.value_he].filter(Boolean).join(' / ')}${o.isCorrect ? '  <-- correct' : ''}`).join('\n')
    : null

  const extraContext = [
    row.binyan ? `binyan: ${row.binyan}` : null,
    row.verb_root ? `verb_root: ${row.verb_root}` : null,
    row.nikud_text ? `nikud_text: ${row.nikud_text}` : null,
  ].filter(Boolean).join('\n')

  return `Topic: ${row.topic_title} (${row.subject}, grade ${row.grade})
Question type: ${row.q_type}
prompt_en: ${row.prompt_en}
${row.prompt_he ? `prompt_he: ${row.prompt_he}` : ''}
${optionsText ? `options:\n${optionsText}` : ''}
correct_answer: ${row.correct_answer}
${extraContext}

Current hint_en (may be weak, may be fine — you decide): ${row.hint_en ?? '(none)'}
Current hint_he: ${row.hint_he ?? '(null — leave your hint_he null too)'}
Current explanation_en (flagged as bare restatement): ${row.explanation_en}

Write the replacement hint_en, hint_he, and explanation_en now.`
}

// Occasionally the model emits a literal unescaped quote inside a Hebrew
// string (e.g. quoting a word), which breaks a naive JSON.parse — transient,
// not systemic. Retry a couple of times before giving up on the row.
const MAX_ATTEMPTS = 3

async function callClaude(row) {
  let lastErr
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        thinking: { type: 'disabled' },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(row) }],
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      lastErr = new Error(data.error?.message || 'Anthropic API request failed')
      continue
    }
    const text = data.content?.[0]?.text ?? ''
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

async function processRow(target) {
  const { data: q, error } = await supabase
    .from('questions')
    .select(`
      id, q_type, difficulty, prompt_en, prompt_he, options, correct_answer,
      hint_en, hint_he, explanation_en, binyan, verb_root, nikud_text,
      topics ( title_en, grade, subjects ( label_en ) )
    `)
    .eq('id', target.id)
    .single()

  if (error || !q) return { ...target, ok: false, error: error?.message || 'row not found' }

  const row = {
    ...q,
    topic_title: q.topics?.title_en,
    grade: q.topics?.grade,
    subject: q.topics?.subjects?.label_en,
  }

  try {
    const generated = await callClaude(row)
    return {
      id: target.id,
      category: target.category,
      topic_slug: target.topic_slug,
      ok: true,
      prompt_en: q.prompt_en,
      correct_answer: q.correct_answer,
      old: { hint_en: q.hint_en, hint_he: q.hint_he, explanation_en: q.explanation_en },
      new: generated,
    }
  } catch (err) {
    return { id: target.id, category: target.category, topic_slug: target.topic_slug, ok: false, error: err.message }
  }
}

const worklist = LIMIT ? TARGET_LIST.slice(0, LIMIT) : TARGET_LIST
console.log(`Processing ${worklist.length} rows (concurrency ${CONCURRENCY})...`)

const results = []
for (let i = 0; i < worklist.length; i += CONCURRENCY) {
  const batch = worklist.slice(i, i + CONCURRENCY)
  const batchResults = await Promise.all(batch.map(processRow))
  results.push(...batchResults)
  console.log(`  ${Math.min(i + CONCURRENCY, worklist.length)}/${worklist.length}`)
}

const succeeded = results.filter(r => r.ok)
const failed = results.filter(r => !r.ok)

fs.writeFileSync(REVIEW_FILE, JSON.stringify(results, null, 2))

console.log(`\nDone. ${succeeded.length} generated, ${failed.length} failed.`)
if (failed.length) {
  console.log('Failures:')
  for (const f of failed) console.log(`  ${f.id} (${f.topic_slug}): ${f.error}`)
}
console.log(`Review file written to ${REVIEW_FILE.pathname}`)
console.log('This script did NOT write to the database. Review the pairs, then run the (separate) apply script.')

// ─────────────────────────────────────────────────────────────
// StoreCatalog.ts — item definitions, rarity system, catalog
// ─────────────────────────────────────────────────────────────

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; glow: string }> = {
  common:    { label: 'Common',    color: '#9CA3AF', glow: 'rgba(156,163,175,0.3)' },
  rare:      { label: 'Rare',      color: '#3B82F6', glow: 'rgba(59,130,246,0.4)'  },
  epic:      { label: 'Epic',      color: '#8B5CF6', glow: 'rgba(139,92,246,0.45)' },
  legendary: { label: 'Legendary', color: '#F59E0B', glow: 'rgba(245,158,11,0.5)'  },
}

// ── AVATAR CATALOG ───────────────────────────────────────────

export type AvatarCategory =
  | 'skin' | 'hair' | 'top' | 'bottom' | 'dress'
  | 'jacket' | 'shoes' | 'hat' | 'glasses'
  | 'backpack' | 'handheld'

export interface AvatarItem {
  id:          string
  category:    AvatarCategory
  name:        string
  nameHe:      string
  xpCost:      number
  rarity:      Rarity
  color:       string        // primary color for preview swatch
  colors?:     string[]      // available color variants
  emoji:       string        // fallback icon
  description: string
}

export const AVATAR_ITEMS: AvatarItem[] = [
  // ── SKIN TONES ──
  { id:'skin_light',    category:'skin',     name:'Light',         nameHe:'בהיר',       xpCost:0,   rarity:'common',    color:'#FDDBB4', emoji:'🧑', description:'Light skin tone' },
  { id:'skin_medium',   category:'skin',     name:'Medium',        nameHe:'בינוני',     xpCost:0,   rarity:'common',    color:'#D4956A', emoji:'🧑', description:'Medium skin tone' },
  { id:'skin_tan',      category:'skin',     name:'Tan',           nameHe:'שזוף',       xpCost:0,   rarity:'common',    color:'#C27A47', emoji:'🧑', description:'Tan skin tone' },
  { id:'skin_dark',     category:'skin',     name:'Dark',          nameHe:'כהה',        xpCost:0,   rarity:'common',    color:'#8B5A2B', emoji:'🧑', description:'Dark skin tone' },
  { id:'skin_deep',     category:'skin',     name:'Deep',          nameHe:'עמוק',       xpCost:0,   rarity:'common',    color:'#4A2C0A', emoji:'🧑', description:'Deep skin tone' },

  // ── HAIR ──
  { id:'hair_short_black',  category:'hair', name:'Short Black',   nameHe:'קצר שחור',  xpCost:0,   rarity:'common',    color:'#1A1A1A', emoji:'💇', description:'Classic short black hair' },
  { id:'hair_short_brown',  category:'hair', name:'Short Brown',   nameHe:'קצר חום',   xpCost:0,   rarity:'common',    color:'#6B3A2A', emoji:'💇', description:'Short brown hair' },
  { id:'hair_curly_black',  category:'hair', name:'Curly Black',   nameHe:'מתולתל שחור',xpCost:25, rarity:'common',    color:'#1A1A1A', emoji:'💇', description:'Natural curly black hair' },
  { id:'hair_long_brown',   category:'hair', name:'Long Brown',    nameHe:'ארוך חום',   xpCost:25,  rarity:'common',    color:'#6B3A2A', emoji:'💇', description:'Long flowing brown hair' },
  { id:'hair_long_blonde',  category:'hair', name:'Long Blonde',   nameHe:'ארוך בלונד', xpCost:50,  rarity:'rare',      color:'#F0C040', emoji:'💇', description:'Long golden blonde hair' },
  { id:'hair_afro',         category:'hair', name:'Afro',          nameHe:'אפרו',       xpCost:50,  rarity:'rare',      color:'#2A1A0A', emoji:'💇', description:'Full natural afro' },
  { id:'hair_braids',       category:'hair', name:'Braids',        nameHe:'קליעות',     xpCost:75,  rarity:'rare',      color:'#3A2010', emoji:'💇', description:'Long decorative braids' },
  { id:'hair_pink',         category:'hair', name:'Pink Dye',      nameHe:'צבוע ורוד',  xpCost:150, rarity:'epic',      color:'#FF69B4', emoji:'💇', description:'Bold pink dyed hair' },
  { id:'hair_rainbow',      category:'hair', name:'Rainbow',       nameHe:'קשת בענן',   xpCost:300, rarity:'legendary', color:'#FF0080', emoji:'💇', description:'Magical rainbow hair' },

  // ── TOPS ──
  { id:'top_white_tee',     category:'top',  name:'White Tee',     nameHe:'חולצה לבנה', xpCost:0,   rarity:'common',    color:'#F9FAFB', emoji:'👕', description:'Simple white t-shirt' },
  { id:'top_blue_tee',      category:'top',  name:'Blue Tee',      nameHe:'חולצה כחולה',xpCost:0,   rarity:'common',    color:'#3B82F6', emoji:'👕', description:'Casual blue t-shirt' },
  { id:'top_striped',       category:'top',  name:'Striped Shirt', nameHe:'חולצת פסים', xpCost:50,  rarity:'common',    color:'#6366F1', emoji:'👕', description:'Classic horizontal stripes' },
  { id:'top_jersey_red',    category:'top',  name:'Sports Jersey', nameHe:'חולצת ספורט',xpCost:75,  rarity:'rare',      color:'#EF4444', emoji:'👕', description:'Athletic sports jersey #7' },
  { id:'top_hoodie_gray',   category:'top',  name:'Gray Hoodie',   nameHe:'סווטשירט אפור',xpCost:100,rarity:'rare',     color:'#6B7280', emoji:'👕', description:'Cozy gray hoodie' },
  { id:'top_hoodie_black',  category:'top',  name:'Black Hoodie',  nameHe:'סווטשירט שחור',xpCost:100,rarity:'rare',    color:'#1F2937', emoji:'👕', description:'Sleek black hoodie' },
  { id:'top_knight_armor',  category:'top',  name:'Knight Armor',  nameHe:'שריון אביר', xpCost:250, rarity:'epic',      color:'#9CA3AF', emoji:'🛡️', description:'Shining medieval armor' },
  { id:'top_space_suit',    category:'top',  name:'Space Suit',    nameHe:'חליפת חלל',  xpCost:300, rarity:'epic',      color:'#E5E7EB', emoji:'🚀', description:'NASA-style space suit' },
  { id:'top_wizard_robe',   category:'top',  name:'Wizard Robe',   nameHe:'גלימת קוסם',  xpCost:350, rarity:'legendary', color:'#7C3AED', emoji:'🧙', description:'Enchanted wizard robe' },

  // ── BOTTOMS ──
  { id:'bottom_jeans',      category:'bottom',name:'Blue Jeans',   nameHe:'ג׳ינס כחול', xpCost:0,   rarity:'common',    color:'#1D4ED8', emoji:'👖', description:'Classic blue denim jeans' },
  { id:'bottom_black_pants',category:'bottom',name:'Black Pants',  nameHe:'מכנסיים שחורים',xpCost:0, rarity:'common',   color:'#111827', emoji:'👖', description:'Smart black trousers' },
  { id:'bottom_shorts_red', category:'bottom',name:'Red Shorts',   nameHe:'מכנסי ספורט אדום',xpCost:25,rarity:'common', color:'#DC2626', emoji:'🩳', description:'Athletic red shorts' },
  { id:'bottom_cargo',      category:'bottom',name:'Cargo Pants',  nameHe:'מכנסי קארגו',xpCost:75,  rarity:'rare',      color:'#4B5563', emoji:'👖', description:'Utility cargo pants' },
  { id:'bottom_joggers',    category:'bottom',name:'Joggers',      nameHe:'ג׳וגרים',    xpCost:75,  rarity:'rare',      color:'#374151', emoji:'👖', description:'Comfortable jogger pants' },
  { id:'bottom_armor_legs', category:'bottom',name:'Armor Legs',   nameHe:'שריון רגליים',xpCost:200, rarity:'epic',      color:'#9CA3AF', emoji:'⚔️', description:'Medieval armored greaves' },

  // ── SHOES ──
  { id:'shoes_white_sneakers',category:'shoes',name:'White Sneakers',nameHe:'סניקרס לבן',xpCost:0,  rarity:'common',   color:'#F9FAFB', emoji:'👟', description:'Clean white sneakers' },
  { id:'shoes_black_sneakers',category:'shoes',name:'Black Sneakers',nameHe:'סניקרס שחור',xpCost:25, rarity:'common',  color:'#111827', emoji:'👟', description:'Sleek black sneakers' },
  { id:'shoes_red_boots',     category:'shoes',name:'Red Boots',    nameHe:'מגפיים אדומים',xpCost:100,rarity:'rare',   color:'#DC2626', emoji:'👢', description:'Bold red ankle boots' },
  { id:'shoes_space_boots',   category:'shoes',name:'Space Boots',  nameHe:'מגפי חלל',   xpCost:200, rarity:'epic',    color:'#6B7280', emoji:'🥾', description:'Pressurized space boots' },
  { id:'shoes_golden',        category:'shoes',name:'Golden Kicks', nameHe:'נעליים זהובות',xpCost:400,rarity:'legendary',color:'#F59E0B',emoji:'👟', description:'Legendary golden sneakers' },

  // ── HATS ──
  { id:'hat_cap_black',    category:'hat',    name:'Black Cap',     nameHe:'כובע שחור',  xpCost:50,  rarity:'common',    color:'#111827', emoji:'🧢', description:'Classic snapback cap' },
  { id:'hat_beanie',       category:'hat',    name:'Beanie',        nameHe:'כובע גרב',   xpCost:50,  rarity:'common',    color:'#4B5563', emoji:'🧢', description:'Warm knit beanie' },
  { id:'hat_wizard',       category:'hat',    name:'Wizard Hat',    nameHe:'כובע קוסם',  xpCost:200, rarity:'epic',      color:'#7C3AED', emoji:'🎩', description:'Tall magical wizard hat' },
  { id:'hat_knight_helm',  category:'hat',    name:'Knight Helmet', nameHe:'קסדת אביר',  xpCost:250, rarity:'epic',      color:'#9CA3AF', emoji:'⛑️', description:'Shining knight helmet' },
  { id:'hat_astronaut',    category:'hat',    name:'Astronaut Helm',nameHe:'קסדת אסטרונאוט',xpCost:300,rarity:'epic',  color:'#E5E7EB', emoji:'🪖', description:'Sealed astronaut helmet' },
  { id:'hat_crown',        category:'hat',    name:'Royal Crown',   nameHe:'כתר מלכותי', xpCost:500, rarity:'legendary', color:'#F59E0B', emoji:'👑', description:'Legendary golden crown' },

  // ── GLASSES ──
  { id:'glasses_round',    category:'glasses',name:'Round Glasses', nameHe:'משקפיים עגולות',xpCost:75, rarity:'common',  color:'#1F2937', emoji:'👓', description:'Classic round frames' },
  { id:'glasses_cool',     category:'glasses',name:'Cool Shades',   nameHe:'משקפי שמש',  xpCost:100, rarity:'rare',      color:'#111827', emoji:'🕶️', description:'Stylish sunglasses' },
  { id:'glasses_visor',    category:'glasses',name:'Space Visor',   nameHe:'ויזור חלל',  xpCost:250, rarity:'epic',      color:'#3B82F6', emoji:'🥽', description:'Futuristic space visor' },

  // ── BACKPACKS ──
  { id:'bag_blue',         category:'backpack',name:'Blue Backpack',nameHe:'תיק כחול',   xpCost:75,  rarity:'common',    color:'#2563EB', emoji:'🎒', description:'Everyday blue backpack' },
  { id:'bag_space',        category:'backpack',name:'Jetpack',      nameHe:'ג׳טפאק',     xpCost:350, rarity:'epic',      color:'#6B7280', emoji:'🚀', description:'Rocket-powered jetpack' },
  { id:'bag_wizard',       category:'backpack',name:'Spell Satchel',nameHe:'שק קסמים',   xpCost:200, rarity:'rare',      color:'#7C3AED', emoji:'👜', description:'Enchanted spell satchel' },

  // ── HANDHELD ──
  { id:'hand_book',        category:'handheld',name:'Magic Book',   nameHe:'ספר קסמים',  xpCost:100, rarity:'rare',      color:'#7C3AED', emoji:'📖', description:'Glowing spell book' },
  { id:'hand_sword',       category:'handheld',name:'Knight Sword', nameHe:'חרב אביר',   xpCost:200, rarity:'epic',      color:'#9CA3AF', emoji:'⚔️', description:'Legendary knight sword' },
  { id:'hand_wand',        category:'handheld',name:'Magic Wand',   nameHe:'שרביט קסם',  xpCost:150, rarity:'rare',      color:'#F59E0B', emoji:'🪄', description:'Sparkling magic wand' },
  { id:'hand_mic',         category:'handheld',name:'Microphone',   nameHe:'מיקרופון',   xpCost:100, rarity:'common',    color:'#111827', emoji:'🎤', description:'Performer microphone' },
  { id:'hand_guitar',      category:'handheld',name:'Guitar',       nameHe:'גיטרה',      xpCost:200, rarity:'rare',      color:'#92400E', emoji:'🎸', description:'Electric guitar' },
  { id:'hand_laser',       category:'handheld',name:'Laser Gun',    nameHe:'אקדח לייזר', xpCost:300, rarity:'epic',      color:'#06B6D4', emoji:'🔫', description:'Futuristic laser pistol' },
]

export const AVATAR_CATEGORIES: { id: AvatarCategory; label: string; labelHe: string; emoji: string }[] = [
  { id:'skin',     label:'Skin',      labelHe:'גוון עור',  emoji:'🧑' },
  { id:'hair',     label:'Hair',      labelHe:'שיער',      emoji:'💇' },
  { id:'top',      label:'Top',       labelHe:'חלק עליון', emoji:'👕' },
  { id:'bottom',   label:'Bottom',    labelHe:'חלק תחתון', emoji:'👖' },
  { id:'shoes',    label:'Shoes',     labelHe:'נעליים',    emoji:'👟' },
  { id:'hat',      label:'Hat',       labelHe:'כובע',      emoji:'🧢' },
  { id:'glasses',  label:'Glasses',   labelHe:'משקפיים',   emoji:'👓' },
  { id:'backpack', label:'Backpack',  labelHe:'תיק',       emoji:'🎒' },
  { id:'handheld', label:'Handheld',  labelHe:'ביד',       emoji:'⚔️' },
  { id:'jacket',   label:'Jacket',    labelHe:'ג׳קט',      emoji:'🧥' },
  { id:'dress',    label:'Dress',     labelHe:'שמלה',      emoji:'👗' },
]

// ── PARK CATALOG ─────────────────────────────────────────────

export type ParkCategory = 'rides' | 'food' | 'shops' | 'nature' | 'paths' | 'decor'

export interface ParkItem {
  id:           string
  slug:         string
  category:     ParkCategory
  name:         string
  nameHe:       string
  description:  string
  xpCost:       number
  rarity:       Rarity
  visitors:     number
  funScore:     number
  w:            number   // width in tiles
  h:            number   // height in tiles
  color:        string   // isometric fill color
  roofColor:    string   // isometric roof/top color
  emoji:        string   // fallback
  shadowColor:  string
}

export const PARK_ITEMS: ParkItem[] = [
  // ── PATHS ──
  { id:'path_grass',     slug:'path_grass',     category:'paths', name:'Grass Tile',    nameHe:'דשא',           description:'Green grass ground',          xpCost:0,   rarity:'common',    visitors:0, funScore:0,  w:1, h:1, color:'#4ADE80', roofColor:'#22C55E', emoji:'🟩', shadowColor:'#166534' },
  { id:'path_stone',     slug:'path_stone',     category:'paths', name:'Stone Path',    nameHe:'שביל אבן',      description:'Paved stone walkway',         xpCost:10,  rarity:'common',    visitors:5, funScore:1,  w:1, h:1, color:'#D1D5DB', roofColor:'#9CA3AF', emoji:'⬜', shadowColor:'#4B5563' },
  { id:'path_brick',     slug:'path_brick',     category:'paths', name:'Brick Path',    nameHe:'שביל לבנים',    description:'Classic red brick path',      xpCost:20,  rarity:'common',    visitors:5, funScore:2,  w:1, h:1, color:'#EF4444', roofColor:'#DC2626', emoji:'🟥', shadowColor:'#991B1B' },
  { id:'path_cobble',    slug:'path_cobble',    category:'paths', name:'Cobblestone',   nameHe:'אבני ריצוף',    description:'Medieval cobblestone',        xpCost:30,  rarity:'rare',      visitors:5, funScore:3,  w:1, h:1, color:'#6B7280', roofColor:'#4B5563', emoji:'⬛', shadowColor:'#1F2937' },

  // ── NATURE ──
  { id:'tree_oak',       slug:'tree_oak',       category:'nature',name:'Oak Tree',      nameHe:'עץ אלון',       description:'Tall shady oak tree',         xpCost:20,  rarity:'common',    visitors:2, funScore:3,  w:1, h:1, color:'#16A34A', roofColor:'#15803D', emoji:'🌳', shadowColor:'#14532D' },
  { id:'tree_palm',      slug:'tree_palm',      category:'nature',name:'Palm Tree',     nameHe:'עץ דקל',        description:'Tropical palm tree',          xpCost:35,  rarity:'common',    visitors:3, funScore:4,  w:1, h:1, color:'#84CC16', roofColor:'#65A30D', emoji:'🌴', shadowColor:'#3F6212' },
  { id:'flower_bed',     slug:'flower_bed',     category:'nature',name:'Flower Bed',    nameHe:'ערוגת פרחים',   description:'Colorful flower garden',      xpCost:15,  rarity:'common',    visitors:2, funScore:3,  w:1, h:1, color:'#EC4899', roofColor:'#DB2777', emoji:'🌸', shadowColor:'#9D174D' },
  { id:'fountain',       slug:'fountain',       category:'nature',name:'Fountain',      nameHe:'מזרקה',         description:'Beautiful water fountain',    xpCost:80,  rarity:'rare',      visitors:15,funScore:12, w:2, h:2, color:'#38BDF8', roofColor:'#0EA5E9', emoji:'⛲', shadowColor:'#0369A1' },
  { id:'pond',           slug:'pond',           category:'nature',name:'Duck Pond',     nameHe:'אגם',           description:'Peaceful duck pond',          xpCost:120, rarity:'rare',      visitors:20,funScore:15, w:3, h:2, color:'#3B82F6', roofColor:'#2563EB', emoji:'🦆', shadowColor:'#1D4ED8' },

  // ── DECOR ──
  { id:'bench',          slug:'bench',          category:'decor', name:'Park Bench',    nameHe:'ספסל',          description:'Wooden park bench',           xpCost:15,  rarity:'common',    visitors:3, funScore:2,  w:1, h:1, color:'#92400E', roofColor:'#78350F', emoji:'🪑', shadowColor:'#451A03' },
  { id:'lamp_post',      slug:'lamp_post',      category:'decor', name:'Lamp Post',     nameHe:'פנס',           description:'Classic iron lamp post',      xpCost:20,  rarity:'common',    visitors:2, funScore:3,  w:1, h:1, color:'#374151', roofColor:'#F59E0B', emoji:'💡', shadowColor:'#111827' },
  { id:'balloon_stand',  slug:'balloon_stand',  category:'decor', name:'Balloon Stand', nameHe:'דוכן בלונים',   description:'Colorful balloon vendor',     xpCost:30,  rarity:'common',    visitors:8, funScore:6,  w:1, h:1, color:'#A78BFA', roofColor:'#7C3AED', emoji:'🎈', shadowColor:'#4C1D95' },
  { id:'clock_tower',    slug:'clock_tower',    category:'decor', name:'Clock Tower',   nameHe:'מגדל שעון',     description:'Landmark clock tower',        xpCost:300, rarity:'epic',      visitors:30,funScore:25, w:2, h:2, color:'#D97706', roofColor:'#92400E', emoji:'🕰️', shadowColor:'#451A03' },

  // ── FOOD ──
  { id:'ice_cream',      slug:'ice_cream',      category:'food',  name:'Ice Cream Cart',nameHe:'עגלת גלידה',    description:'Classic ice cream cart',      xpCost:40,  rarity:'common',    visitors:20,funScore:15, w:1, h:1, color:'#FDE68A', roofColor:'#FBBF24', emoji:'🍦', shadowColor:'#92400E' },
  { id:'hot_dog',        slug:'hot_dog',        category:'food',  name:'Hot Dog Stand', nameHe:'דוכן נקניקיות', description:'Sizzling hot dog stand',      xpCost:50,  rarity:'common',    visitors:25,funScore:16, w:1, h:1, color:'#EF4444', roofColor:'#B91C1C', emoji:'🌭', shadowColor:'#7F1D1D' },
  { id:'food_court',     slug:'food_court',     category:'food',  name:'Food Court',    nameHe:'פינת אוכל',     description:'Multi-vendor food area',      xpCost:120, rarity:'rare',      visitors:50,funScore:35, w:2, h:2, color:'#F97316', roofColor:'#EA580C', emoji:'🍔', shadowColor:'#7C2D12' },
  { id:'candy_shop',     slug:'candy_shop',     category:'food',  name:'Candy Shop',    nameHe:'חנות ממתקים',   description:'Sweet candy store',           xpCost:150, rarity:'rare',      visitors:40,funScore:30, w:2, h:1, color:'#F472B6', roofColor:'#EC4899', emoji:'🍬', shadowColor:'#9D174D' },

  // ── SHOPS ──
  { id:'gift_shop',      slug:'gift_shop',      category:'shops', name:'Gift Shop',     nameHe:'חנות מתנות',    description:'Souvenirs and gifts',         xpCost:80,  rarity:'common',    visitors:25,funScore:18, w:1, h:1, color:'#8B5CF6', roofColor:'#7C3AED', emoji:'🎁', shadowColor:'#4C1D95' },
  { id:'photo_booth',    slug:'photo_booth',    category:'shops', name:'Photo Booth',   nameHe:'תא צילום',      description:'Fun photo memories',          xpCost:100, rarity:'rare',      visitors:30,funScore:22, w:1, h:1, color:'#06B6D4', roofColor:'#0891B2', emoji:'📸', shadowColor:'#164E63' },
  { id:'arcade',         slug:'arcade',         category:'shops', name:'Arcade',        nameHe:'ארקייד',        description:'Retro game arcade',           xpCost:200, rarity:'rare',      visitors:55,funScore:45, w:2, h:2, color:'#7C3AED', roofColor:'#5B21B6', emoji:'🕹️', shadowColor:'#2E1065' },

  // ── RIDES ──
  { id:'carousel',       slug:'carousel',       category:'rides', name:'Carousel',      nameHe:'קרוסלה',        description:'Classic spinning carousel',   xpCost:60,  rarity:'common',    visitors:30,funScore:25, w:2, h:2, color:'#F472B6', roofColor:'#EC4899', emoji:'🎠', shadowColor:'#9D174D' },
  { id:'ferris_wheel',   slug:'ferris_wheel',   category:'rides', name:'Ferris Wheel',  nameHe:'גלגל ענק',      description:'Towering ferris wheel',       xpCost:150, rarity:'rare',      visitors:60,funScore:50, w:2, h:3, color:'#60A5FA', roofColor:'#2563EB', emoji:'🎡', shadowColor:'#1E40AF' },
  { id:'bumper_cars',    slug:'bumper_cars',    category:'rides', name:'Bumper Cars',   nameHe:'מכוניות הלם',   description:'Electric bumper car arena',   xpCost:180, rarity:'rare',      visitors:45,funScore:42, w:3, h:2, color:'#FB923C', roofColor:'#EA580C', emoji:'🚗', shadowColor:'#7C2D12' },
  { id:'roller_coaster', slug:'roller_coaster', category:'rides', name:'Roller Coaster',nameHe:'רכבת הרים',     description:'Thrilling roller coaster!',   xpCost:350, rarity:'epic',      visitors:80,funScore:90, w:4, h:3, color:'#EF4444', roofColor:'#B91C1C', emoji:'🎢', shadowColor:'#7F1D1D' },
  { id:'water_slide',    slug:'water_slide',    category:'rides', name:'Water Slide',   nameHe:'מגלשת מים',     description:'Splashing water slide!',      xpCost:280, rarity:'epic',      visitors:70,funScore:75, w:3, h:3, color:'#38BDF8', roofColor:'#0EA5E9', emoji:'💦', shadowColor:'#075985' },
  { id:'haunted_house',  slug:'haunted_house',  category:'rides', name:'Haunted House', nameHe:'בית רדוף',      description:'Spooky haunted mansion!',     xpCost:300, rarity:'epic',      visitors:65,funScore:80, w:3, h:3, color:'#1F2937', roofColor:'#111827', emoji:'👻', shadowColor:'#030712' },
  { id:'drop_tower',     slug:'drop_tower',     category:'rides', name:'Drop Tower',    nameHe:'מגדל נפילה',    description:'Terrifying free-fall tower!', xpCost:400, rarity:'legendary', visitors:90,funScore:95, w:2, h:4, color:'#F59E0B', roofColor:'#D97706', emoji:'🗼', shadowColor:'#78350F' },
]

export const PARK_CATEGORIES: { id: ParkCategory; label: string; labelHe: string; emoji: string }[] = [
  { id:'rides',  label:'Rides',   labelHe:'אטרקציות', emoji:'🎢' },
  { id:'food',   label:'Food',    labelHe:'אוכל',     emoji:'🍔' },
  { id:'shops',  label:'Shops',   labelHe:'חנויות',   emoji:'🛍️' },
  { id:'nature', label:'Nature',  labelHe:'טבע',      emoji:'🌳' },
  { id:'paths',  label:'Paths',   labelHe:'שבילים',   emoji:'🟫' },
  { id:'decor',  label:'Decor',   labelHe:'עיצוב',    emoji:'💡' },
]

// ── HELPER FUNCTIONS ─────────────────────────────────────────

export function getItemsByCategory<T extends AvatarItem | ParkItem>(
  items: T[],
  category: string
): T[] {
  return items.filter(i => i.category === category)
}

export function getRarityStyle(rarity: Rarity) {
  return RARITY_CONFIG[rarity]
}

export function canAfford(xp: number, cost: number): boolean {
  return xp >= cost
}
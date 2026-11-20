module.exports = function createPeriodicElements() {
  // Compact Periodic Table dataset: [atomicNumber, symbol, enName, zhName, period, group, category]
  // Categories: nonmetal, noble, alkali, alkaline, metalloid, halogen, transition, post, lanthanide, actinide
  const RAW_ELEMENTS = [
    [1,'H','Hydrogen','氢',1,1,'nonmetal'],
    [2,'He','Helium','氦',1,18,'noble'],
    [3,'Li','Lithium','锂',2,1,'alkali'],
    [4,'Be','Beryllium','铍',2,2,'alkaline'],
    [5,'B','Boron','硼',2,13,'metalloid'],
    [6,'C','Carbon','碳',2,14,'nonmetal'],
    [7,'N','Nitrogen','氮',2,15,'nonmetal'],
    [8,'O','Oxygen','氧',2,16,'nonmetal'],
    [9,'F','Fluorine','氟',2,17,'halogen'],
    [10,'Ne','Neon','氖',2,18,'noble'],
    [11,'Na','Sodium','钠',3,1,'alkali'],
    [12,'Mg','Magnesium','镁',3,2,'alkaline'],
    [13,'Al','Aluminum','铝',3,13,'post'],
    [14,'Si','Silicon','硅',3,14,'metalloid'],
    [15,'P','Phosphorus','磷',3,15,'nonmetal'],
    [16,'S','Sulfur','硫',3,16,'nonmetal'],
    [17,'Cl','Chlorine','氯',3,17,'halogen'],
    [18,'Ar','Argon','氩',3,18,'noble'],
    [19,'K','Potassium','钾',4,1,'alkali'],
    [20,'Ca','Calcium','钙',4,2,'alkaline'],
    [21,'Sc','Scandium','钪',4,3,'transition'],
    [22,'Ti','Titanium','钛',4,4,'transition'],
    [23,'V','Vanadium','钒',4,5,'transition'],
    [24,'Cr','Chromium','铬',4,6,'transition'],
    [25,'Mn','Manganese','锰',4,7,'transition'],
    [26,'Fe','Iron','铁',4,8,'transition'],
    [27,'Co','Cobalt','钴',4,9,'transition'],
    [28,'Ni','Nickel','镍',4,10,'transition'],
    [29,'Cu','Copper','铜',4,11,'transition'],
    [30,'Zn','Zinc','锌',4,12,'transition'],
    [31,'Ga','Gallium','镓',4,13,'post'],
    [32,'Ge','Germanium','锗',4,14,'metalloid'],
    [33,'As','Arsenic','砷',4,15,'metalloid'],
    [34,'Se','Selenium','硒',4,16,'nonmetal'],
    [35,'Br','Bromine','溴',4,17,'halogen'],
    [36,'Kr','Krypton','氪',4,18,'noble'],
    [37,'Rb','Rubidium','铷',5,1,'alkali'],
    [38,'Sr','Strontium','锶',5,2,'alkaline'],
    [39,'Y','Yttrium','钇',5,3,'transition'],
    [40,'Zr','Zirconium','锆',5,4,'transition'],
    [41,'Nb','Niobium','铌',5,5,'transition'],
    [42,'Mo','Molybdenum','钼',5,6,'transition'],
    [43,'Tc','Technetium','锝',5,7,'transition'],
    [44,'Ru','Ruthenium','钌',5,8,'transition'],
    [45,'Rh','Rhodium','铑',5,9,'transition'],
    [46,'Pd','Palladium','钯',5,10,'transition'],
    [47,'Ag','Silver','银',5,11,'transition'],
    [48,'Cd','Cadmium','镉',5,12,'transition'],
    [49,'In','Indium','铟',5,13,'post'],
    [50,'Sn','Tin','锡',5,14,'post'],
    [51,'Sb','Antimony','锑',5,15,'metalloid'],
    [52,'Te','Tellurium','碲',5,16,'metalloid'],
    [53,'I','Iodine','碘',5,17,'halogen'],
    [54,'Xe','Xenon','氙',5,18,'noble'],
    [55,'Cs','Cesium','铯',6,1,'alkali'],
    [56,'Ba','Barium','钡',6,2,'alkaline'],
    [57,'La','Lanthanum','镧',9,3,'lanthanide'],
    [58,'Ce','Cerium','铈',9,4,'lanthanide'],
    [59,'Pr','Praseodymium','镨',9,5,'lanthanide'],
    [60,'Nd','Neodymium','钕',9,6,'lanthanide'],
    [61,'Pm','Promethium','钷',9,7,'lanthanide'],
    [62,'Sm','Samarium','钐',9,8,'lanthanide'],
    [63,'Eu','Europium','铕',9,9,'lanthanide'],
    [64,'Gd','Gadolinium','钆',9,10,'lanthanide'],
    [65,'Tb','Terbium','铽',9,11,'lanthanide'],
    [66,'Dy','Dysprosium','镝',9,12,'lanthanide'],
    [67,'Ho','Holmium','钬',9,13,'lanthanide'],
    [68,'Er','Erbium','铒',9,14,'lanthanide'],
    [69,'Tm','Thulium','铥',9,15,'lanthanide'],
    [70,'Yb','Ytterbium','镱',9,16,'lanthanide'],
    [71,'Lu','Lutetium','镥',9,17,'lanthanide'],
    [72,'Hf','Hafnium','铪',6,4,'transition'],
    [73,'Ta','Tantalum','钽',6,5,'transition'],
    [74,'W','Tungsten','钨',6,6,'transition'],
    [75,'Re','Rhenium','铼',6,7,'transition'],
    [76,'Os','Osmium','锇',6,8,'transition'],
    [77,'Ir','Iridium','铱',6,9,'transition'],
    [78,'Pt','Platinum','铂',6,10,'transition'],
    [79,'Au','Gold','金',6,11,'transition'],
    [80,'Hg','Mercury','汞',6,12,'transition'],
    [81,'Tl','Thallium','铊',6,13,'post'],
    [82,'Pb','Lead','铅',6,14,'post'],
    [83,'Bi','Bismuth','铋',6,15,'post'],
    [84,'Po','Polonium','钋',6,16,'post'],
    [85,'At','Astatine','砹',6,17,'halogen'],
    [86,'Rn','Radon','氡',6,18,'noble'],
    [87,'Fr','Francium','钫',7,1,'alkali'],
    [88,'Ra','Radium','镭',7,2,'alkaline'],
    [89,'Ac','Actinium','锕',10,3,'actinide'],
    [90,'Th','Thorium','钍',10,4,'actinide'],
    [91,'Pa','Protactinium','镤',10,5,'actinide'],
    [92,'U','Uranium','铀',10,6,'actinide'],
    [93,'Np','Neptunium','镎',10,7,'actinide'],
    [94,'Pu','Plutonium','钚',10,8,'actinide'],
    [95,'Am','Americium','镅',10,9,'actinide'],
    [96,'Cm','Curium','锔',10,10,'actinide'],
    [97,'Bk','Berkelium','锫',10,11,'actinide'],
    [98,'Cf','Californium','锎',10,12,'actinide'],
    [99,'Es','Einsteinium','锿',10,13,'actinide'],
    [100,'Fm','Fermium','镄',10,14,'actinide'],
    [101,'Md','Mendelevium','钔',10,15,'actinide'],
    [102,'No','Nobelium','锘',10,16,'actinide'],
    [103,'Lr','Lawrencium','铹',10,17,'actinide'],
    [104,'Rf','Rutherfordium','𬬻',7,4,'transition'],
    [105,'Db','Dubnium','𬭊',7,5,'transition'],
    [106,'Sg','Seaborgium','𬭳',7,6,'transition'],
    [107,'Bh','Bohrium','𬭛',7,7,'transition'],
    [108,'Hs','Hassium','𬭶',7,8,'transition'],
    [109,'Mt','Meitnerium','鿏',7,9,'transition'],
    [110,'Ds','Darmstadtium','𫟼',7,10,'transition'],
    [111,'Rg','Roentgenium','𬬭',7,11,'transition'],
    [112,'Cn','Copernicium','鿔',7,12,'transition'],
    [113,'Nh','Nihonium','鿭',7,13,'post'],
    [114,'Fl','Flerovium','𫓧',7,14,'post'],
    [115,'Mc','Moscovium','镆',7,15,'post'],
    [116,'Lv','Livermorium','𫟷',7,16,'post'],
    [117,'Ts','Tennessine','鿬',7,17,'halogen'],
    [118,'Og','Oganesson','鿫',7,18,'noble'],
  ];

  const ELEMENTS = RAW_ELEMENTS.map(([number, symbol, name, zh, period, group, category]) => ({
    number, symbol, name, zh, period, group, category,
  }));

  const BY_NUMBER = new Map(ELEMENTS.map(e => [e.number, e]));
  const BY_NAME = new Map();
  for (const el of ELEMENTS) {
    BY_NAME.set(el.name.toLowerCase(), el);
    BY_NAME.set(el.zh, el);
  }
  // British spelling alias
  BY_NAME.set('aluminium', BY_NUMBER.get(13));
  BY_NAME.set('caesium', BY_NUMBER.get(55));
  BY_NAME.set('sulphur', BY_NUMBER.get(16));

  // Known Google Gemini 4 Periodic Table model positioning & notes
  const GEMINI_ELEMENT_META = {
    1: {
      tier: 'Speed',
      zhTag: '极速轻量',
      enTag: 'Fast & Efficient',
      zhDesc: 'Gemini 4 Hydrogen — 最轻最快的日常主力模型，低延迟高性价比，适合高频编码与轻量代理任务。',
      enDesc: 'Gemini 4 Hydrogen — Lightweight high-velocity workhorse optimized for speed and efficiency.',
      accent: '#38BDF8',
    },
    6: {
      tier: 'Flagship',
      zhTag: '旗舰全能',
      enTag: 'Frontier All-Rounder',
      zhDesc: 'Gemini 4 Carbon — 旗舰级全能模型，擅长长程智能体任务、复杂架构决策、深度编码与数据分析。',
      enDesc: 'Gemini 4 Carbon — Frontier all-rounder built for long-horizon agentic tasks and complex coding.',
      accent: '#A78BFA',
    },
    8: {
      tier: 'Specialist',
      zhTag: '实验代号',
      enTag: 'Staging Element',
      zhDesc: 'Gemini 4 Oxygen — 元素周期表扩展系列成员，面向特定智能体与推理工作流。',
      enDesc: 'Gemini 4 Oxygen — Expanding periodic table element for specialized agentic workloads.',
      accent: '#34D399',
    },
    10: {
      tier: 'Balanced',
      zhTag: '均衡主力',
      enTag: 'Balanced Workhorse',
      zhDesc: 'Gemini 4 Neon — 兼具前沿推理深度与流畅响应速度的均衡主力模型，适合绝大多数开发与分析任务。',
      enDesc: 'Gemini 4 Neon — Balanced high-performance workhorse pairing frontier reasoning with fast response.',
      accent: '#60A5FA',
    },
    18: {
      tier: 'Reasoning',
      zhTag: '深度推理',
      enTag: 'Deep Reasoning',
      zhDesc: 'Gemini 4 Argon — 深度推理前沿模型，擅长复杂算法、跨文件重构与高难度逻辑推演。',
      enDesc: 'Gemini 4 Argon — Deep-reasoning frontier model tailored for complex algorithms and refactoring.',
      accent: '#F472B6',
    },
    36: {
      tier: 'Specialist',
      zhTag: '扩展元素',
      enTag: 'Extended Element',
      zhDesc: 'Gemini 4 Krypton — 元素周期表高阶稀有气体系列模型。',
      enDesc: 'Gemini 4 Krypton — Noble gas series model in the Gemini 4 periodic family.',
      accent: '#FBBF24',
    },
  };

  const EFFORT_ORDER = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'extra', 'max'];
  const EFFORT_LABELS = {
    none: { en: 'Off', zh: '关闭' },
    minimal: { en: 'Minimal', zh: '极简' },
    low: { en: 'Low', zh: '低' },
    medium: { en: 'Medium', zh: '中' },
    high: { en: 'High', zh: '高' },
    xhigh: { en: 'XHigh', zh: '极高' },
    extra: { en: 'Extra', zh: '极高' },
    max: { en: 'Max', zh: '最高' },
  };

  const NON_GOOGLE_PATTERN = /\b(claude|anthropic|opus|sonnet|haiku|gpt|openai|o1|o3|o4|codex|deepseek|llama|mistral|qwen|grok)\b/i;
  const GOOGLE_PATTERN = /\b(gemini|gemma|google|learnlm|imagen|veo)\b/i;

  function cleanLabel(text) {
    return String(text || '').replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function isGoogleModel(label) {
    const clean = cleanLabel(label);
    if (!clean) return false;
    if (NON_GOOGLE_PATTERN.test(clean)) return false;
    if (GOOGLE_PATTERN.test(clean)) return true;
    return false;
  }

  function extractEffort(label) {
    const clean = cleanLabel(label);
    const m = clean.match(/\((Minimal|Min|Low|Medium|Med|High|XHigh|Extra\s*High|Extra|Max|极简|低|中|高|极高|超高|最高)\)/i)
      || clean.match(/(?:^|\s)(Minimal|Low|Medium|High|XHigh|Extra\s*High|Extra|Max|极简|低|中|高|极高|超高|最高)(?:\s+(?:新|NEW|BETA|默认|DEFAULT))?\s*$/i);
    if (!m) return null;
    const raw = m[1].toLowerCase().replace(/\s+/g, '');
    const alias = {
      'min': 'minimal', 'med': 'medium', 'extrahigh': 'xhigh',
      '极简': 'minimal', '低': 'low', '中': 'medium', '高': 'high',
      '极高': 'xhigh', '超高': 'xhigh', '最高': 'max',
    };
    return alias[raw] || raw;
  }

  function matchElement(label) {
    const clean = cleanLabel(label);
    if (!isGoogleModel(clean)) return null;
    // Match full English element names as whole words (longest first to avoid partial matches)
    const words = clean.toLowerCase().match(/[a-z]+/g) || [];
    for (const w of words) {
      if (w.length < 3) continue; // Avoid short non-element words; full element names are >= 3 chars (tin, ion not element)
      const hit = BY_NAME.get(w);
      if (hit) return hit;
    }
    return null;
  }

  function parseModelInfo(label) {
    const clean = cleanLabel(label);
    const google = isGoogleModel(clean);
    const element = google ? matchElement(clean) : null;
    const effort = extractEffort(clean);
    const meta = element ? (GEMINI_ELEMENT_META[element.number] || null) : null;
    return {
      label: clean,
      isGoogle: google,
      element,
      effort,
      effortRank: effort ? EFFORT_ORDER.indexOf(effort) : -1,
      meta,
    };
  }

  return {
    ELEMENTS,
    BY_NUMBER,
    BY_NAME,
    GEMINI_ELEMENT_META,
    EFFORT_ORDER,
    EFFORT_LABELS,
    cleanLabel,
    isGoogleModel,
    extractEffort,
    matchElement,
    parseModelInfo,
  };
};

export const MAP_CENTER: [number, number] = [58.2715, 38.3810]; // Главный плес

export const MAP_BOUNDS: [[number, number], [number, number]] = [[58.0, 37.4], [58.6, 38.9]];

export interface GCP {
  name: string;
  rawCoords: [number, number];
  trueCoords: [number, number];
}

export const GCPs: GCP[] = [
  { name: "Остров Юршинский (остаток)", rawCoords: [58.0800, 38.8000], trueCoords: [58.0825, 38.8050] },
  { name: "Дамба ГЭС Переборы", rawCoords: [58.0830, 38.8300], trueCoords: [58.0860, 38.8350] },
  { name: "Устье реки Сить", rawCoords: [58.3100, 37.9500], trueCoords: [58.3120, 37.9470] },
  { name: "База Борок", rawCoords: [58.0600, 38.2520], trueCoords: [58.0610, 38.2540] },
  { name: "Коприно", rawCoords: [58.0650, 38.3510], trueCoords: [58.0670, 38.3550] }
];

export const riverBeds = [
  {
    name: "Русло Волги (историческое)",
    color: "#3b82f6", // синий
    coords: [
      [58.0483, 38.8583],
      [58.0772, 38.4891],
      [58.0683, 38.3425],
      [58.1993, 38.4418]
    ] as [number, number][]
  },
  {
    name: "Русло Мологи",
    color: "#06b6d4", // голубой
    coords: [
      [58.1993, 38.4418],
      [58.3450, 37.8420],
      [58.5530, 37.4210]
    ] as [number, number][]
  }
];

export type Category = "church" | "pit" | "island" | "riverbed" | "rivermouth" | "base";

export interface Point {
  id?: number;
  name: string;
  coords: [number, number];
  category: Category;
}

export const historicalPoints: Point[] = [
  { id: 1, name: 'Город Молога (ист. центр)', coords: [58.198300, 38.435500], category: 'church' },
  { id: 2, name: 'Югская Дорофеева пустынь (фунд.)', coords: [58.077200, 38.258100], category: 'church' },
  { id: 3, name: 'Мологский Aфанасьевский монастырь', coords: [58.203600, 38.411400], category: 'church' },
  { id: 4, name: 'Село Лукьяново (затопл. церковь)', coords: [58.156600, 38.375500], category: 'church' },
  { id: 5, name: 'Село Ниловицы (церковь Богоявления)', coords: [58.113000, 38.331200], category: 'church' },
  { id: 6, name: 'Село Горелово (фарватер)', coords: [58.168500, 38.125500], category: 'church' },
  { id: 7, name: 'Село Козлово (Никольская церковь)', coords: [58.096300, 38.204400], category: 'church' },
  { id: 8, name: 'Село Янская Слобода', coords: [58.272100, 38.156700], category: 'church' },
  { id: 9, name: 'Усадьба Иловна (Мусиных-Пушкинских)', coords: [58.261900, 38.163300], category: 'church' },
  { id: 10, name: 'Усадьба Борисоглебск', coords: [58.275800, 38.151100], category: 'church' },
  { id: 11, name: 'Деревня Рора (затопленный берег)', coords: [58.211000, 38.199500], category: 'church' },
  { id: 12, name: 'Деревня Башарово (ист. локация)', coords: [58.134500, 38.315000], category: 'church' },
  { id: 13, name: 'Деревня Озерское', coords: [58.188000, 38.390000], category: 'church' },
  { id: 14, name: 'Деревня Сандырево', coords: [58.231200, 38.381100], category: 'church' },
  { id: 15, name: 'Деревня Песново', coords: [58.245000, 38.400500], category: 'church' },
  { id: 16, name: 'Деревенька (Брейтовский уезд)', coords: [58.285500, 37.950000], category: 'church' },
  { id: 17, name: 'Остров Юршинский (сохран.)', coords: [58.125600, 38.626800], category: 'island' },
  { id: 18, name: 'Остров Святовский Мох', coords: [58.200000, 38.350000], category: 'island' },
  { id: 19, name: 'Остров Каменник', coords: [58.175200, 38.563000], category: 'island' },
  { id: 20, name: 'Остров Шумаровский', coords: [58.109800, 38.411100], category: 'island' },
  { id: 21, name: 'Остров Трясье', coords: [58.160400, 38.480000], category: 'island' },
  { id: 22, name: 'Острова Бабинские', coords: [58.211500, 38.300500], category: 'island' },
  { id: 23, name: 'Остров Змеиный', coords: [58.122300, 38.455100], category: 'island' },
  { id: 24, name: 'Мыс Заповедная (Юг Дарв. зап-ка)', coords: [58.468200, 37.940500], category: 'island' },
  { id: 25, name: 'Мологская гряда', coords: [58.220100, 38.355600], category: 'island' },
  { id: 26, name: 'Копринская отмель', coords: [58.070000, 38.365000], category: 'island' },
  { id: 27, name: 'Слияние старых русел Волги и Мологи', coords: [58.184100, 38.452200], category: 'riverbed' },
  { id: 28, name: 'Русло Мологи у Горелово (свалы)', coords: [58.171200, 38.128800], category: 'riverbed' },
  { id: 29, name: 'Старое русло Шексны (Шекснинский плес)', coords: [58.255500, 38.580100], category: 'riverbed' },
  { id: 30, name: 'Яма у Югской пустыни', coords: [58.080500, 38.255000], category: 'pit' },
  { id: 31, name: 'Козловский перекат', coords: [58.098800, 38.201100], category: 'riverbed' },
  { id: 32, name: 'Затопленное озеро Щучье', coords: [58.188500, 38.401200], category: 'riverbed' },
  { id: 33, name: 'Старое русло реки Сутка (каньон)', coords: [58.055600, 38.288900], category: 'riverbed' },
  { id: 34, name: 'Затопленный тальвег реки Ильд', coords: [58.038800, 38.261200], category: 'riverbed' },
  { id: 35, name: 'Фарватер Волги (Глебово-Коприно)', coords: [58.035500, 38.301200], category: 'riverbed' },
  { id: 36, name: 'Устье реки Сутка', coords: [58.045472, 38.307444], category: 'rivermouth' },
  { id: 37, name: 'Устье реки Ильд', coords: [58.031500, 38.258800], category: 'rivermouth' },
  { id: 38, name: 'Устье реки Сить', coords: [58.302100, 37.896700], category: 'rivermouth' },
  { id: 39, name: 'Устье реки Яна', coords: [58.281500, 38.140200], category: 'rivermouth' },
  { id: 40, name: 'Устье реки Себла', coords: [58.423900, 37.669800], category: 'rivermouth' },
  { id: 41, name: 'Мшичинский залив (заповедник)', coords: [58.411100, 38.005500], category: 'rivermouth' },
  { id: 42, name: 'Чесменский залив', coords: [58.140800, 38.188900], category: 'rivermouth' },
  { id: 43, name: 'Залив реки Согожа', coords: [58.330500, 38.831200], category: 'rivermouth' },
  { id: 44, name: 'Бухта Коприно (марина)', coords: [58.064100, 38.342500], category: 'base' },
  { id: 45, name: 'Деревня Легково (дашборд)', coords: [58.118900, 38.291100], category: 'base' },
  { id: 46, name: 'Село Глебово (переправа)', coords: [58.006700, 38.272100], category: 'base' },
  { id: 47, name: 'Поселок Переборы (шлюзы)', coords: [58.093450, 38.685200], category: 'base' },
  { id: 48, name: 'Село Брейтово (порт)', coords: [58.306000, 37.863300], category: 'base' },
  { id: 49, name: 'Поселок Борок (ИБВВ РАН)', coords: [58.060100, 38.237200], category: 'base' },
  { id: 50, name: 'Село Погорелка', coords: [58.156400, 38.307900], category: 'base' }
];

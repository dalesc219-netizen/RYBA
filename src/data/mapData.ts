export const MAP_CENTER: [number, number] = [58.2715, 38.3810]; // Главный плес

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
  name: string;
  coords: [number, number];
  category: Category;
}

export const historicalPoints: Point[] = [
  { name: "г. Молога (центр)", coords: [58.1993, 38.4418], category: "church" },
  { name: "Югская Дорофеева пустынь", coords: [58.0772, 38.4891], category: "church" },
  { name: "Копринская отмель (бровка)", coords: [58.0683, 38.3425], category: "pit" },
  { name: "Слияние старых русел", coords: [58.1990, 38.4410], category: "riverbed" },
  { name: "Русло Мологи у Горелово (свал)", coords: [58.3450, 37.8420], category: "pit" },
  { name: "Остров Шумаровский", coords: [58.2100, 38.3900], category: "island" },
  { name: "Церковь Всех Святых", coords: [58.1500, 38.4200], category: "church" },
  { name: "Яма 'Черная'", coords: [58.2800, 38.2500], category: "pit" },
  { name: "Устье реки Сить", coords: [58.3100, 37.9500], category: "rivermouth" },
  { name: "База 'Коприно'", coords: [58.0500, 38.3200], category: "base" },
  { name: "Остров Каменник", coords: [58.1200, 38.5100], category: "island" },
  { name: "Затопленный лес", coords: [58.2400, 38.3100], category: "riverbed" },
  { name: "Яма 'Судачья'", coords: [58.2900, 38.1500], category: "pit" },
  { name: "Устье Сутки", coords: [58.0900, 38.2800], category: "rivermouth" },
  { name: "База 'Рыбинка'", coords: [58.0100, 38.5500], category: "base" },
  { name: "Церковь Преображения", coords: [58.1800, 38.4000], category: "church" },
  { name: "Остров Трясье", coords: [58.2600, 38.4800], category: "island" },
  { name: "Старое русло Шексны", coords: [58.2200, 38.5500], category: "riverbed" },
  { name: "Глубокая яма 15м", coords: [58.3200, 38.1000], category: "pit" },
  { name: "База 'Борк'", coords: [58.1100, 38.2200], category: "base" },
  { name: "Устье Имиого", coords: [58.1400, 38.1900], category: "rivermouth" },
  { name: "Церковь Николая Чудотворца", coords: [58.1900, 38.4600], category: "church" },
  { name: "Остров Юршинский", coords: [58.0800, 38.8000], category: "island" },
  { name: "Старое русло Ини", coords: [58.2700, 38.2900], category: "riverbed" },
  { name: "Сомовья яма", coords: [58.3300, 37.9900], category: "pit" },
  { name: "База 'Афанасий'", coords: [58.1300, 38.1500], category: "base" },
  { name: "Устье реки Кештома", coords: [58.2500, 38.5500], category: "rivermouth" },
  { name: "Церковь Рождества Богородицы", coords: [58.1700, 38.4300], category: "church" },
  { name: "Остров Святовский", coords: [58.1100, 38.7500], category: "island" },
  { name: "Старое русло Ухры", coords: [58.2100, 38.6000], category: "riverbed" },
  { name: "Щучья яма", coords: [58.3000, 38.0500], category: "pit" },
  { name: "База 'Биг Фиш'", coords: [58.1000, 38.3000], category: "base" },
  { name: "Устье Чеснавы", coords: [58.2200, 38.1500], category: "rivermouth" },
  { name: "Церковь Успения", coords: [58.1600, 38.4500], category: "church" },
  { name: "Остров Зеленый", coords: [58.2500, 38.4000], category: "island" },
  { name: "Старое русло Согожи", coords: [58.2900, 38.5000], category: "riverbed" },
  { name: "Лещевая яма", coords: [58.3100, 38.1200], category: "pit" },
  { name: "База 'Заповедный край'", coords: [58.1500, 38.1000], category: "base" },
  { name: "Устье Маткомы", coords: [58.2800, 38.6500], category: "rivermouth" },
  { name: "Церковь Троицы", coords: [58.2000, 38.4800], category: "church" },
  { name: "Остров Копринский", coords: [58.0700, 38.3500], category: "island" },
  { name: "Старое русло Кондошки", coords: [58.2300, 38.2000], category: "riverbed" },
  { name: "Яма 'Центральная'", coords: [58.3400, 37.9000], category: "pit" },
  { name: "База 'Море'", coords: [58.1200, 38.2500], category: "base" },
  { name: "Устье Себлы", coords: [58.3500, 37.8500], category: "rivermouth" },
  { name: "Церковь Богоявления", coords: [58.1800, 38.4900], category: "church" },
  { name: "Остров Песчаный", coords: [58.2200, 38.3500], category: "island" },
  { name: "Старое русло Ветхи", coords: [58.2600, 38.2500], category: "riverbed" },
  { name: "Окуневая яма", coords: [58.3500, 38.0500], category: "pit" },
  { name: "База 'Рыбацкая деревня'", coords: [58.1400, 38.2000], category: "base" }
];

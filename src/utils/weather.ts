export interface FishingAnalysis {
  status: string;
  index: number;
  isStorm: boolean;
}

export function analyzeFishingConditions(windSpeedMs: number, pressureMmHg: number): FishingAnalysis {
  if (windSpeedMs > 7) {
    return { status: "Шторм! Опасно для лодок", index: 10, isStorm: true };
  } else if (pressureMmHg < 740) {
    return { status: "Клёв щуки: Высокий", index: 80, isStorm: false };
  } else if (pressureMmHg > 755) {
    return { status: "Клёв белой рыбы: Высокий", index: 70, isStorm: false };
  }
  return { status: "Стабильный клёв", index: 60, isStorm: false };
}

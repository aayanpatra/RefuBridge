import { randomUUID } from "node:crypto";

const needTemplates = [
  {
    category: "FOOD",
    items: ["Family grocery bundle", "Infant nutrition kit", "Cooking essentials pack"],
    minCostAed: 55,
    maxCostAed: 180,
    maxStock: 8,
    maxDailyUse: 3,
  },
  {
    category: "MEDICINE",
    items: ["First-aid refill kit", "Child fever care pack", "Monthly care supplies"],
    minCostAed: 65,
    maxCostAed: 240,
    maxStock: 6,
    maxDailyUse: 2,
  },
  {
    category: "SHELTER",
    items: ["Weatherproof blanket set", "Insulated sleeping mats", "Shelter repair kit"],
    minCostAed: 90,
    maxCostAed: 320,
    maxStock: 5,
    maxDailyUse: 2,
  },
] as const;

export const PRESENTATION_NEEDS_PER_REFRESH = 18;

function randomIndex(length: number, random: () => number) {
  return Math.min(Math.floor(random() * length), length - 1);
}

function randomInteger(minimum: number, maximum: number, random: () => number) {
  return minimum + randomIndex(maximum - minimum + 1, random);
}

export function createPresentationNeeds(
  refugeeIds: readonly string[],
  random: () => number = Math.random,
) {
  if (refugeeIds.length === 0) {
    throw new RangeError("At least one demo profile is required to create needs.");
  }

  return Array.from({ length: PRESENTATION_NEEDS_PER_REFRESH }, () => {
    const template = needTemplates[randomIndex(needTemplates.length, random)];
    return {
      id: `presentation-need-${randomUUID()}`,
      refugeeId: refugeeIds[randomIndex(refugeeIds.length, random)],
      category: template.category,
      item: template.items[randomIndex(template.items.length, random)],
      costAed: randomInteger(template.minCostAed, template.maxCostAed, random),
      stockLeft: randomInteger(1, template.maxStock, random),
      dailyUse: randomInteger(1, template.maxDailyUse, random),
      fundedAed: 0,
      status: "OPEN",
    };
  });
}

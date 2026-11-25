import type {Settlement, World} from './world';

export interface CouncilReport {
  day: number;
  people: number;
  homeless: number;
  hungryTowns: number;
  lowestStability: number;
  taxes: number;
  tribute: number;
}

export interface Crown {
  gold: number;
  share: number;
  reports: CouncilReport[];
}

export function newCrown(): Crown {
  return { gold: 0, share: 0, reports: [] };
}

export function beds(town: Settlement) {
  return (town.houses ?? Math.ceil(town.population / 4)) * 4;
}

export function conditions(town: Settlement): string[] {
  const alerts: string[] = [];
  const homeless = Math.max(0, town.population - beds(town));
  if (town.famine) alerts.push('Famine');
  else if (town.shortageDays) alerts.push('People going hungry');
  else if (town.lastFoodNet < 0 && town.stock.food / -town.lastFoodNet < 15)
    alerts.push('Food running low');
  if (homeless) alerts.push(`${homeless} without shelter`);
  if (town.stability < 50) alerts.push('Low stability');
  if ((town.treasury ?? town.population * 4) < 25) alerts.push('Treasury below 25g');
  return alerts;
}

function record(world: World, description: string, changes: Record<string, number>, settlementId?: string) {
  world.events.push({ id: 'e' + world.events.length, day: world.day, type: 'council', description, changes, settlementId });
}

export function setCrownShare(world: World, share: number) {
  const crown = world.crown ??= newCrown();
  if (![0, 10, 25, 50].includes(share) || share === crown.share) return;
  crown.share = share;
  record(world, `The king set aside ${share}% of future town tax receipts for the Crown.`, {share});
}

export function transferGold(world: World, id: string, direction: 'collect' | 'grant', amount: number) {
  const town = world.settlements.find(item => item.id === id);
  if (!town || !Number.isSafeInteger(amount) || amount <= 0) return false;
  const crown = world.crown ??= newCrown();
  const local = town.treasury ?? town.population * 4;
  if (amount > (direction === 'grant' ? crown.gold : local)) return false;
  const delta = direction === 'grant' ? amount : -amount;
  town.treasury = local + delta;
  crown.gold -= delta;
  record(world, direction === 'grant' ? `The Crown granted ${amount} gold to ${town.name}.` :
    `${town.name} contributed ${amount} gold to the Crown.`, { townGold: delta, crownGold: -delta }, id);
  return true;
}

// Called once after all five towns finish their monthly payroll and tax collection.
export function closeCouncilMonth(world: World) {
  const crown = world.crown ??= newCrown();
  const report: CouncilReport = {day: world.day, people: 0, homeless: 0, hungryTowns: 0, lowestStability: 100, taxes: 0, tribute: 0};
  for (const town of world.settlements) {
    const tax = town.lastTax ?? 0;
    const tribute = Math.floor(tax * crown.share / 100);
    town.treasury! -= tribute;
    crown.gold += tribute;
    report.tribute += tribute;
    report.taxes += tax;
    report.people += town.population;
    report.homeless += Math.max(0, town.population - beds(town));
    report.hungryTowns += Number(town.shortageDays > 0);
    report.lowestStability = Math.min(report.lowestStability, town.stability);
  }
  crown.reports = [...crown.reports.slice(-11), report];
}

export function validCrown(crown: Crown | undefined, day: number) {
  const count = (n: number) => Number.isSafeInteger(n) && n >= 0;
  return crown === undefined || Boolean(crown && count(crown.gold) && [0,10,25,50].includes(crown.share) &&
    Array.isArray(crown.reports) && crown.reports.length <= 12 && crown.reports.every(r =>
      r && [r.day,r.people,r.homeless,r.hungryTowns,r.taxes,r.tribute].every(count) &&
      r.day <= day && r.day % 30 === 0 && r.tribute <= r.taxes && r.hungryTowns <= 5 &&
      Number.isFinite(r.lowestStability) && r.lowestStability >= 0 && r.lowestStability <= 100));
}

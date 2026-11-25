import {event, price, route, travelDays, type World, type Settlement} from './world';

export interface GrainPetition {
  opened: number;
  hungryDays: number;
  decision: 'pending' | 'market' | 'purchase' | 'requisition';
  caravan?: string;
  donor?: string;
  spent: number;
}

export const granaryCost = {timber: 80, stone: 50, gold: 100, days: 30};
export const foodCapacity = (s: Settlement) => s.population * 60 + (s.granary === 'built' ? 6000 : 0);
export const daysOfGrain = (s: Settlement) => s.lastFoodNet < 0 ? s.stock.food / -s.lastFoodNet : Infinity;

export function buildGranary(w: World, s: Settlement) {
  const local = s.treasury ?? s.population * 4;
  if (s.granary !== undefined || local < granaryCost.gold || s.stock.timber < granaryCost.timber || s.stock.stone < granaryCost.stone) return false;
  s.stock.timber -= granaryCost.timber;
  s.stock.stone -= granaryCost.stone;
  s.treasury = local - granaryCost.gold;
  s.householdGold = (s.householdGold ?? s.population * 3) + granaryCost.gold;
  s.granary = w.day + granaryCost.days;
  event(w,'works',`${s.name} began building a granary. Completion is due on day ${s.granary}.`,s.id,{timber:-80,stone:-50,gold:-100});
  return true;
}

export function reliefOffers(w: World, buyer: Settlement) {
  const offers = [];
  const busy = new Set((w.caravans ?? []).flatMap(c => [c.sellerId,c.buyerId]));
  if (busy.has(buyer.id) || buyer.petition?.decision !== 'pending') return [];
  for (const donor of w.settlements) {
    if (donor.id === buyer.id || busy.has(donor.id) || donor.shortageDays) continue;
    // Protect at least five full daily rations at the donor's current population.
    const amount = Math.min(500, Math.floor(donor.stock.food - donor.population * .9 * 5));
    if (amount <= 0) continue;
    const path = route(w, donor, buyer);
    if (!path || path.length < 2) continue;
    const duration = travelDays(w,path);
    offers.push({donor, amount, path, duration, gold:Math.ceil(amount * price(donor,'food') + duration * 2)});
  }
  return offers.sort((a,b) => a.duration - b.duration || a.gold - b.gold);
}

export function answerPetition(w: World, buyerId: string, choice: 'purchase' | 'requisition' | 'market', donorId?: string, ration = false) {
  const buyer = w.settlements.find(s => s.id === buyerId);
  const p = buyer?.petition;
  if (!buyer || !p || p.decision !== 'pending') return false;
  if (choice === 'market') {
    p.decision = choice;
    event(w,'petition',`The king left ${buyer.name}'s grain petition to local merchants.`,buyer.id);
    return true;
  }
  const offer = reliefOffers(w,buyer).find(o => o.donor.id === donorId);
  if (!offer) return false;
  const {donor, amount, path, duration} = offer;
  const gold = choice === 'purchase' ? offer.gold : 0;
  if (gold > (w.crown?.gold ?? 0)) return false;
  if (gold) w.crown!.gold -= gold;
  donor.stock.food -= amount;
  if (choice === 'requisition') donor.stability = Math.max(0, donor.stability - 3);
  const id = 'c' + (w.nextCaravanId ?? 0);
  w.nextCaravanId = (w.nextCaravanId ?? 0) + 1;
  (w.caravans ??= []).push({id, buyerId, sellerId:donor.id, resource:'food', amount, gold, barterAmount:0, path, duration, progress:0});
  Object.assign(p,{decision:choice,caravan:id,donor:donor.id,spent:gold});
  if (ration) buyer.rationsUntil = w.day + duration;
  event(w,'relief',`${donor.name} dispatched ${amount} grain to ${buyer.name} by royal order. ${ration ? 'Reduced rations apply until arrival.' : 'Full rations continue.'}`,buyer.id,{amount,gold,duration});
  return true;
}

export function reviewGrain(w: World, s: Settlement, deliveryFrom?: string) {
  const runway = daysOfGrain(s);
  const p = s.petition;
  if (!p) {
    if (w.day < (s.petitionAfter ?? 0) || (runway >= 10 && !s.shortageDays)) return;
    s.petition = {opened:w.day, hungryDays:Number(s.shortageDays > 0), decision:'pending', spent:0};
    event(w,'petition',`${s.name} petitioned the Crown for grain with ${Math.floor(s.stock.food)} in store.`,s.id,{stock:s.stock.food,dailyBalance:s.lastFoodNet});
    return;
  }
  p.hungryDays += Number(s.shortageDays > 0);
  const arrived = !!deliveryFrom;
  if (!arrived && (p.caravan || s.shortageDays > 0 || runway < 15 || s.stock.food < s.population * .9 * 3)) return;
  const donor = w.settlements.find(t => t.id === (deliveryFrom ?? p.donor));
  const remaining = donor ? Math.floor(donor.stock.food) : 0;
  event(w,'relief_outcome',`${s.name}: ${arrived ? 'grain arrived' : 'grain supplies recovered'}. ${p.hungryDays} days short of rations since the petition. Crown spending: ${p.spent} gold.${donor ? ' '+donor.name+' retains '+remaining+' grain.' : ''}`,s.id,{hungryDays:p.hungryDays,spent:p.spent,donorStock:remaining});
  delete s.petition;
  s.petitionAfter = w.day + 15;
}

export function validRelief(w: World, s: Settlement) {
  const day = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  if (![s.rationsUntil,s.petitionAfter].every(n => n === undefined || day(n))) return false;
  if (s.granary !== undefined && s.granary !== 'built' && !day(s.granary)) return false;
  const p = s.petition;
  if (p === undefined) return true;
  if (!p || !day(p.opened) || p.opened > w.day || !day(p.spent) || !day(p.hungryDays)) return false;
  if (p.decision === 'pending' || p.decision === 'market') return !p.caravan && !p.donor && p.spent === 0;
  return ['purchase','requisition'].includes(p.decision) && !!w.caravans?.some(c =>
    c.id === p.caravan && c.sellerId === p.donor && c.buyerId === s.id && c.resource === 'food' && c.gold === p.spent);
}

import {describe,it,expect} from 'vitest';import {advance,advanceTrade,buildHouse,housing,setTax,setPricePolicy,price,blessHarvest,grantSupplies,createWorld,validateWorld} from '../src/engine/world';import {parseSave} from '../src/persistence/store';
describe('world simulation',()=>{it('recreates worlds and advances deterministically',()=>{const a=createWorld(123),b=createWorld(123);advance(a,1000);advance(b,1000);expect(a).toEqual(b)});it('keeps stocks and populations bounded over a long history',()=>{const w=createWorld(987);advance(w,3000);expect(validateWorld(w)).toBe(true);for(const s of w.settlements){expect(s.population).toBeGreaterThan(0);expect(s.population).toBeLessThanOrEqual(3000);for(const n of Object.values(s.stock)){expect(Number.isFinite(n)).toBe(true);expect(n).toBeGreaterThanOrEqual(0);expect(n).toBeLessThan(180000)}}});it('resumes identically after serialization',()=>{const a=createWorld(25);advance(a,120);const b=parseSave(JSON.stringify({name:'test',world:a})).world;advance(a,300);advance(b,300);expect(a).toEqual(b)});it('rejects malformed and unsupported saves',()=>{expect(()=>parseSave('{}')).toThrow();expect(()=>parseSave('{')).toThrow();const w=createWorld(3);w.settlements[0].stock.food=-1;expect(()=>parseSave(JSON.stringify({name:'bad',world:w}))).toThrow()});it('consumes food and records famine based on conditions',()=>{const w=createWorld(4);const s=w.settlements[0];s.stock.food=0;w.tiles.forEach(t=>{t.fertility=0});advance(w,20);expect(s.famine).toBe(true);expect(w.events.some(e=>e.type==='famine'&&e.settlementId===s.id)).toBe(true)})});

it('observer interventions cost influence, affect food, and survive save/load',()=>{const a=createWorld(12);const b=structuredClone(a);const id=a.settlements[0].id;expect(blessHarvest(a,id)).toBe(true);expect(blessHarvest(a,id)).toBe(false);advance(a,30);advance(b,30);expect(a.settlements[0].stock.food).toBeGreaterThan(b.settlements[0].stock.food);expect(a.influence).toBe(2);const food=a.settlements[0].stock.food;expect(grantSupplies(a,id)).toBe(true);expect(a.settlements[0].stock.food).toBeGreaterThan(food);expect(a.influence).toBe(0);expect(grantSupplies(a,id)).toBe(false);const restored=parseSave(JSON.stringify({name:'test',world:a})).world;advance(a,90);advance(restored,90);expect(restored).toEqual(a);expect(a.influence).toBe(1)});

describe('trade',()=>{
 function scenario(barter:boolean){const w=createWorld(42);w.tiles.forEach(t=>{t.terrain='plains'});const [buyer,seller,...others]=w.settlements;for(const s of w.settlements){s.population=100;s.stock={food:1800,timber:100,stone:70,iron:18};s.treasury=0;}buyer.stock.food=0;seller.stock.food=5000;if(barter){buyer.stock.timber=1000;seller.stock.timber=0}else buyer.treasury=10000;for(const s of others)s.stock.food=1800;w.day=10;return {w,buyer,seller};}
 it('reserves gold and cargo, then settles once on arrival',()=>{const {w,buyer,seller}=scenario(false);const foodBefore=buyer.stock.food+seller.stock.food;const goldBefore=buyer.treasury!+seller.treasury!;advanceTrade(w);const c=w.caravans![0];expect(c).toBeDefined();expect(c.gold).toBeGreaterThan(0);expect(buyer.stock.food).toBe(0);expect(buyer.treasury!+seller.treasury!+c.gold).toBe(goldBefore);expect(buyer.stock.food+seller.stock.food+c.amount).toBe(foodBefore);w.day=11;for(let i=0;i<c.duration;i++)advanceTrade(w);expect(w.caravans).toHaveLength(0);expect(buyer.stock.food+seller.stock.food).toBe(foodBefore);expect(buyer.treasury!+seller.treasury!).toBe(goldBefore);const after=buyer.stock.food;advanceTrade(w);expect(buyer.stock.food).toBe(after)});
 it('uses barter when gold is unavailable and both goods are needed',()=>{const {w,buyer,seller}=scenario(true);const food=buyer.stock.food+seller.stock.food,timber=buyer.stock.timber+seller.stock.timber;advanceTrade(w);const c=w.caravans![0];expect(c.barterResource).toBe('timber');expect(c.gold).toBe(0);expect(buyer.stock.timber+seller.stock.timber+c.barterAmount).toBe(timber);w.day=11;for(let i=0;i<c.duration;i++)advanceTrade(w);expect(buyer.stock.food+seller.stock.food).toBe(food);expect(buyer.stock.timber+seller.stock.timber).toBe(timber)});
});

it('requests affordable iron when it is the greatest shortage',()=>{const w=createWorld(1234);w.tiles.forEach(t=>{t.terrain='plains'});for(const s of w.settlements){s.population=100;s.stock={food:1800,timber:100,stone:70,iron:18};s.treasury=0}const buyer=w.settlements[0],seller=w.settlements[1];buyer.x=10;buyer.y=10;seller.x=11;seller.y=10;buyer.stock.iron=0;buyer.treasury=20;seller.stock.iron=300;w.day=10;advanceTrade(w);const shipment=w.caravans!.find(c=>c.buyerId===buyer.id);expect(shipment?.resource).toBe('iron');expect(shipment!.amount).toBeGreaterThan(0);expect(shipment!.amount).toBeLessThan(18);expect(shipment!.gold).toBeLessThanOrEqual(20);});


describe('town governance',()=>{
 it('transfers taxes and wages without creating gold',()=>{const w=createWorld(4),s=w.settlements[0];s.treasury=500;s.householdGold=500;expect(setTax(w,s.id,20)).toBe(true);const total=s.treasury+s.householdGold;w.day=29;advance(w,1);expect(s.treasury!+s.householdGold!).toBe(total);expect(s.lastTax).toBeGreaterThan(0);expect(s.lastWages).toBeGreaterThan(0)});
 it('builds housing with resources and reduces homelessness',()=>{const w=createWorld(6),s=w.settlements[0];s.houses=0;s.stock.timber=30;s.stock.stone=15;s.treasury=25;const homeless=housing(s).homeless;expect(buildHouse(w,s.id)).toBe(true);expect(housing(s).homeless).toBe(homeless-4);expect(s.stock.timber).toBe(0);expect(s.stock.stone).toBe(0);expect(s.treasury).toBe(0);expect(buildHouse(w,s.id)).toBe(false)});
 it('changes trade asking prices and validates policy saves',()=>{const w=createWorld(8),s=w.settlements[0],base=price(s,'iron');expect(setPricePolicy(w,s.id,'iron',150)).toBe(true);expect(price(s,'iron')).toBeCloseTo(base*1.5,1);expect(setTax(w,s.id,31)).toBe(false);expect(validateWorld(w)).toBe(true);const loaded=parseSave(JSON.stringify({name:'test',world:w})).world;expect(loaded.settlements[0].pricePolicies?.iron).toBe(150);loaded.settlements[0].taxRate=-1;expect(validateWorld(loaded)).toBe(false)});
});

import {setCrownShare, transferGold} from '../src/engine/crown';

it('moves existing gold between town and Crown and resumes the same reign', () => {
  const world = createWorld(38);
  const town = world.settlements[0];
  const gold = town.treasury!;
  expect(transferGold(world, town.id, 'grant', 10)).toBe(false);
  expect(transferGold(world, town.id, 'collect', 50)).toBe(true);
  expect(transferGold(world, town.id, 'grant', 10)).toBe(true);
  expect(town.treasury).toBe(gold - 40);
  expect(world.crown?.gold).toBe(40);

  setCrownShare(world, 25);
  const control = structuredClone(world);
  setCrownShare(control, 0);
  advance(world, 30);
  advance(control, 30);
  const report = world.crown!.reports[0];
  expect(report.tribute).toBeGreaterThan(0);
  expect(world.crown!.gold).toBe(40 + report.tribute);
  const localTotal = (w: typeof world) => w.settlements.reduce((sum,t) => sum + t.treasury!, 0);
  expect(localTotal(control) - localTotal(world)).toBe(report.tribute);
  const loaded = parseSave(JSON.stringify({name:'Reign', world})).world;
  advance(world, 60);
  advance(loaded, 60);
  expect(loaded).toEqual(world);
});

it('accumulates fractional monthly growth into residents who need homes', () => {
  const w = createWorld(23);
  for (const tile of w.tiles) tile.fertility = 1;
  const town = w.settlements[0];
  town.population = 100;
  town.houses = 25;
  town.stability = 100;
  town.taxRate = 0;
  for (let i=0; i<18; i++) {
    // Each census in this fixture sees a well-fed town in spring.
    w.day = 29;
    advance(w,1);
  }
  expect(housing(town).homeless).toBeGreaterThan(0);
});

import {answerPetition, buildGranary, foodCapacity, reliefOffers} from '../src/engine/relief';
import {grainCrisis} from './grain-fixture';

it('reserves relief payment and grain once, then records the delivered outcome after a reload',()=>{
  const {world,buyer,donor} = grainCrisis();
  const quote = reliefOffers(world,buyer).find(o=>o.donor.id===donor.id)!;
  const stock = donor.stock.food, treasury = donor.treasury!;
  expect(buyer.petition?.decision).toBe('pending');
  expect(quote.duration).toBe(4);
  expect(answerPetition(world,buyer.id,'purchase',donor.id,true)).toBe(true);
  expect(answerPetition(world,buyer.id,'purchase',donor.id)).toBe(false);
  expect(world.crown!.gold).toBe(2000-quote.gold);
  expect(donor.stock.food).toBe(stock-quote.amount);
  expect(donor.treasury).toBe(treasury);
  expect(buyer.stock.food).toBe(0);
  const resumed = parseSave(JSON.stringify({name:'Road to Alderwick',world})).world;
  advance(resumed,quote.duration);
  advance(world,quote.duration);
  expect(resumed).toEqual(world);
  expect(donor.treasury).toBe(treasury+quote.gold);
  expect(buyer.petition).toBeUndefined();
  expect(world.events.filter(e=>e.type==='relief_outcome' && e.settlementId===buyer.id)).toHaveLength(1);
  expect(world.events.at(-1)?.changes.spent).toBe(quote.gold);
});

it('respects reachability and payment, and charges the donor for a requisition',()=>{
  const {world,buyer,donor} = grainCrisis();
  world.crown!.gold = 0;
  expect(answerPetition(world,buyer.id,'purchase',donor.id)).toBe(false);
  world.tiles.forEach(t=>{if(t.x===14)t.terrain='water'});
  expect(answerPetition(world,buyer.id,'requisition',donor.id)).toBe(false);
  world.tiles[10*64+14].terrain='plains';
  const stability=donor.stability;
  expect(answerPetition(world,buyer.id,'requisition',donor.id)).toBe(true);
  expect(donor.stability).toBe(stability-3);
});

it('leaves a petition with the market until the stores recover',()=>{
  const {world,buyer} = grainCrisis();
  expect(answerPetition(world,buyer.id,'market')).toBe(true);
  advance(world,1);
  expect(buyer.petition?.decision).toBe('market');
  buyer.stock.food = buyer.population*50;
  advance(world,1);
  expect(buyer.petition).toBeUndefined();
  expect(world.events.at(-1)?.changes.spent).toBe(0);
});

it('pays for construction once and releases storage on the thirtieth day',()=>{
  const {world,donor}=grainCrisis();
  const stock={...donor.stock}, gold=donor.treasury!;
  expect(buildGranary(world,donor)).toBe(true);
  expect(buildGranary(world,donor)).toBe(false);
  expect(donor.treasury).toBe(gold-100);
  expect(donor.stock.stone).toBe(stock.stone-50);
  expect(donor.stock.timber).toBe(stock.timber-80);
  advance(world,29);
  expect(foodCapacity(donor)).toBe(donor.population*60);
  expect(typeof donor.granary).toBe('number');
  advance(world,1);
  expect(donor.granary).toBe('built');
  expect(foodCapacity(donor)).toBe(donor.population*60+6000);
  expect(validateWorld(world)).toBe(true);
});

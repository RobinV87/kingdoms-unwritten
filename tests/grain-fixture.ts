import {advance, createWorld} from '../src/engine/world';

export function grainCrisis() {
  const world = createWorld(42);
  for (const tile of world.tiles) { tile.terrain = 'plains'; tile.fertility = .3; }
  const [buyer,donor] = world.settlements;
  Object.assign(buyer,{x:10,y:10});
  Object.assign(donor,{x:18,y:10});
  buyer.stock.food = 0;
  donor.stock.food = 15000;
  world.crown = {gold:2000,share:0,reports:[]};
  advance(world,1);
  return {world,buyer,donor};
}

import {useState} from 'react';
import {answerPetition, daysOfGrain, reliefOffers} from './engine/relief';
import type {World, Settlement} from './engine/world';

type Act = (action:(world:World)=>void)=>void;

function Petition({world,town,act}:{world:World;town:Settlement;act:Act}) {
  const [ration,setRation] = useState(false);
  const [selected,setSelected] = useState('');
  const p = town.petition!;
  const offers = reliefOffers(world,town);
  const offer = offers.find(o=>o.donor.id===selected) ?? offers[0];
  const days = daysOfGrain(town);
  const caravan = world.caravans?.find(c=>c.id===p.caravan);
  return <article className="grain-case">
    <h3>{town.name}</h3>
    <p>{Math.floor(town.stock.food)} grain in store. {Number.isFinite(days)
      ? `At today's deficit, reserves will last ${days.toFixed(1)} days.`
      : 'Today’s harvest covers consumption.'}</p>
    {p.decision === 'pending' ? <>
      {offer ? <>
        <label className="field">Supply town<select value={offer.donor.id} onChange={e=>setSelected(e.target.value)}>
          {offers.map(o=><option key={o.donor.id} value={o.donor.id}>{o.donor.name} · {o.duration} days</option>)}</select></label>
        <p><b>{offer.amount} grain · {offer.duration} days by road</b><br/>
          {offer.donor.name} would retain {Math.floor(offer.donor.stock.food-offer.amount)} grain.</p>
        <label className="council-pause"><input type="checkbox" checked={ration} onChange={e=>setRation(e.target.checked)}/> Reduce rations during transit</label>
        <small>Rations use 20% less grain and cost 0.06 stability per day.</small>
        <button disabled={(world.crown?.gold??0)<offer.gold} onClick={()=>act(w=>answerPetition(w,town.id,'purchase',offer.donor.id,ration))}>Buy shipment · {offer.gold}g</button>
        <small>Crown treasury holds {world.crown?.gold??0} gold.</small>
        <button onClick={()=>act(w=>answerPetition(w,town.id,'requisition',offer.donor.id,ration))}>Requisition · −3 donor stability</button>
      </> : <p>No shipment available. Both towns need a free caravan slot, a land route and enough donor grain to keep five days of full rations.</p>}
      <button onClick={()=>act(w=>answerPetition(w,town.id,'market'))}>Leave to merchants</button>
    </> : <p>{caravan ? `${caravan.amount} grain due in ${caravan.duration-caravan.progress} days.` : 'Local merchants may supply the town through ordinary trade.'} {town.rationsUntil && town.rationsUntil>world.day ? 'Reduced rations are in effect.' : ''}</p>}
  </article>;
}

export function GrainPetitions({world,act}:{world:World;act:Act}) {
  const towns = world.settlements.filter(t=>t.petition);
  return <div><h3>Grain petitions</h3>
    {!towns.length && <p className="bodycopy">No outstanding petitions. Towns appeal when residents go hungry or reserves fall below ten days at the current deficit.</p>}
    {towns.map(town=><Petition key={town.id+'-'+town.petition!.opened} world={world} town={town} act={act}/>)}
  </div>;
}

import {useState} from 'react';
import type {World} from './engine/world';
import {beds, conditions, newCrown, setCrownShare, transferGold} from './engine/crown';

interface Props {
  initialReport: boolean;
  world: World;
  govern: (id: string) => void;
  act: (action: (world: World) => void) => void;
  pauseMonthly: boolean;
  setPauseMonthly: (value: boolean) => void;
}

const number = (value: number) => Math.floor(value).toLocaleString();

export function RoyalCouncil({initialReport,world, govern, act, pauseMonthly, setPauseMonthly}: Props) {
  const [section, setSection] = useState<'Realm' | 'Treasury' | 'Reports'>(initialReport?'Reports':'Realm');
  const [fundTown, setFundTown] = useState('s0');
  const [amount, setAmount] = useState(50);
  const [notice, setNotice] = useState('');
  const towns = world.settlements;
  const town = towns.find(t => t.id === fundTown) ?? towns[0];
  const crown = world.crown ?? newCrown();
  const localGold = town.treasury ?? town.population * 4;
  const people = towns.reduce((sum,t) => sum + t.population, 0);
  const homeless = towns.reduce((sum,t) => sum + Math.max(0,t.population-beds(t)), 0);
  const send = (direction: 'collect' | 'grant') => {
    act(w => {transferGold(w, town.id, direction, amount);});
    setNotice(direction === 'grant' ? `Granted ${amount} gold to ${town.name}.` : `Collected ${amount} gold from ${town.name}.`);
  };
  return <section className="council">
    <div className="eyebrow">♛ &nbsp; THE KING’S COUNCIL</div>
    <h2>Kingdom of {world.name}</h2>
    <p className="subtitle">Your charge is to feed and shelter {number(people)} people.</p>
    <nav aria-label="Council chambers">{(['Realm','Treasury','Reports'] as const).map(name =>
      <button key={name} aria-pressed={section===name} onClick={()=>setSection(name)}>{name}</button>)}</nav>
    {section==='Realm' && <>
      <dl className="royal-figures">
        <div><dt>People</dt><dd>{number(people)}</dd></div><div><dt>Without shelter</dt><dd>{number(homeless)}</dd></div>
        <div><dt>Crown gold</dt><dd>{number(crown.gold)}g</dd></div><div><dt>Caravans</dt><dd>{world.caravans?.length??0}</dd></div>
      </dl>
      <h3>Dispatches from your towns</h3>
      {towns.map(t=>({town:t, alerts:conditions(t)})).sort((a,b)=>Number(b.town.famine)-Number(a.town.famine)||b.alerts.length-a.alerts.length).map(({town:t,alerts})=>
        <button className="dispatch" key={t.id} onClick={()=>govern(t.id)}>
          <strong>{t.name} <span>→</span></strong>
          <small>{number(t.population)} people · {Math.round(t.stability)}% stability</small>
          <em className={alerts.length?'urgent':''}>{alerts.join(' · ') || 'No urgent petitions'}</em>
        </button>)}
    </>}
    {section==='Treasury' && <>
      <h3>Royal treasury</h3><p className="royal-balance">{number(crown.gold)} gold</p>
      <label className="field">Crown share of town taxes<select value={crown.share} onChange={e=>act(w=>setCrownShare(w,Number(e.target.value)))}>
        {[0,10,25,50].map(n=><option key={n} value={n}>{n}%</option>)}</select></label>
      <p className="bodycopy">Each town keeps the rest of its monthly tax receipts to buy supplies and pay workers.</p>
      <h3>Transfer gold</h3>
      <label className="field">Town<select value={town.id} onChange={e=>{setFundTown(e.target.value);setNotice('')}}>{towns.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <p>{town.name} holds {number(localGold)} gold.</p>
      <label className="field">Amount<select value={amount} onChange={e=>setAmount(Number(e.target.value))}>{[10,50,100,250].map(n=><option key={n} value={n}>{n} gold</option>)}</select></label>
      <div className="actions"><button disabled={localGold<amount} onClick={()=>send('collect')}>Collect from town</button><button disabled={crown.gold<amount} onClick={()=>send('grant')}>Grant to town</button></div>
      <p aria-live="polite">{notice}</p>
    </>}
    {section==='Reports' && <>
      <label className="council-pause"><input type="checkbox" checked={pauseMonthly} onChange={e=>setPauseMonthly(e.target.checked)}/> Pause for monthly council</label>
      <p className="bodycopy">The next report arrives in {30-world.day%30} days, after towns collect taxes and pay wages.</p>
      {[...crown.reports].reverse().map(r=><article className="dispatch" key={r.day}><strong>Year {Math.ceil(r.day/360)} · Month {Math.floor(((r.day-1)%360)/30)+1}</strong>
        <p>{number(r.people)} residents · {r.homeless} unhoused · {r.hungryTowns} towns going hungry</p>
        <small>Lowest stability {Math.round(r.lowestStability)}% · {r.taxes}g collected · {r.tribute}g to Crown</small></article>)}
    </>}
  </section>;
}

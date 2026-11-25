import Dexie, {type Table} from 'dexie';
import {type World,validateWorld} from '../engine/world';
export interface Save {id?:number; name:string; savedAt:number; world:World}
class Database extends Dexie { saves!:Table<Save,number>; constructor(){super('kingdoms-unwritten');this.version(1).stores({saves:'++id,name,savedAt'});} }
export const db=new Database();
export async function saveWorld(name:string,world:World,id?:number){if(!validateWorld(world))throw new Error('World data is invalid.');const save:Save={name:name.trim()||'Untitled world',savedAt:Date.now(),world:structuredClone(world)};if(id)save.id=id;return db.saves.put(save);}
export function parseSave(text:string):Save {const s=JSON.parse(text) as Save;if(!s||typeof s.name!=='string'||!validateWorld(s.world))throw new Error('Invalid or unsupported save file.');return {name:s.name,savedAt:Date.now(),world:s.world};}

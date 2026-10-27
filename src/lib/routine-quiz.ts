export const skinTypes = ['Oily', 'Dry', 'Combination', 'Not sure'] as const;
export const concerns = ['Acne', 'Pigmentation', 'Dryness', 'Uneven tone'] as const;
export const textures = ['No preference', 'Lightweight', 'Rich & creamy'] as const;
export type SkinType = typeof skinTypes[number];
export type Concern = typeof concerns[number];
export type Texture = typeof textures[number];
export type RoutineAnswers = {skin: SkinType; concerns: Concern[]; texture: Texture; sensitive: boolean};
export type RoutineItem = {id: string; step: string; name: string; description: string; detail: string; art: readonly number[]};
export const initialAnswers: RoutineAnswers = {skin:'Combination',concerns:['Pigmentation'],texture:'No preference',sensitive:false};
export const savedRoutineKey = 'anusmita-routine-quiz-v1';
export function toggleConcern(selected: Concern[], concern: Concern): Concern[] {
 if(selected.includes(concern))return selected.filter(c=>c!==concern);
 return selected.length<2?[...selected,concern]:selected;
}
export function parseSavedRoutine(raw: string | null): RoutineAnswers | null {
 try {
  const value:unknown=JSON.parse(raw||'null');
  if(!value||typeof value!=='object')return null;
  const a=value as Record<string,unknown>;
  if(!skinTypes.includes(a.skin as SkinType)||!textures.includes(a.texture as Texture)||typeof a.sensitive!=='boolean'||!Array.isArray(a.concerns)||a.concerns.length>2||a.concerns.some(c=>!concerns.includes(c as Concern))||new Set(a.concerns).size!==a.concerns.length)return null;
  return {skin:a.skin as SkinType,concerns:a.concerns as Concern[],texture:a.texture as Texture,sensitive:a.sensitive};
 }catch{return null;}
}
/** Cosmetic product-category suggestions, never diagnoses or treatment prescriptions. */
export function buildRoutine(a:RoutineAnswers,period:'AM'|'PM'):RoutineItem[] {
 const rich=a.texture==='Rich & creamy'||(a.texture==='No preference'&&a.skin==='Dry');
 const light=a.texture==='Lightweight'||(!rich&&(a.skin==='Oily'||a.skin==='Combination'));
 const preference=a.sensitive?'Look for fragrance-free options and review the full ingredient list.':'Check the full ingredient list and follow the product label.';
 const cleanser:RoutineItem={id:'cleanser',step:'CLEANSE',name:a.skin==='Dry'?'Cream Cleanser':'Gentle Cleanser',description:a.skin==='Dry'?'A creamy cleansing texture for your dry-skin preference.':'Removes daily impurities for a fresh, clean feel.',detail:`${a.concerns.includes('Acne')?'For your acne concern, explore gentle, non-comedogenic options. ':''}${preference}`,art:[63,999,218,153]};
 const moisturizer:RoutineItem={id:'moisturizer',step:'MOISTURIZE',name:rich?'Rich Moisturizer':light?'Lightweight Moisturizer':'Daily Moisturizer',description:rich?'A comforting cream texture for your daily routine.':'A light layer of moisture for everyday comfort.',detail:`${a.concerns.includes('Dryness')?'Your dryness preference is reflected in this moisturizing step. ':''}${preference}`,art:[300,999,219,153]};
 const sunscreen:RoutineItem={id:'sunscreen',step:'PROTECT',name:'Daily Sunscreen SPF 50',description:'Finish your morning routine with sun protection.',detail:`${a.concerns.some(c=>c==='Pigmentation'||c==='Uneven tone')?'Your tone concern is noted in this daytime routine. ':''}Choose a labelled broad-spectrum sunscreen and follow its application directions. ${preference}`,art:[535,999,219,153]};
 return period==='AM'?[cleanser,moisturizer,sunscreen]:[cleanser,moisturizer];
}

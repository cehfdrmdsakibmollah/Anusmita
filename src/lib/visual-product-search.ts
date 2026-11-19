import {escapeRegex,normalise} from './chatbot';
export function visualSearchTerms(description:string):string[]{
 const stop=new Set(['the','and','with','for','this','that','product','bottle','box','label','packaging','visible','appears','looks','possibly','maybe','brand','image','photo','cosmetic','skincare','beauty','unknown','text','there','are','from','is','of','a','an','on','in','to','it','or','not','cannot','read','unreadable','serum','cream']);
 return [...new Set(normalise(description).split(/[^\p{L}\p{N}-]+/u).filter(w=>w.length>=3&&w.length<=35&&!stop.has(w)))].slice(0,16);
}
export function visualSearchFilter(terms:string[]){
 const fields=['name','brand','category','description','sku'];
 return {active:true,$or:terms.slice(0,12).flatMap(term=>fields.map(field=>({[field]:{$regex:escapeRegex(term),$options:'i'}})))};
}
export function rankVisualCandidates<T extends {name:string;brand?:string;sku?:string;category?:string}>(rows:T[],terms:string[]):(T&{matchScore:number})[]{
 return rows.map(row=>{
  const title=normalise([row.name,row.brand||'',row.sku||''].join(' '));
  const category=normalise(row.category||'');
  const score=terms.reduce((n,t)=>n+(title.includes(t)?3:category.includes(t)?1:0),0);
  return {...row,matchScore:score};
 }).filter(x=>x.matchScore>0).sort((a,b)=>b.matchScore-a.matchScore).slice(0,5);
}

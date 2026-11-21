/** Calibrated conservative shortlist policy, shared by both local search stages.
 * Similarity scores are not probabilities. Never claim a verified identity.
 */
export type ScoredCandidate={id:string;score:number};
export function choosePhotoCandidates<T extends ScoredCandidate>(
 rows:ReadonlyArray<T>, options:{minimum:number;margin:number;maxResults?:number}
):T[]{
 const sorted=rows.filter(x=>Number.isFinite(x.score)&&x.score>=0&&x.score<=1).sort((a,b)=>b.score-a.score);
 const top=sorted[0];
 if(!top||top.score<options.minimum)return [];
 // Two nearly identical top scores may mean similar staging/photo backgrounds.
 if(sorted.length>1&&top.score-sorted[1].score<options.margin)return [];
 const floor=Math.max(options.minimum,top.score-.11);
 return sorted.filter((p,i)=>i===0||p.score>=floor).slice(0,Math.min(5,options.maxResults||5));
}

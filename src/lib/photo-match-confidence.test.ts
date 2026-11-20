import {describe,it,expect} from 'vitest';
import {choosePhotoCandidates} from './photo-match-confidence';
describe('catalogue image match rejection',()=>{
 const config={minimum:.90,margin:.035};
 it('rejects unknown and low-score product images',()=>expect(choosePhotoCandidates([{id:'wrong',score:.89}],config)).toEqual([]));
 it('rejects ambiguous near-tied rankings',()=>expect(choosePhotoCandidates([{id:'a',score:.95},{id:'b',score:.94}],config)).toEqual([]));
 it('keeps the distinct exact match and caps results',()=>{
  const list=[{id:'correct',score:1},...Array.from({length:9},(_,i)=>({id:'x'+i,score:.92-i*.001}))];
  expect(choosePhotoCandidates(list,config)[0].id).toBe('correct');
  expect(choosePhotoCandidates(list,config)).toHaveLength(5);
 });
 it('ignores invalid scores',()=>expect(choosePhotoCandidates([{id:'fake',score:NaN},{id:'right',score:.98}],config).map(x=>x.id)).toEqual(['right']));
});

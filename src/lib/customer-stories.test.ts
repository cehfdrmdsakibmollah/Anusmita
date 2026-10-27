import {describe,it,expect} from 'vitest';
import {filterStories,sampleStories,validateStoryFile} from './customer-stories';
describe('customer stories preview',()=>{
 it('intersects category and format filters',()=>{
  expect(filterStories('Beauty','Video','recommended')).toHaveLength(2);
  expect(filterStories('Fashion','Video','recommended')).toHaveLength(0);
  expect(filterStories('All Stories','Photo','recommended')).toHaveLength(4);
 });
 it('sorts without mutating reference order',()=>{
  const before=sampleStories.map(s=>s.id);
  const sorted=filterStories('All Stories','All content','title');
  expect(sorted[0].title).toBe('A fragrance unboxing');
  expect(sampleStories.map(s=>s.id)).toEqual(before);
 });
 it('rejects unsupported, empty or oversized local media',()=>{
  expect(validateStoryFile({type:'image/svg+xml',size:100})).toBeTruthy();
  expect(validateStoryFile({type:'video/mp4',size:21*1024*1024})).toBeTruthy();
  expect(validateStoryFile({type:'image/png',size:0})).toBeTruthy();
  expect(validateStoryFile({type:'image/jpeg',size:1024})).toBeNull();
 });
});

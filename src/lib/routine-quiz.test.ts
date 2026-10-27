import {describe,it,expect} from 'vitest';
import {buildRoutine,initialAnswers,parseSavedRoutine,toggleConcern} from './routine-quiz';
describe('routine finder',()=>{
 it('limits concerns to two, allows removal, and does not mutate the selection',()=>{
  const selected=toggleConcern(['Acne'],'Pigmentation');
  expect(toggleConcern(selected,'Dryness')).toEqual(['Acne','Pigmentation']);
  expect(toggleConcern(selected,'Acne')).toEqual(['Pigmentation']);
  expect(selected).toEqual(['Acne','Pigmentation']);
 });
 it('changes textures for skin type and explicit preferences',()=>{
  expect(buildRoutine({...initialAnswers,skin:'Dry'},'AM')[1].name).toBe('Rich Moisturizer');
  expect(buildRoutine({...initialAnswers,skin:'Dry',texture:'Lightweight'},'AM')[1].name).toBe('Lightweight Moisturizer');
  expect(buildRoutine(initialAnswers,'AM')[1].name).toBe('Lightweight Moisturizer');
 });
 it('keeps protection in AM only',()=>{
  expect(buildRoutine(initialAnswers,'AM').map(x=>x.id)).toEqual(['cleanser','moisturizer','sunscreen']);
  expect(buildRoutine(initialAnswers,'PM').map(x=>x.id)).toEqual(['cleanser','moisturizer']);
 });
 it('reflects sensitivity and concern without prescribing treatments',()=>{
  const rows=buildRoutine({...initialAnswers,sensitive:true,concerns:['Acne','Dryness']},'PM');
  expect(rows.every(x=>x.detail.includes('fragrance-free'))).toBe(true);
  expect(rows[0].detail).toContain('acne concern');expect(rows[1].detail).toContain('dryness preference');
 });
 it('accepts valid saved answers, rejects malformed and unexpected values',()=>{
  expect(parseSavedRoutine(JSON.stringify(initialAnswers))).toEqual(initialAnswers);
  for(const raw of [null,'{','null','[]',JSON.stringify({...initialAnswers,skin:'Other'}),JSON.stringify({...initialAnswers,concerns:['Acne','Acne']}),JSON.stringify({...initialAnswers,concerns:['Acne','Pigmentation','Dryness']}),JSON.stringify({...initialAnswers,sensitive:'yes'})])expect(parseSavedRoutine(raw)).toBeNull();
 });
});

import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {allowChat,boundedJson} from './chatbot-server';
describe('chat request guards',()=>{
 it('limits bursts and expires the bucket',()=>{for(let i=0;i<20;i++)expect(allowChat('burst',1000)).toBe(true);expect(allowChat('burst',1000)).toBe(false);expect(allowChat('burst',61001)).toBe(true);});
 it('bounds streamed body bytes',async()=>{await expect(boundedJson(new Request('http://local',{method:'POST',body:'x'.repeat(100)}),50)).rejects.toMatchObject({status:413});});
 it('rejects invalid JSON',async()=>{await expect(boundedJson(new Request('http://local',{method:'POST',body:'not json'}))).rejects.toMatchObject({status:400});});
});

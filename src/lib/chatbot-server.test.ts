import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {allowChat,boundedJson,assertChatOrigin} from './chatbot-server';
describe('chat request guards',()=>{
 it('accepts the configured Netlify alias but rejects spoofed forwarded hosts',()=>{
 const request=new Request('https://deploy-id--shop.netlify.app/api/chat',{headers:{origin:'https://deploy-preview-33--shop.netlify.app'}});
 expect(()=>assertChatOrigin(request,{DEPLOY_PRIME_URL:'https://deploy-preview-33--shop.netlify.app'})).not.toThrow();
 expect(()=>assertChatOrigin(new Request('https://shop.netlify.app/api/chat',{headers:{origin:'https://evil.example','x-forwarded-host':'evil.example'}}),{})).toThrow('Cross-origin');
 });
 it('limits bursts and expires the bucket',()=>{for(let i=0;i<20;i++)expect(allowChat('burst',1000)).toBe(true);expect(allowChat('burst',1000)).toBe(false);expect(allowChat('burst',61001)).toBe(true);});
 it('bounds streamed body bytes',async()=>{await expect(boundedJson(new Request('http://local',{method:'POST',body:'x'.repeat(100)}),50)).rejects.toMatchObject({status:413});});
 it('rejects invalid JSON',async()=>{await expect(boundedJson(new Request('http://local',{method:'POST',body:'not json'}))).rejects.toMatchObject({status:400});});
});

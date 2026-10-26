import {describe,it,expect} from 'vitest';
import {photoError,MAX_PHOTO_BYTES} from './chat-attachments';
describe('product photo selection',()=>{
 it('accepts bounded raster photos',()=>{for(const type of ['image/jpeg','image/png','image/webp'])expect(photoError({size:MAX_PHOTO_BYTES,type})).toBeNull();});
 it('rejects empty or oversized images',()=>{for(const size of [0,MAX_PHOTO_BYTES+1])expect(photoError({size,type:'image/jpeg'})).toBeTruthy();});
 it('rejects SVG, documents and untyped files',()=>{for(const type of ['image/svg+xml','application/pdf','text/html',''])expect(photoError({size:100,type})).toBeTruthy();});
});

import {describe,expect,it} from 'vitest';
import {permittedClipFile} from './route';
describe('public CLIP model mirror',()=>{
 it('allows only known model config and weight filenames',()=>{
  expect(permittedClipFile('config.json')).toBe(true);
  expect(permittedClipFile('preprocessor_config.json')).toBe(true);
  expect(permittedClipFile('onnx/vision_model_quantized.onnx')).toBe(true);
 });
 it('rejects arbitrary files and traversal',()=>{
  for(const p of ['../config.json','../../.env','x/onnx/model_quantized.onnx','onnx/../../private','onnx/untrusted.onnx','index.html','foo.json'])expect(permittedClipFile(p)).toBe(false);
 });
});

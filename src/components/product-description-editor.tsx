"use client";
import {useRef} from "react";
import {Bold,Italic,Heading2,List,ListOrdered,Quote,Minus} from "lucide-react";
import RichProductDescription from "@/components/rich-product-description";
import "./product-description-editor.css";
type Props={value:string;onChange:(v:string)=>void;maxLength?:number};
export default function ProductDescriptionEditor({value,onChange,maxLength=3000}:Props){
 const input=useRef<HTMLTextAreaElement>(null);
 const format=(before:string,after="",placeholder="Text")=>{
  const node=input.current;if(!node)return;
  const start=node.selectionStart,end=node.selectionEnd;
  const existing=value.slice(start,end)||placeholder;
  const next=value.slice(0,start)+before+existing+after+value.slice(end);
  if(next.length>maxLength)return;
  onChange(next);
  requestAnimationFrame(()=>{node.focus();node.setSelectionRange(start+before.length,start+before.length+existing.length);});
 };
 const line=(prefix:string)=>{const el=input.current;if(!el)return;const start=el.selectionStart;const lineStart=value.lastIndexOf("\n",Math.max(0,start-1))+1;const next=value.slice(0,lineStart)+prefix+value.slice(lineStart);if(next.length<=maxLength){onChange(next);requestAnimationFrame(()=>{el.focus();el.setSelectionRange(start+prefix.length,start+prefix.length);});}};
 return <div className="anRichProductEditor">
  <div className="anRichToolbar" role="toolbar" aria-label="Description formatting">
   <button type="button" title="Heading" aria-label="Heading" onClick={()=>line("## ")}><Heading2 size={16}/></button>
   <button type="button" title="Bold" aria-label="Bold" onClick={()=>format("**","**","Bold text")}><Bold size={16}/></button>
   <button type="button" title="Italic" aria-label="Italic" onClick={()=>format("*","*","Italic text")}><Italic size={16}/></button>
   <button type="button" title="Bulleted list" aria-label="Bulleted list" onClick={()=>line("- ")}><List size={16}/></button>
   <button type="button" title="Numbered list" aria-label="Numbered list" onClick={()=>line("1. ")}><ListOrdered size={16}/></button>
   <button type="button" title="Quote" aria-label="Quote" onClick={()=>line("> ")}><Quote size={16}/></button>
   <button type="button" title="Divider" aria-label="Divider" onClick={()=>{if(value.length+5<=maxLength)onChange(value+"\n---\n");}}><Minus size={16}/></button>
  </div>
  <textarea ref={input} rows={9} maxLength={maxLength} value={value} onChange={e=>onChange(e.target.value)} placeholder={"## Main heading\n\nWrite the paragraph here.\n\n- Feature one\n- Feature two\n\n**Important detail**"}/>
  <div className="anRichMeta"><span>Supports headings, bold, italic, bullet / numbered lists and quotes · Existing plain text is preserved</span><span>{value.length}/{maxLength}</span></div>
  <details className="anRichPreview"><summary>Preview formatted description</summary><RichProductDescription text={value} /></details>
 </div>;
}

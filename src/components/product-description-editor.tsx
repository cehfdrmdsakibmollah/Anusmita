"use client";
import {useRef} from "react";
import {Bold,Italic,Underline,Heading1,Heading2,Heading3,List,ListOrdered,Quote,Minus} from "lucide-react";
import RichProductDescription from "@/components/rich-product-description";
import "./product-description-editor.css";
type Props={value:string;onChange:(v:string)=>void;maxLength?:number};
export default function ProductDescriptionEditor({value,onChange,maxLength=3000}:Props){
 const input=useRef<HTMLTextAreaElement>(null);
 const commit=(next:string,selectionStart:number,selectionEnd:number)=>{
  if(next.length>maxLength)return;
  onChange(next);
  requestAnimationFrame(()=>{const el=input.current;if(!el)return;el.focus();el.setSelectionRange(selectionStart,selectionEnd);});
 };
 function wrap(left:string,right:string,placeholder:string){
  const el=input.current;if(!el)return;
  const start=el.selectionStart,end=el.selectionEnd,selected=value.slice(start,end);
  // For repeated action on a selected formatted span, remove the markup.
  if(selected.startsWith(left)&&selected.endsWith(right)&&selected.length>left.length+right.length){
   const plain=selected.slice(left.length,selected.length-right.length);
   commit(value.slice(0,start)+plain+value.slice(end),start,start+plain.length);return;
  }
  const text=selected||placeholder;
  const next=value.slice(0,start)+left+text+right+value.slice(end);
  commit(next,start+left.length,start+left.length+text.length);
 }
 function prefixLines(prefix:string){
  const el=input.current;if(!el)return;
  const start=el.selectionStart,end=el.selectionEnd;
  const begin=value.lastIndexOf("\n",Math.max(0,start-1))+1;
  const finish= value.indexOf("\n",end);
  const stop=finish===-1?value.length:finish;
  const segment=value.slice(begin,stop);
  const lines=segment.split("\n").map(line=>{
   const bare=line.replace(/^(?:#{1,3}\s+|[-*]\s+|\d+\.\s+|>\s+)/,"");
   return prefix+bare;
  }).join("\n");
  const next=value.slice(0,begin)+lines+value.slice(stop);
  commit(next,begin+prefix.length,begin+lines.length);
 }
 function onKeyDown(e:React.KeyboardEvent<HTMLTextAreaElement>){
  if((e.ctrlKey||e.metaKey)&&!e.altKey){
   const key=e.key.toLowerCase();
   if(key==="b"){e.preventDefault();wrap("**","**","bold text");}
   if(key==="i"){e.preventDefault();wrap("*","*","italic text");}
   if(key==="u"){e.preventDefault();wrap("++","++","underlined text");}
  }
 }
 return <div className="anRichProductEditor">
  <div className="anRichToolbar" role="toolbar" aria-label="Description formatting">
   <button type="button" aria-label="Heading 1" title="Heading 1" onClick={()=>prefixLines("# ")}><Heading1 size={17}/></button>
   <button type="button" aria-label="Heading 2" title="Heading 2" onClick={()=>prefixLines("## ")}><Heading2 size={17}/></button>
   <button type="button" aria-label="Heading 3" title="Heading 3" onClick={()=>prefixLines("### ")}><Heading3 size={17}/></button>
   <span className="anRichToolbarDivider" aria-hidden="true"/>
   <button type="button" aria-label="Bold (Ctrl+B)" title="Bold (Ctrl+B)" onClick={()=>wrap("**","**","bold text")}><Bold size={17}/></button>
   <button type="button" aria-label="Italic (Ctrl+I)" title="Italic (Ctrl+I)" onClick={()=>wrap("*","*","italic text")}><Italic size={17}/></button>
   <button type="button" aria-label="Underline (Ctrl+U)" title="Underline (Ctrl+U)" onClick={()=>wrap("++","++","underlined text")}><Underline size={17}/></button>
   <span className="anRichToolbarDivider" aria-hidden="true"/>
   <button type="button" aria-label="Bullet list" title="Bullet list" onClick={()=>prefixLines("- ")}><List size={17}/></button>
   <button type="button" aria-label="Numbered list" title="Numbered list" onClick={()=>prefixLines("1. ")}><ListOrdered size={17}/></button>
   <button type="button" aria-label="Quote" title="Quote" onClick={()=>prefixLines("> ")}><Quote size={17}/></button>
   <button type="button" aria-label="Divider" title="Horizontal divider" onClick={()=>{const el=input.current;if(!el)return;const start=el.selectionStart;commit(value.slice(0,start)+"\n---\n"+value.slice(start),start+5,start+5);}}><Minus size={17}/></button>
  </div>
  <textarea ref={input} aria-label="Product description editor" rows={8} maxLength={maxLength} value={value} onKeyDown={onKeyDown} onChange={e=>onChange(e.target.value)} placeholder={"# Product name\n\nDescribe verified product information here.\n\n## Benefits\n- Benefit one\n- Benefit two\n\n**Bold** and ++underlined++ text"}/>
  <div className="anRichMeta"><span>Select text then click a format button, or use Ctrl+B / Ctrl+I / Ctrl+U (⌘ on Mac)</span><span>{value.length}/{maxLength}</span></div>
  <div className="anRichLivePreview"><strong>Live formatted preview</strong><div className="anRichLiveContent">{value.trim()?<RichProductDescription text={value}/>:<p>Formatted product description will appear here as you type.</p>}</div></div>
 </div>;
}

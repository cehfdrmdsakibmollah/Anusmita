import type {ReactNode} from "react";
import "./rich-product-description.css";
function formatInline(value:string):ReactNode[]{
 const pieces=value.split(/(\*\*[^*\n]+\*\*|\+\+[^+\n]+\+\+|\*[^*\n]+\*)/g);
 return pieces.map((part,i)=>part.startsWith("**")&&part.endsWith("**")?<strong key={i}>{part.slice(2,-2)}</strong>:part.startsWith("++")&&part.endsWith("++")?<u key={i}>{part.slice(2,-2)}</u>:part.startsWith("*")&&part.endsWith("*")?<em key={i}>{part.slice(1,-1)}</em>:part);
}
type Token={kind:"heading"|"paragraph"|"quote"|"bullet"|"number"|"divider";value:string;level?:1|2|3};
export function parseProductDescription(text:string):Token[]{
 const tokens:Token[]=[];
 for(const original of text.replace(/\r\n/g,"\n").split("\n")){
  const line=original.trim();
  if(!line)continue;
  if(line==="---"){tokens.push({kind:"divider",value:""});continue;}
  if(/^#{1,3}\s+/.test(line)){tokens.push({kind:"heading",value:line.replace(/^#{1,3}\s+/,""),level:Math.min(3,line.match(/^#+/)?.[0].length||2) as 1|2|3});continue;}
  if(/^>\s+/.test(line)){tokens.push({kind:"quote",value:line.replace(/^>\s+/,"")});continue;}
  if(/^[-*]\s+/.test(line)){tokens.push({kind:"bullet",value:line.replace(/^[-*]\s+/,"")});continue;}
  if(/^\d+\.\s+/.test(line)){tokens.push({kind:"number",value:line.replace(/^\d+\.\s+/,"")});continue;}
  tokens.push({kind:"paragraph",value:line});
 }
 return tokens.slice(0,180);
}
export default function RichProductDescription({text}:{text:string}){
 const parts=parseProductDescription(text||"");
 if(!parts.length)return null;
 const nodes:ReactNode[]=[];let cursor=0;
 while(cursor<parts.length){
  const item=parts[cursor];
  if(item.kind==="bullet"||item.kind==="number"){
   const kind=item.kind,group:Token[]=[];
   while(cursor<parts.length&&parts[cursor].kind===kind)group.push(parts[cursor++]);
   const children=group.map((entry,i)=><li key={i}>{formatInline(entry.value)}</li>);
   nodes.push(kind==="bullet"?<ul key={"list"+cursor}>{children}</ul>:<ol key={"list"+cursor}>{children}</ol>);
   continue;
  }
  const key=cursor++;
  if(item.kind==="heading")nodes.push(item.level===1?<h2 key={key}>{formatInline(item.value)}</h2>:item.level===3?<h4 key={key}>{formatInline(item.value)}</h4>:<h3 key={key}>{formatInline(item.value)}</h3>);
  else if(item.kind==="quote")nodes.push(<blockquote key={key}>{formatInline(item.value)}</blockquote>);
  else if(item.kind==="divider")nodes.push(<hr key={key}/>);
  else nodes.push(<p key={key}>{formatInline(item.value)}</p>);
 }
 return <div className="anRichProductDescription">{nodes}</div>;
}

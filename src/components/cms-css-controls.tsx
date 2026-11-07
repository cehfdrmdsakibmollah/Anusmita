"use client";
import {cmsCssProperties,cmsCssTargets,cmsCssStates,safeCmsCssValue,type CmsCssRule} from "@/lib/cms-css-rules";
const defaults:Record<string,string>={
 width:"100%",height:"auto","min-height":"180px","max-width":"100%",
 "font-size":"28px","font-weight":"700","line-height":"1.4",
 "letter-spacing":"0px",color:"#611b37","background-color":"#fff6f9",
 border:"1px solid #e8c8d5","border-radius":"12px","box-shadow":"0 8px 24px #e8c8d5",
 padding:"20px",margin:"0px",opacity:"1",transform:"scale(1)",
 transition:"all 200ms ease",gap:"12px","object-fit":"cover"
};
export default function CmsCssControls({rules,onChange,disabled=false,preferredTarget="hero"}:{rules:CmsCssRule[];onChange:(rules:CmsCssRule[])=>void;disabled?:boolean;preferredTarget?:CmsCssRule["target"]}){
 function add(){
  if(disabled||rules.length>=32)return;
  onChange([...rules,{target:preferredTarget,state:"normal",property:"border-radius",value:"12px"}]);
 }
 function patch(index:number,changes:Partial<CmsCssRule>){
  if(disabled)return;
  onChange(rules.map((item,i)=>i===index?{...item,...changes}:item));
 }
 return <div className="cse-rule-manager">
  <h4>Scoped Custom CSS · Visual Controls</h4>
  <p className="cse-muted">Select exactly what to style. Rules apply to this page/section only, including hover effects. Unsafe values and external CSS are blocked.</p>
  {rules.map((rule,index)=><div className="cse-rule-row" key={index}>
   <div className="cse-rule-pair">
    <label>Element<select disabled={disabled} value={rule.target} onChange={e=>patch(index,{target:e.target.value as CmsCssRule["target"]})}>{cmsCssTargets.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
    <label>State<select disabled={disabled} value={rule.state} onChange={e=>patch(index,{state:e.target.value as CmsCssRule["state"]})}>{cmsCssStates.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
   </div>
   <div className="cse-rule-pair">
    <label>CSS property<select disabled={disabled} value={rule.property} onChange={e=>{const property=e.target.value as CmsCssRule["property"];patch(index,{property,value:defaults[property]});}}>{cmsCssProperties.map(v=><option key={v} value={v}>{v}</option>)}</select></label>
    <label>Value<input disabled={disabled} aria-invalid={!safeCmsCssValue(rule.property,rule.value)} value={rule.value} maxLength={95} spellCheck={false} placeholder={defaults[rule.property]} onChange={e=>patch(index,{value:e.target.value})}/></label>
   </div>
   <div className="cse-rule-actions"><code>{rule.target}{rule.state==="hover"?":hover":""} {"{"}{rule.property}: {rule.value}{"}"}</code><button type="button" disabled={disabled} onClick={()=>onChange(rules.filter((_,i)=>i!==index))}>Remove</button></div>
   {!safeCmsCssValue(rule.property,rule.value)&&<small role="alert">Enter a safe CSS value before saving.</small>}
  </div>)}
  <button type="button" onClick={add} disabled={disabled||rules.length>=32}>+ Add CSS property ({rules.length}/32)</button>
  <p className="cse-muted">Examples: width 100%, height 280px, font-weight 700, box-shadow 0 8px 24px #e8c8d5, transform scale(1.03), transition all 200ms ease.</p>
 </div>;
}


import {Box,ClipboardList,Droplets,Leaf,PackageCheck} from "lucide-react";
type ProductFacts={
 description?:string;ingredients?:string;usageInstructions?:string;
 topNotes?:string;heartNotes?:string;baseNotes?:string;
 brand?:string;origin?:string;size?:string;category:string;sku?:string;
};
export default function ProductDetailsAccordion({product}:{product:ProductFacts}){
 const notes=[["Top notes",product.topNotes],["Heart notes",product.heartNotes],["Base notes",product.baseNotes]]
  .filter((v):v is [string,string]=>Boolean(v[1]?.trim()));
 return <div className="anPdpInfoGrid">
  <article className="anPdpInfoStory">
   <span className="anPdpInfoEyebrow">THE ANUSMITA EDIT</span>
   <h2>A little luxury,<br/><em>every day.</em></h2>
   <p>Discover pieces that feel beautifully you. Genuine product specifications are added by the ANUSMITA team.</p>
   <span className="anPdpInfoSig">ANUSMITA ✦</span>
  </article>
  <article className="anPdpInfoPanel">
   <h2><Droplets size={22}/> {notes.length?"Fragrance notes":"Product at a glance"}</h2>
   {notes.length?notes.map(([title,value])=><div className="anPdpNoteRow" key={title}><span><Leaf size={18}/></span><div><strong>{title}</strong><p>{value}</p></div></div>):
    <div className="anPdpFacts">
     <p><strong>Category</strong><span>{product.category}</span></p>
     {product.brand&&<p><strong>Brand</strong><span>{product.brand}</span></p>}
     {product.size&&<p><strong>Size</strong><span>{product.size}</span></p>}
     {product.origin&&<p><strong>Origin</strong><span>{product.origin}</span></p>}
    </div>}
  </article>
  <article className="anPdpInfoPanel">
   <h2><PackageCheck size={22}/> Product highlights</h2>
   <div className="anPdpHighlights">
    {product.brand&&<p><Box size={22}/><span><strong>{product.brand}</strong><small>Listed brand</small></span></p>}
    {product.size&&<p><Droplets size={22}/><span><strong>{product.size}</strong><small>Selected size</small></span></p>}
    {product.origin&&<p><Leaf size={22}/><span><strong>{product.origin}</strong><small>Product origin as listed</small></span></p>}
    {product.sku&&<p><ClipboardList size={22}/><span><strong>{product.sku}</strong><small>Product SKU</small></span></p>}
    {!product.brand&&!product.size&&!product.origin&&!product.sku&&<p>Product information will be added by the team.</p>}
   </div>
  </article>
  <article className="anPdpInfoPanel anPdpAccordions">
   <h2>Product details</h2>
   <details open><summary>Description</summary><p>{product.description||"Detailed product information is being prepared."}</p></details>
   {product.ingredients&&<details><summary>Ingredients / materials</summary><p>{product.ingredients}</p></details>}
   {product.usageInstructions&&<details><summary>How to use</summary><p>{product.usageInstructions}</p></details>}
   <details><summary>Shipping & delivery</summary><p>Delivery coverage, timing and charges are confirmed during checkout or with ANUSMITA support. No free-shipping promise applies unless separately confirmed.</p></details>
   <details><summary>Returns & refunds</summary><p>Contact ANUSMITA to confirm the applicable return policy and product eligibility before ordering.</p></details>
  </article>
 </div>;
}

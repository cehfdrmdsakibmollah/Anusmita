'use client';
import {useState} from 'react';
import Link from 'next/link';
import ProductImageGallery from './product-image-gallery';
import {assistantHref,categoryLabels} from '@/lib/product-experience';
export const previewCategories=['Perfumes','Skincare','Makeup','Fashion','Shoes','Jewellery','Bags','Watches','Bed Sheets','Mobile Accessories'];
const layouts:Record<string,{image:string;sizes:string[];colours:string[];fields:string[]}>={
 Skincare:{image:'skincare',sizes:['30ml','50ml','100ml'],colours:[],fields:['Ingredients','Published benefits','Labelled skin types','How to use']},
 Makeup:{image:'beauty',sizes:['Standard'],colours:['Rose','Nude','Berry'],fields:['Shade description','Finish','Ingredients','How to use']},
 Fashion:{image:'fashion',sizes:['S','M','L','XL'],colours:['Ivory','Rose','Navy'],fields:['Fabric','Size guide & measurements','Care instructions']},
 Shoes:{image:'fashion',sizes:['EU 36','EU 37','EU 38','EU 39'],colours:['Ivory','Black'],fields:['Material','Foot measurements / brand size chart','Care instructions']},
 Jewellery:{image:'beauty',sizes:['6','7','8'],colours:['Gold','Silver','Rose gold'],fields:['Metal / plating','Ring measurements','Care instructions','Warranty terms']},
 Bags:{image:'bags',sizes:['Small','Medium'],colours:['Ivory','Black'],fields:['Material','Dimensions / capacity','Strap details','Care instructions']},
 Watches:{image:'watches',sizes:['Standard'],colours:['Gold','Silver'],fields:['Case / strap material','Dimensions','Warranty terms']},
 'Bed Sheets':{image:'bed-sheets',sizes:['Single','Double','King'],colours:['Rose','Ivory'],fields:['Fabric','Set contents & dimensions','Care instructions']},
 'Mobile Accessories':{image:'mobile-accessories',sizes:['Model A','Model B'],colours:['Black','Ivory'],fields:['Compatible devices','Dimensions','Material','Warranty terms']}
};
export default function CategoryProductPreview({category}:{category:string}){
 const config=layouts[category]||layouts.Skincare;
 const [size,setSize]=useState(config.sizes[0]),[colour,setColour]=useState(config.colours[0]||'');
 return <section className="pd-category-demo" aria-label={category+' product layout'}><p className="pd-demo-note">Category layout preview · Editorial imagery and example options, not a published product. Real prices, stock and specifications appear only after publication.</p><div className="pd-demo-grid"><ProductImageGallery urls={['/brand/categories/'+config.image+'.webp']} name={category+' collection artwork'} preview/><div><span className="pd-eyebrow">ANUSMITA / {category.toUpperCase()}</span><h1>{categoryLabels(category).story}</h1><p className="pd-demo-lead">Every detail, thoughtfully considered. Explore how {category.toLowerCase()} options will appear in the ANUSMITA collection.</p><p className="pd-demo-price">Price shown on published products</p>{config.colours.length>0&&<fieldset><legend>Colour / shade: {colour}</legend><div>{config.colours.map(c=><button type="button" key={c} aria-pressed={colour===c} onClick={()=>setColour(c)}>{c}</button>)}</div></fieldset>}<fieldset><legend>{categoryLabels(category).size}: {size}</legend><div>{config.sizes.map(s=><button type="button" key={s} aria-pressed={size===s} onClick={()=>setSize(s)}>{s}</button>)}</div></fieldset><p className="pd-demo-selection" role="status">Selected layout option: {[colour,size].filter(Boolean).join(' · ')}<small>Example selection · no stock or price implied</small></p><div className="pd-help"><Link href={assistantHref(category)}>Ask ANUSMITA about {category.toLowerCase()} →</Link><Link href={'/shop?category='+encodeURIComponent(category)+'#shop'}>Browse published collection →</Link></div></div></div><div className="pd-demo-facts">{config.fields.map(f=><details key={f}><summary>{f}</summary><p>This section displays the product’s published {f.toLowerCase()}. The ANUSMITA team can update it from the product dashboard; no sample specification is presented as a product fact.</p></details>)}</div></section>;
}

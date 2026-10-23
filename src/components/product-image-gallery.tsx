
"use client";
import {useState} from "react";
export default function ProductImageGallery({urls,name}:{urls:string[];name:string}){
 const [index,setIndex]=useState(0),[broken,setBroken]=useState<string[]>([]);
 const image=urls[index]||"";
 return <div className="pictures">
  <div className="detailMedia">{!image||broken.includes(image)?<div className="galleryError">✧ Image unavailable — contact ANUSMITA for photos</div>:<img src={image} alt={name+" – photo "+(index+1)} loading="eager" onError={()=>setBroken(old=>[...old,image])}/>}</div>
  {urls.length>1&&<div className="galleryThumbs" aria-label="Product photo gallery">{urls.map((url,i)=><button key={url+"-"+i} type="button" className={i===index?"active":""} aria-label={"View photo "+(i+1)} aria-pressed={i===index} onClick={()=>setIndex(i)}><img src={url} alt="" loading="lazy"/></button>)}</div>}
 </div>;
}

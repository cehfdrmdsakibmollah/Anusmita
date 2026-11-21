'use client';
import {useState} from 'react';
import {Share2,Download} from 'lucide-react';
import type {ChatPhoto} from '@/lib/chat-attachments';
import {contact} from '@/lib/information-preview';
export default function ChatPhotos({photos,bn}:{photos:ChatPhoto[];bn:boolean}){
 const [notice,setNotice]=useState('');
 async function share(){
  const files=photos.map(p=>p.file);
  if(!navigator.canShare?.({files})||!navigator.share){setNotice(bn?'এই browser-এ photo sharing নেই। ছবি download করে WhatsApp chat-এ attach করুন।':'Photo sharing is unavailable in this browser. Download the photos and attach them in WhatsApp.');return;}
  try{await navigator.share({files,title:'ANUSMITA product enquiry',text:'Hello ANUSMITA, can you help me find this product?'});setNotice(bn?'Share window বন্ধ হয়েছে। নির্বাচিত app-এ পাঠানো হয়েছে কি না দেখুন।':'Share window closed. Check the selected app to confirm delivery.');}
  catch(e){if(!(e instanceof Error&&e.name==='AbortError'))setNotice(bn?'ছবি download করে WhatsApp-এ attach করুন।':'Download the photos and attach them in WhatsApp.');}
 }
 return <div className="aa-photos"><div className="aa-photo-grid">{photos.map((p,i)=><figure key={p.id}><a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={'View product photo '+(i+1)}><img src={p.url} alt={'Attached product photo '+(i+1)} width={160} height={160}/></a><a download={p.file.name} href={p.url}><Download size={13}/>{bn?'ডাউনলোড':'Download'}</a></figure>)}</div><p className="aa-photo-note">{bn?'প্রথম ছবিটি আপনার browser-এ ANUSMITA catalogue ছবির সঙ্গে মিলিয়ে দেখা হয়। সার্ভারে AI upload করা হয় না। ফল নিশ্চিত product recognition নয়।':'The first photo is compared locally with ANUSMITA catalogue pictures. No image is sent to an AI server. A similar image is not verified product identification.'}</p><div className="aa-photo-actions"><button type="button" onClick={()=>void share()}><Share2 size={14}/>{bn?'ছবি share করুন':'Share photos'}</button><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div><small>{bn?'Share menu-তে WhatsApp ও ANUSMITA contact বেছে নিন: +880 1310-339192। Link দিয়ে ছবি নিজে থেকে attach হয় না।':'Choose WhatsApp and ANUSMITA: +880 1310-339192. Opening the link does not attach photos automatically.'}</small>{notice&&<p role="status">{notice}</p>}</div>;
}

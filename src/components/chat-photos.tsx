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
 return <div className="aa-photos"><div className="aa-photo-grid">{photos.map((p,i)=><figure key={p.id}><a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={'View product photo '+(i+1)}><img src={p.url} alt={'Attached product photo '+(i+1)} width={160} height={160}/></a><a download={p.file.name} href={p.url}><Download size={13}/>{bn?'ডাউনলোড':'Download'}</a></figure>)}</div><p className="aa-photo-note">{bn?'ছবির প্রথমটি Cloudflare AI-এর মাধ্যমে শনাক্ত করার চেষ্টা করা হয়েছে। মিল পাওয়া গেলে নিচে সম্ভাব্য catalogue পণ্য দেখাবে; প্রয়োজন হলে টিমকে ছবি share করুন।':'The first photo was submitted for Cloudflare AI matching. Possible catalogue matches appear below when available; you can still share photos with our team.'}</p><div className="aa-photo-actions"><button type="button" onClick={()=>void share()}><Share2 size={14}/>{bn?'ছবি share করুন':'Share photos'}</button><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div><small>{bn?'Share menu-তে WhatsApp ও ANUSMITA contact বেছে নিন: +880 1310-339192। Link দিয়ে ছবি নিজে থেকে attach হয় না।':'Choose WhatsApp and ANUSMITA: +880 1310-339192. Opening the link does not attach photos automatically.'}</small>{notice&&<p role="status">{notice}</p>}</div>;
}

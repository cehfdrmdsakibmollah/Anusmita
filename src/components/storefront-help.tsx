'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
export default function StorefrontHelp({embedded=false}:{embedded?:boolean}){
 const path=usePathname();
 if(!embedded&&(path.endsWith('/design-preview')||path==='/deals'||path==='/bundles'||path==='/routine-quiz'||path==='/track-order'||path==='/customer-stories'||path==='/gift-cards'||path==='/pre-orders'))return null;
 if(path.startsWith('/admin')||path.startsWith('/invoice')||path.startsWith('/contact'))return null;
 return <aside className="an-help-strip" aria-label="ANUSMITA shopping help"><div><span>PERSONAL TOUCH, EVERY STEP</span><h2>A little help choosing?</h2><p>Product options, sizes or your next favourite—ask ANUSMITA.</p></div><Link href="/contact/design-preview#assistant-title">Ask ANUSMITA <span aria-hidden="true">↗</span></Link></aside>;
}

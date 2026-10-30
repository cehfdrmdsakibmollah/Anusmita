'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useRef} from 'react';
import {Menu,ArrowUpRight} from 'lucide-react';
const primary=[['Home','/'],['Shop','/shop'],['Bundles','/bundles'],['Deals','/deals'],['Journal','/journal/design-preview'],['Contact','/contact/design-preview']];
const more=[['Routine Finder','/routine-quiz'],['Pre-orders','/pre-orders'],['Gift Cards','/gift-cards'],['Customer Stories','/customer-stories'],['Track Order','/track-order'],['About ANUSMITA','/about/design-preview'],['My Account (preview)','/account/design-preview'],['Wishlist','/wishlist'],['Cart','/cart'],['Order request','/checkout']];
export default function StoreNavigation({mobile=false}:{mobile?:boolean}){
 const path=usePathname();const details=useRef<HTMLDetailsElement>(null);
 const close=()=>{if(details.current)details.current.open=false;};
 const escape=(e:React.KeyboardEvent)=>{if(e.key==='Escape'){close();details.current?.querySelector('summary')?.focus();}};
 const links=(items:string[][])=>items.map(([label,href])=><Link key={href} href={href} className={path===href?'active':undefined} aria-current={path===href?'page':undefined} onClick={close}>{label}{mobile&&<ArrowUpRight size={14}/>}</Link>);
 if(mobile)return <details ref={details} className="anMobileNav" onKeyDown={escape}><summary aria-label="Open navigation menu"><Menu size={24}/></summary><nav aria-label="Mobile navigation">{links([...primary,...more])}</nav></details>;
 return <nav className="anDesktopNav" aria-label="Main navigation">{links(primary)}<details ref={details} className="anNavMore" onKeyDown={escape}><summary>Explore</summary><div>{links(more)}</div></details></nav>;
}

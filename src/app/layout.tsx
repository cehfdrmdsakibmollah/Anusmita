
import type { Metadata } from "next";
import Link from "next/link";
import {ArrowUpRight, Instagram, Search, UserRound, Menu} from "lucide-react";
import {checkoutEnabled} from "@/lib/launch-config";
import "./globals.css";
export const metadata: Metadata = {
 title:{default:"ANUSMITA | Fashion · Jewellery · Beauty",template:"%s | ANUSMITA"},
 description:"Discover the ANUSMITA edit of fashion, jewellery, beauty and accessories, curated for Bangladesh.",
 robots:{index:checkoutEnabled(process.env),follow:checkoutEnabled(process.env)},
 alternates:{canonical:"/"},
 metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),
 openGraph:{type:"website",title:"ANUSMITA",description:"Fashion · Jewellery · Beauty",siteName:"ANUSMITA"}
};
const nav=[{href:"/#collections",label:"Collections"},
 {href:"/?category=Beauty#shop",label:"Beauty"},
 {href:"/?category=Jewellery#shop",label:"Jewellery"},
 {href:"/?category=Fashion#shop",label:"Fashion"},
 {href:"/#our-story",label:"Our Story"}];
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>
  <div className="announcement luxAnnouncement"><span className="luxAnnouncementSide">THE ANUSMITA EDIT</span><span>FASHION <b>✦</b> JEWELLERY <b>✦</b> BEAUTY</span><span className="luxAnnouncementSide">CURATED FOR BANGLADESH</span></div>
  <header className="siteHeader luxHeader">
   <div className="luxHeaderInner">
    <Link className="wordmark luxWordmark" href="/" aria-label="ANUSMITA home">
     <img className="navLogo" src="/brand/anusmita-logo.webp" alt="ANUSMITA emblem" width={58} height={58}/>
     <span className="luxWordText">ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></span>
    </Link>
    <nav className="luxDesktopNav" aria-label="Store navigation">
     {nav.map(item=><Link href={item.href} key={item.href}>{item.label}</Link>)}
    </nav>
    <div className="luxHeaderTools">
     <a className="luxHeaderTool" href="/#shop" aria-label="Search collections"><Search size={20} strokeWidth={1.6}/></a>
     <Link className="luxHeaderTool" href="/admin/login" aria-label="Staff login"><UserRound size={19} strokeWidth={1.6}/></Link>
     <details className="luxMobileMenu"><summary aria-label="Open navigation menu"><Menu size={23} strokeWidth={1.5}/></summary>
      <nav aria-label="Mobile navigation">{nav.map(item=><Link key={item.href} href={item.href}>{item.label}<ArrowUpRight size={15}/></Link>)}
       <Link href="/admin/login">Staff portal <ArrowUpRight size={15}/></Link></nav>
     </details>
    </div>
   </div>
  </header>
  <main>{children}</main>
  <footer className="siteFooter luxFooter">
   <div className="luxFooterTop">
    <div className="luxFooterBrand"><Link href="/">ANUSMITA</Link><p>FASHION · JEWELLERY · BEAUTY</p><span>A curated world, made for the everyday.</span></div>
    <div className="luxFooterLinks"><strong>EXPLORE</strong><Link href="/#collections">All collections</Link><Link href="/?category=Beauty#shop">Beauty</Link><Link href="/?category=Jewellery#shop">Jewellery</Link><Link href="/?category=Fashion#shop">Fashion</Link></div>
    <div className="luxFooterLinks"><strong>ANUSMITA</strong><Link href="/#our-story">Our story</Link><Link href="/#shop">The latest edit</Link><Link href="/admin/login">Team portal</Link></div>
    <div className="luxFooterAside"><span>MADE FOR THE MOMENTS THAT MATTER</span><p>Little things. Lovely feelings.</p><a href="/#collections">Explore the edit <ArrowUpRight size={17}/></a></div>
   </div>
   <div className="luxFooterBottom"><span>© {new Date().getFullYear()} ANUSMITA. All rights reserved.</span><span>Thoughtfully curated for Bangladesh</span></div>
  </footer>
 </body></html>;
}

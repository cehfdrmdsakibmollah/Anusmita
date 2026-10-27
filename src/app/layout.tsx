
import type {Metadata} from "next";
import Link from "next/link";
import {ArrowUpRight,Heart,Search,UserRound,Menu} from "lucide-react";
import {checkoutEnabled} from "@/lib/launch-config";
import "./globals.css";
import "./storefront-polish.css";
import StorefrontHelp from "@/components/storefront-help";
export const metadata:Metadata={
 title:{default:"ANUSMITA | Fashion · Jewellery · Beauty",template:"%s | ANUSMITA"},
 description:"Discover ANUSMITA's curated collection of beauty, skincare, fashion, jewellery, watches, bags, perfume, home and everyday accessories in Bangladesh.",
 robots:{index:checkoutEnabled(process.env),follow:checkoutEnabled(process.env)},
 alternates:{canonical:"/"},
 metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),
 openGraph:{type:"website",title:"ANUSMITA",description:"Beauty · Fashion · Lifestyle",siteName:"ANUSMITA"}
};
const nav=[
 {label:"Home",href:"/"},
 {label:"Shop",href:"/#shop"},
 {label:"Deals",href:"/deals"},
 {label:"Bundles",href:"/bundles"},
 {label:"Beauty",href:"/?category=Beauty#shop"},
 {label:"Fashion",href:"/?category=Fashion#shop"},
 {label:"Home Decor",href:"/?category=Bed%20Sheets#shop"},
 {label:"Accessories",href:"/?category=Mobile%20Accessories#shop"},
 {label:"Watches",href:"/?category=Watches#shop"},
 {label:"Perfumes",href:"/?category=Perfumes#shop"},
 {label:"Bags",href:"/?category=Bags#shop"},
 {label:"Customer Stories",href:"/customer-stories"},
 {label:"Track Order",href:"/track-order"},
 {label:"Routine Finder",href:"/routine-quiz"},
 {label:"Skincare",href:"/?category=Skincare#shop"}
];
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body className="anBody">
  <div className="anAnnouncement"><span>✿</span> Discover the ANUSMITA edit <i>✦</i> Beauty, Fashion & Lifestyle <i>✦</i> Curated for Bangladesh</div>
  <header className="anHeader"><div className="anWide anHeaderInner">
   <Link href="/" className="anLogo" aria-label="ANUSMITA homepage">
    <img src="/brand/anusmita-logo.webp" alt="" width={55} height={55}/>
    <span>ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></span>
   </Link>
   <nav className="anDesktopNav" aria-label="Main navigation">
    {nav.slice(0,6).map((item,i)=><Link className={i===0?"active":""} key={item.href} href={item.href}>{item.label}</Link>)}
    <details className="anNavMore"><summary>More</summary><div>{nav.slice(6).map(x=><Link href={x.href} key={x.href}>{x.label}</Link>)}<Link href="/#offers">Featured offers</Link></div></details>
   </nav>
   <form className="anHeaderSearch" action="/" method="get" role="search">
    <input type="search" name="q" aria-label="Search products" placeholder="Search for products…"/>
    <button type="submit" aria-label="Submit product search"><Search size={17}/></button>
   </form>
   <div className="anHeaderTools">
    <a href="/#store-search" aria-label="Search the collection"><Search size={20}/></a>
    <Link href="/admin/login" aria-label="Staff portal"><UserRound size={19}/></Link>
    <a href="/#shop" aria-label="Browse collection"><Heart size={19}/></a>
    <details className="anMobileNav"><summary aria-label="Open menu"><Menu size={24}/></summary>
      <nav>{nav.map(x=><Link href={x.href} key={x.href}>{x.label}<ArrowUpRight size={14}/></Link>)}
       <Link href="/admin/login">Admin Portal <ArrowUpRight size={14}/></Link></nav></details>
   </div>
  </div></header>
  <main>{children}<StorefrontHelp/></main>
  <footer className="anFooter">
   <div className="anWide"><div className="anFooterTop">
    <div className="anFooterBrand"><Link href="/" className="anFooterLogo">ANUSMITA</Link><p>FASHION · JEWELLERY · BEAUTY</p>
     <small>Your favourite discoveries, beautifully brought together for Bangladesh.</small></div>
    <div className="anFooterLinks"><strong>DISCOVER</strong><Link href="/#shop">All products</Link>
     <Link href="/?category=Beauty#shop">Beauty & skincare</Link><Link href="/?category=Fashion#shop">Fashion</Link>
     <Link href="/?category=Watches#shop">Watches</Link><Link href="/?category=Bags#shop">Bags</Link></div>
    <div className="anFooterLinks"><strong>COLLECTIONS</strong><Link href="/?category=Perfumes#shop">Perfumes</Link>
     <Link href="/?category=Mobile%20Accessories#shop">Mobile accessories</Link>
     <Link href="/?category=Bed%20Sheets#shop">Bed sheets</Link><Link href="/#collections">Explore all</Link></div>
    <div className="anFooterLinks"><strong>ANUSMITA</strong><Link href="/about/design-preview">Our story</Link><Link href="/contact/design-preview">Contact & assistance</Link><Link href="/journal/design-preview">Beauty Journal</Link>
     <Link href="/shipping/design-preview">Shipping & Delivery</Link><Link href="/returns/design-preview">Returns & Refunds</Link><Link href="/faq/design-preview">FAQ</Link><Link href="/privacy/design-preview">Privacy Policy</Link><Link href="/terms/design-preview">Terms of Service</Link><Link href="/admin/login">Team portal</Link><Link href="/#shop">Discover products</Link>
     <span className="anFooterMotto">A little more beautiful, every day. ✦</span></div>
   </div><div className="anFooterBottom"><span>© {new Date().getFullYear()} ANUSMITA. All rights reserved.</span><span>Thoughtfully curated in Bangladesh</span></div></div>
  </footer>
 </body></html>;
}

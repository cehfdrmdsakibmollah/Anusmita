
import type {Metadata} from "next";
import Link from "next/link";
import {Heart,Search,UserRound} from "lucide-react";
import {checkoutEnabled} from "@/lib/launch-config";
import "./globals.css";
import "./storefront-polish.css";
import "./homepage-connected.css";
import StoreNavigation from "@/components/store-navigation";
import StorefrontHelp from "@/components/storefront-help";
export const metadata:Metadata={
 title:{default:"ANUSMITA | Fashion · Jewellery · Beauty",template:"%s | ANUSMITA"},
 description:"Discover ANUSMITA's curated collection of beauty, skincare, fashion, jewellery, watches, bags, perfume, home and everyday accessories in Bangladesh.",
 robots:{index:checkoutEnabled(process.env),follow:checkoutEnabled(process.env)},
 alternates:{canonical:"/"},
 metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),
 openGraph:{type:"website",title:"ANUSMITA",description:"Beauty · Fashion · Lifestyle",siteName:"ANUSMITA"}
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body className="anBody"><a className="anSkipLink" href="#main-content">Skip to content</a>
  <div className="anAnnouncement"><span>✿</span> Discover the ANUSMITA edit <i>✦</i> Beauty, Fashion & Lifestyle <i>✦</i> Curated for Bangladesh</div>
  <header className="anHeader"><div className="anWide anHeaderInner">
   <Link href="/" className="anLogo" aria-label="ANUSMITA homepage">
    <span>ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></span>
   </Link>
   <StoreNavigation/>
   <form className="anHeaderSearch" action="/shop" method="get" role="search">
    <input type="search" name="q" aria-label="Search products" placeholder="Search for products…"/>
    <button type="submit" aria-label="Submit product search"><Search size={17}/></button>
   </form>
   <div className="anHeaderTools">
    <a href="/shop#store-search" aria-label="Search the collection"><Search size={20}/></a>
    <Link href="/account/design-preview" aria-label="Customer account preview"><UserRound size={19}/></Link>
    <a href="/account/wishlist/design-preview" aria-label="Wishlist preview"><Heart size={19}/></a>
    <StoreNavigation mobile/>
   </div>
  </div></header>
  <main id="main-content">{children}<StorefrontHelp/></main>
  <footer className="anFooter">
   <div className="anWide"><div className="anFooterTop">
    <div className="anFooterBrand"><Link href="/" className="anFooterLogo">ANUSMITA</Link><p>FASHION · JEWELLERY · BEAUTY</p>
     <small>Your favourite discoveries, beautifully brought together for Bangladesh.</small></div>
    <div className="anFooterLinks"><strong>DISCOVER</strong><Link href="/shop">All products</Link>
     <Link href="/shop?category=Beauty">Beauty & skincare</Link><Link href="/shop?category=Fashion">Fashion</Link>
     <Link href="/shop?category=Watches">Watches</Link><Link href="/shop?category=Bags">Bags</Link></div>
    <div className="anFooterLinks"><strong>COLLECTIONS</strong><Link href="/bundles">Bundles</Link><Link href="/deals">Daily offers</Link><Link href="/pre-orders">Pre-orders</Link><Link href="/gift-cards">Gift cards</Link><Link href="/shop?category=Perfumes">Perfumes</Link>
     <Link href="/shop?category=Mobile%20Accessories">Mobile accessories</Link>
     <Link href="/shop?category=Bed%20Sheets">Bed sheets</Link><Link href="/#collections">Explore all</Link></div>
    <div className="anFooterLinks"><strong>ANUSMITA</strong><Link href="/track-order">Track your order</Link><Link href="/routine-quiz">Routine Finder</Link><Link href="/customer-stories">Customer Stories</Link><Link href="/about/design-preview">Our story</Link><Link href="/contact/design-preview">Contact & assistance</Link><Link href="/journal/design-preview">Beauty Journal</Link>
     <Link href="/shipping/design-preview">Shipping & Delivery</Link><Link href="/returns/design-preview">Returns & Refunds</Link><Link href="/faq/design-preview">FAQ</Link><Link href="/privacy/design-preview">Privacy Policy</Link><Link href="/terms/design-preview">Terms of Service</Link><Link href="/admin/login">Team portal</Link><Link href="/shop">Discover products</Link>
     <span className="anFooterMotto">A little more beautiful, every day. ✦</span></div>
   </div><div className="anFooterBottom"><span>© {new Date().getFullYear()} ANUSMITA. All rights reserved.</span><span>Thoughtfully curated in Bangladesh</span></div></div>
  </footer>
 </body></html>;
}

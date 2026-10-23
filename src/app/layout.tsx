
import type { Metadata } from "next";
import Link from "next/link";
import {checkoutEnabled} from "@/lib/launch-config";
import "./globals.css";
export const metadata: Metadata = {
 title:{default:"ANUSMITA | Fashion · Jewellery · Beauty",template:"%s | ANUSMITA"},
 description:"Explore the ANUSMITA collection of fashion, jewellery and beauty essentials from Bangladesh, Japan, Korea and China.",
 robots:{index:checkoutEnabled(process.env),follow:checkoutEnabled(process.env)},
 alternates:{canonical:"/"},
 metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"),
 openGraph:{type:"website",title:"ANUSMITA",description:"Fashion · Jewellery · Beauty",siteName:"ANUSMITA"},
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>
  <div className="announcement">Carefully selected fashion, jewellery &amp; beauty • Bangladesh</div>
  <header className="siteHeader">
   <Link className="wordmark" href="/" aria-label="ANUSMITA home"><img className="navLogo" src="/brand/anusmita-logo.webp" alt="" width={56} height={56}/><span>ANUSMITA</span></Link>
   <nav aria-label="Main navigation"><Link href="/">Shop</Link><Link href="/#collections">Collections</Link><Link href="/#our-story">Our Story</Link><Link href="/admin">Owner Portal</Link></nav>
  </header>
  <main>{children}</main>
  <footer className="siteFooter"><div><div className="footerLogo">ANUSMITA</div><p>FASHION · JEWELLERY · BEAUTY</p></div>
   <div><strong>Designed for Bangladesh</strong><p>Thoughtful selections. Transparent prices. Checkout opens at launch.</p></div>
   <p>© {new Date().getFullYear()} ANUSMITA. All rights reserved.</p>
  </footer>
 </body></html>;
}

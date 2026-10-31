import LoginForm from "@/components/login-form";
import {LockKeyhole} from "lucide-react";
export const metadata={title:"Owner Login | ANUSMITA",robots:{index:false,follow:false}};
export default function LoginPage(){return <section className="anOwnerLogin" aria-labelledby="an-owner-welcome">
 <div className="anOwnerLoginCard">
  <aside className="anOwnerLoginArt" aria-label="ANUSMITA fashion, jewellery and beauty">
   <div className="anOwnerLoginArtContent">
    <span className="anOwnerLoginArtBrand">ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></span>
    <span className="anOwnerLoginArtRule"/>
    <p>More than a brand,<br/>a world of beautiful possibilities.</p>
   </div>
  </aside>
  <div className="anOwnerLoginPanel">
   <div className="anOwnerLoginPanelInner">
    <p className="anOwnerLoginEyebrow">PRIVATE BUSINESS PORTAL</p>
    <h1 id="an-owner-welcome">Welcome back.</h1>
    <p className="anOwnerLoginIntro">Authorized ANUSMITA staff only.</p>
    <LoginForm/>
    <div className="anOwnerLoginNotice"><div className="anOwnerLoginLock"><span/><LockKeyhole size={17}/><span/></div><p>This is a private portal for authorized ANUSMITA team members only.<br/>Please keep your login credentials secure.</p></div>
   </div>
  </div>
 </div>
 </section>}

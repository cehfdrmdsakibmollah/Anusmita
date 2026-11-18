import {describe,it,expect} from "vitest";
import {bannerMedia} from "./banner-media";
const data={id:crypto.randomUUID(),revision:0,title:"Campaign",desktopUrl:"https://anusmita-media.mdsakibmolla545.workers.dev/public/homepage/11111111-1111-4111-8111-111111111111.webp",mobileUrl:"",alt:"Perfume collection",target:"/shop",cta:"Shop",slot:"HOME_HERO",start:"",end:"",focalX:50,focalY:50,scrim:20,status:"published"};
describe("banner publication contract",()=>{
 it("accepts paired managed images and rejects unsafe media or destinations",()=>{
  expect(bannerMedia.safeParse({...data,mobileUrl:data.desktopUrl}).success).toBe(true);
  expect(bannerMedia.safeParse({...data,desktopUrl:"https://other.example/image.webp"}).success).toBe(false);
  expect(bannerMedia.safeParse({...data,target:"//other.example"}).success).toBe(false);
  expect(bannerMedia.safeParse({...data,target:"javascript:alert(1)"}).success).toBe(false);
 });
 it("requires meaningful published alt text and a valid schedule",()=>{
  expect(bannerMedia.safeParse({...data,alt:" "}).success).toBe(false);
  expect(bannerMedia.safeParse({...data,start:"2026-12-02T00:00:00.000Z",end:"2026-12-01T00:00:00.000Z"}).success).toBe(false);
  expect(bannerMedia.safeParse({...data,status:"draft",alt:""}).success).toBe(true);
 });
});

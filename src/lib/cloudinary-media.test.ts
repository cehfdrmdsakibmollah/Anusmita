
import {it,expect} from "vitest";
import {validCloudinaryUrl} from "./cloudinary-media";
it("allows only configured Cloudinary HTTPS image delivery",()=>{
 expect(validCloudinaryUrl("https://res.cloudinary.com/oseohmxd/image/upload/v123/anusmita/item.jpg")).toBe(true);
 expect(validCloudinaryUrl("https://evil.example/x")).toBe(false);
 expect(validCloudinaryUrl("http://res.cloudinary.com/oseohmxd/image/upload/a.jpg")).toBe(false);
});

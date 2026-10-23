
import {it,expect} from "vitest";
import {validCloudinaryUrl,cloudinaryPublicId} from "./cloudinary-media";
it("requires the account and a versioned HTTPS asset in ANUSMITA folders",()=>{
 const url="https://res.cloudinary.com/oseohmxd/image/upload/v1792790797/anusmita/drive/korea/drive-1ox6P3J_wfThTQ_UuY2eAfyS0aaZNCCjY.jpg";
 expect(validCloudinaryUrl(url)).toBe(true);
 expect(cloudinaryPublicId(url)).toBe("anusmita/drive/korea/drive-1ox6P3J_wfThTQ_UuY2eAfyS0aaZNCCjY");
 expect(validCloudinaryUrl("https://evil.example/x")).toBe(false);
 expect(validCloudinaryUrl("https://res.cloudinary.com/oseohmxd/image/upload/v1/samples/cat.jpg")).toBe(false);
 expect(validCloudinaryUrl("http://res.cloudinary.com/oseohmxd/image/upload/v1/anusmita/x.jpg")).toBe(false);
});

import {spawn} from "node:child_process";

if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error("Cloudflare staging deploy requires the scoped CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID secrets.");
  process.exit(2);
}
if (process.env.ANUSMITA_STAGING !== "true") {
  console.error("Refusing to deploy: ANUSMITA_STAGING=true is required.");
  process.exit(2);
}
const result=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,["node_modules/cf/bin/cf","deploy"],{
    stdio:"inherit",env:{...process.env,ANUSMITA_STAGING:"true"}
  });
  child.once("error",reject);
  child.once("exit",code=>resolve(code??1));
});
process.exitCode=result;

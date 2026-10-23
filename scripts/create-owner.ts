
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { db } from "../src/lib/db";
import { User } from "../src/lib/models";
async function main(){
 const email=process.env.OWNER_EMAIL?.toLowerCase().trim();
 const password=process.env.OWNER_PASSWORD||"";
 if(!email||!email.includes("@")||password.length<14) throw new Error("Set OWNER_EMAIL and a 14+ character OWNER_PASSWORD in .env");
 await db();
 if(await User.exists({role:"owner"})) throw new Error("An owner already exists; refusing to create a second owner");
 const hash=await bcrypt.hash(password,12);
 const user=await User.create({name:"ANUSMITA Owner",email,passwordHash:hash,role:"owner",active:true});
 console.log("Created owner account:",user.email);
}
main().catch((e)=>{console.error(e.message);process.exitCode=1;}).finally(async()=>mongoose.disconnect());

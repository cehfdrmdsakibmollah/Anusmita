// Isolated runtime probe; no production database, media or provider bindings.
import bcrypt from "bcryptjs";
import {SignJWT, jwtVerify} from "jose";
import mongoose from "mongoose";

const headers = {"Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow"};
const reply = (body, status=200) => Response.json(body, {status, headers});
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path === "/health") {
      return reply({service:"ANUSMITA compatibility probe", applicationDeployment:false});
    }
    if (!env.PROBE_SECRET || request.headers.get("Authorization") !== `Bearer ${env.PROBE_SECRET}`) {
      return reply({error:"Unauthorized"},401);
    }
    if (request.method !== "POST") return reply({error:"Method not allowed"},405);
    if (path === "/probe/mongoose") {
      return reply({version:mongoose.version, nodeDriver:typeof mongoose.connect === "function", databaseTested:false});
    }
    if (path === "/probe/auth") {
      const started=Date.now();
      // Same cost as create-owner.ts. Synthetic fixture; never a customer hash.
      const passwordOk=await bcrypt.compare("ANUSMITA-runtime-probe", env.PROBE_PASSWORD_HASH);
      const key=new TextEncoder().encode(env.PROBE_SECRET);
      const token=await new SignJWT({probe:true}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("1m").sign(key);
      const verified=await jwtVerify(token,key,{algorithms:["HS256"]});
      return reply({passwordOk,jwtOk:verified.payload.probe===true,elapsedWallMs:Date.now()-started,cpuMeasured:false,loginFlowTested:false});
    }
    return reply({error:"Not found"},404);
  }
};

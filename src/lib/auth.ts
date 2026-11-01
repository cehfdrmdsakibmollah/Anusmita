
import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { User } from "@/lib/models";
export const SESSION = "anusmita_session";
export const PERMISSIONS=["orders.view","orders.edit","products.view","products.edit","finance.view","inventory.view","inventory.edit","finance.edit","purchasing.view","purchasing.edit"] as const;
export type Permission=typeof PERMISSIONS[number];
export const ROLES = ["owner","admin","sales","finance","inventory","purchasing","support","analyst"] as const;
export type Role = typeof ROLES[number];
function key() {
 const secret=process.env.SESSION_SECRET;
 if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
 return new TextEncoder().encode(secret);
}
export async function signSession(id:string) {
 return new SignJWT({sub:id}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("12h").sign(key());
}
export async function currentUser() {
 const raw=(await cookies()).get(SESSION)?.value;
 if (!raw) return null;
 try {
  const {payload}=await jwtVerify(raw,key());
  if (!payload.sub || !/^[0-9a-f]{24}$/i.test(payload.sub)) return null;
  await db();
  const user=await User.findById(payload.sub).select("name email role active permissions").lean<any>();
  return user && user.active?{id:String(user._id),name:user.name as string,email:user.email as string,role:user.role as Role,permissions:Object.fromEntries(user.permissions instanceof Map?user.permissions:new Map(Object.entries(user.permissions||{})))}:null;
 } catch { return null; }
}
export async function authorize(roles: Role[]) {
 const user=await currentUser();
 if (!user || !roles.includes(user.role)) throw new HttpError(403,"Access denied");
 return user;
}
export async function authorizePermission(roles:Role[],permission:Permission){
 const user=await authorize(roles);
 if(user.role!=="owner" && user.permissions[permission]===false)throw new HttpError(403,"Permission denied");
 return user;
}
export class HttpError extends Error { constructor(public status:number,message:string){ super(message); } }
export function assertOrigin(request: Request) {
 const origin=request.headers.get("origin");
 if (!origin) return; // Non-browser clients must authenticate separately.
 const expected=new URL(request.url), received=new URL(origin);
 if (expected.host!==received.host || received.protocol!==expected.protocol) throw new HttpError(403,"Cross-origin request rejected");
}
export function apiError(error: unknown) {
 if (error instanceof HttpError) return Response.json({error:error.message},{status:error.status});
 if (error && typeof error==="object" && "issues" in error) return Response.json({error:"Invalid request",issues:(error as {issues:unknown}).issues},{status:400});
 console.error("API request failed",error instanceof Error?error.message:"unknown");
 return Response.json({error:"Unable to process request"},{status:500});
}

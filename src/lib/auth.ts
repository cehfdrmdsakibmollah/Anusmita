
import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { User } from "@/lib/models";
export const SESSION = "anusmita_session";
export const PERMISSIONS=["orders.view","orders.edit","products.view","products.edit","finance.view","inventory.view","inventory.edit","finance.edit","purchasing.view","purchasing.edit","settings.view","settings.edit","customers.view","support.view"] as const;
export type Permission=typeof PERMISSIONS[number];
export function encodePermissionKey(key:Permission):string{return key.replace(".","_");}
export function decodePermissionMap(input:unknown):Record<string,boolean>{
 const entries=input instanceof Map?[...input.entries()]:input&&typeof input==="object"?Object.entries(input):[];
 return Object.fromEntries(entries.map(([k,v])=>[String(k).replace("_","."),v===true]));
}
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
export async function currentUser():Promise<{id:string;name:string;email:string;role:Role;permissions?:Record<string,boolean>}|null> {
 const raw=(await cookies()).get(SESSION)?.value;
 if (!raw) return null;
 try {
  const {payload}=await jwtVerify(raw,key());
  if (!payload.sub || !/^[0-9a-f]{24}$/i.test(payload.sub)) return null;
  await db();
  const user=await User.findById(payload.sub).select("name email role active permissions").lean<any>();
  return user && user.active?{id:String(user._id),name:user.name as string,email:user.email as string,role:user.role as Role,permissions:decodePermissionMap(user.permissions)}:null;
 } catch { return null; }
}
export async function authorize(roles: Role[],permission?:Permission) {
 const user=await currentUser();
 if (!user || !roles.includes(user.role)) throw new HttpError(403,"Access denied");
 if(permission && user.role!=="owner" && user.permissions?.[permission]===false)throw new HttpError(403,"Permission denied");
 return user;
}
export async function authorizePermission(roles:Role[],permission:Permission){
 return authorize(roles,permission);
}
export class HttpError extends Error { constructor(public status:number,message:string){ super(message); } }
export function assertOrigin(request: Request) {
 const origin=request.headers.get("origin");
 if (!origin) return; // Non-browser clients must authenticate separately.
 let received:URL;
 try{received=new URL(origin);}catch{throw new HttpError(403,"Cross-origin request rejected");}
 const expected=new URL(request.url);
 const normalized=(value:string|null)=>value?.trim().toLowerCase()||"";
 const publicHost=normalized(request.headers.get("host"));
 const forwardedHost=normalized(request.headers.get("x-forwarded-host"));
 const isApprovedNetlifyHost=(host:string)=>host==="anusmita.netlify.app"||/^deploy-preview-[0-9]+--anusmita\\.netlify\\.app$/.test(host);
 const sameInternalOrigin=received.host===expected.host&&received.protocol===expected.protocol;
 // On Netlify, request.url can be rewritten to an internal server host while the browser
 // sends Origin from the public preview URL. Trust only the exact public Host supplied by
 // Netlify or an exact Netlify deploy-preview hostname in its forwarding metadata.
 const samePublicHost=received.protocol==="https:"&&isApprovedNetlifyHost(received.host)&&
   (received.host===publicHost||(received.host===forwardedHost&&isApprovedNetlifyHost(forwardedHost)));
 if(!sameInternalOrigin&&!samePublicHost)throw new HttpError(403,"Cross-origin request rejected");
}
export function apiError(error: unknown) {
 if (error instanceof HttpError) return Response.json({error:error.message},{status:error.status});
 if (error && typeof error==="object" && "issues" in error) return Response.json({error:"Invalid request",issues:(error as {issues:unknown}).issues},{status:400});
 console.error("API request failed",error instanceof Error?error.message:"unknown");
 return Response.json({error:"Unable to process request"},{status:500});
}

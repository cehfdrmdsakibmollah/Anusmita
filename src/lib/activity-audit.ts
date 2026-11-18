export const AUDIT_MODULES=["Inventory","Orders","Finance","Settings","Media","Staff","CRM","Integrations","Other"] as const;
export const AUDIT_RULES=[
 {module:"Inventory",pattern:"^(stock|inventory|warehouse|pos\\.branch\\.damage)\\.",entities:[]},
 {module:"Orders",pattern:"^(order|checkout|pos\\.sale)\\.",entities:["Order"]},
 {module:"Finance",pattern:"^(payment|journal|refund)\\.",entities:["Payment","JournalEntry","Expense"]},
 {module:"Settings",pattern:"^(store\\.settings|integration|provider|site\\.seo)\\.",entities:["StoreSettings","IntegrationConnector"]},
 {module:"Media",pattern:"^(homepage|cms|funnel|media|banner)\\.",entities:["HomepageMedia","FunnelPage"]},
 {module:"Staff",pattern:"^(staff|auth|user)\\.",entities:["User","StaffProfile"]},
 {module:"CRM",pattern:"^(crm|loyalty|customer)\\.",entities:["Customer","LoyaltyEvent"]},
 {module:"Integrations",pattern:"^(courier|webhook|social)\\.",entities:[]},
];
export const CRITICAL_PATTERN="(credential|permission|refund|deleted|bulk_delete|secret|restored)";
export const WARNING_PATTERN="(stock\\.|price|override|adjust|damage|needs_review|archived)";
export function classifyAudit(action:string,entity:string){return {
 module:AUDIT_RULES.find(r=>new RegExp(r.pattern,"i").test(action)||r.entities.includes(entity))?.module||"Other",
 severity:new RegExp(CRITICAL_PATTERN,"i").test(action)?"Critical":new RegExp(WARNING_PATTERN,"i").test(action)?"Warning":"Info"
};}
export function literalSearch(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
export function auditQuery(params:URLSearchParams,now=new Date()){
 const page=Math.min(1000,Math.max(1,parseInt(params.get("page")||"1",10)||1));
 const days=[1,7,30,90].includes(Number(params.get("days")))?Number(params.get("days")):7;
 const q=(params.get("q")||"").trim().slice(0,160);
 const tokens:Record<string,string>={}; const text=q.replace(/\b(actor|module|severity|action):([^\s]+)/gi,(_,key,value)=>{tokens[key.toLowerCase()]=value;return "";}).trim();
 const module=params.get("module")||tokens.module||"";const severity=params.get("severity")||tokens.severity||"";
 const canonicalModule=AUDIT_MODULES.find(x=>x.toLowerCase()===module.toLowerCase());
 const canonicalSeverity=["Info","Warning","Critical"].find(x=>x.toLowerCase()===severity.toLowerCase());
 const entity=(params.get("entity")||"").slice(0,100),entityId=(params.get("entityId")||"").slice(0,300);
 return {page,days,text,actor:(tokens.actor||params.get("actor")||"").slice(0,80),action:(tokens.action||"").slice(0,80),module:canonicalModule||"",severity:canonicalSeverity||"",entity,entityId,since:new Date(now.getTime()-days*86400000),until:now};
}
// Deny by default: legacy details can contain credentials, customer data and free text.
const safeFields=new Set(["before","after","quantity","stock","onHand","reserved","available","pricePaisa","salePricePaisa","totalPaisa","amountPaisa","revision","sourceRevision","active","enabled","status","orderStatus","paymentStatus","count","bytes","type","rateBps","points","slotCount","changedFields"]);
export function safeAuditDetails(input:unknown,depth=0):unknown{
 if(depth>5)return "[REDACTED]";
 if(Array.isArray(input))return input.slice(0,30).map(v=>safeAuditDetails(v,depth+1));
 if(input&&typeof input==="object")return Object.fromEntries(Object.entries(input).slice(0,80).map(([key,value])=>[key,safeFields.has(key)?safeAuditDetails(value,depth+1):"[REDACTED]"]));
 if(typeof input==="number")return Number.isFinite(input)?input:null;
 if(typeof input==="boolean"||input===null)return input;
 // Only enum-like values; arbitrary prose, URLs, phone numbers and tokens stay private.
 if(typeof input==="string"&&/^(pending|confirmed|processing|shipped|delivered|cancelled|returned|paid|unpaid|draft|published|archived|active|inactive|image\/(jpeg|png|webp))$/i.test(input))return input;
 return "[REDACTED]";
}
export function csvCell(value:unknown){const text=String(value??"");return '"'+(/^[\s]*[=+\-@]/.test(text)?"'":"")+text.replace(/"/g,'""')+'"';}

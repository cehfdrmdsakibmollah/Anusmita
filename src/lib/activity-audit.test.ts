import {describe,it,expect} from "vitest";
import {classifyAudit,auditQuery,safeAuditDetails,csvCell,literalSearch} from "./activity-audit";
describe("audit investigation safety",()=>{
 it("denies arbitrary legacy secrets and customer data even inside snapshots",()=>{
 const out=safeAuditDetails({passwordHash:"secret",before:{quantity:24,email:"private@example.com",apiSecret:"token",status:"pending"},after:{quantity:20},note:"customer phone 01712345678"});
 expect(JSON.stringify(out)).not.toMatch(/secret|private@|01712345678|token/);expect(out).toEqual({passwordHash:"[REDACTED]",before:{quantity:24,email:"[REDACTED]",apiSecret:"[REDACTED]",status:"pending"},after:{quantity:20},note:"[REDACTED]"});
 });
 it("does not expose a token disguised as an allowed string field",()=>expect(safeAuditDetails({status:"sk_live_secret",quantity:"01712345678"})).toEqual({status:"[REDACTED]",quantity:"[REDACTED]"}));
 it("supports operators without permitting arbitrary regular expressions",()=>{
 const q=auditQuery(new URLSearchParams({q:"actor:admin module:inventory severity:CRITICAL (a+)+",days:"999",page:"-1"}),new Date("2026-11-19T00:00:00Z"));
 expect(q).toMatchObject({actor:"admin",module:"Inventory",severity:"Critical",days:7,page:1,text:"(a+)+"});expect(literalSearch(q.text)).toBe("\\(a\\+\\)\\+");
 });
 it("bounds date windows and preserves exact resource filtering",()=>{const q=auditQuery(new URLSearchParams({days:"90",entity:"Product",entityId:"abc"}),new Date("2026-11-19T00:00:00Z"));expect(q.until.getTime()-q.since.getTime()).toBe(90*86400000);expect(q.entityId).toBe("abc");});
 it("classifies existing actions transparently and handles unknown events",()=>{expect(classifyAudit("stock.adjusted","Product")).toEqual({module:"Inventory",severity:"Warning"});expect(classifyAudit("staff.permissions_updated","User").severity).toBe("Critical");expect(classifyAudit("unknown.event","Unknown")).toEqual({module:"Other",severity:"Info"});});
 it("neutralizes spreadsheet formulas and quotes CSV fields",()=>{expect(csvCell(" =HYPERLINK(\"evil\")")).toBe('"\' =HYPERLINK(""evil"")"');expect(csvCell("a,b")).toBe('"a,b"');});
});

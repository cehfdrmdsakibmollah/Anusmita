import {describe,it,expect} from "vitest";
import {cmsSlots,type CmsSlot} from "./cms-page-slots";
import {cloneCmsSlotWithFreshIds,remapImportedCmsSlots} from "./cms-slot-clone";

const base=cmsSlots.parse([{
 id:"550e8400-e29b-41d4-a716-446655440000",placement:"before",kind:"grid",
 title:"Editorial grid",position:0,children:[{
  id:"11111111-1111-4111-8111-111111111111",title:"Parent card",
  subcards:[{id:"22222222-2222-4222-8222-222222222222",title:"Child leaf"}]
 }]
}])[0] as CmsSlot;
const ids=(slot:CmsSlot)=>[slot.id,...slot.children.flatMap(card=>[card.id,...card.subcards.map(leaf=>leaf.id)])];
function deterministicIds(){
 let next=0;
 return ()=>"00000000-0000-4000-8000-"+String(++next).padStart(12,"0");
}
describe("independent CMS section copies",()=>{
 it("duplicates parent, card and leaf identities while preserving content",()=>{
  const copy=cloneCmsSlotWithFreshIds(base,4,deterministicIds());
  expect(copy.position).toBe(4);
  expect(copy.title).toBe(base.title);
  expect(copy.children[0].subcards[0].title).toBe("Child leaf");
  for(const id of ids(copy))expect(ids(base)).not.toContain(id);
  expect(new Set([...ids(base),...ids(copy)]).size).toBe(6);
  expect(cmsSlots.safeParse([base,copy]).success).toBe(true);
 });
 it("copies editable objects rather than sharing references",()=>{
  const copy=cloneCmsSlotWithFreshIds(base,1,deterministicIds());
  expect(copy.style).not.toBe(base.style);
  expect(copy.children).not.toBe(base.children);
  expect(copy.children[0].subcards).not.toBe(base.children[0].subcards);
  copy.children[0].subcards[0].title="Edited copy";
  expect(base.children[0].subcards[0].title).toBe("Child leaf");
 });
 it("imports multiple grid sections without repeated nested IDs",()=>{
  const imported=remapImportedCmsSlots([base,base],deterministicIds());
  expect(imported.map(x=>x.position)).toEqual([0,1]);
  expect(new Set(imported.flatMap(ids)).size).toBe(6);
  expect(imported.flatMap(ids).some(id=>ids(base).includes(id))).toBe(false);
  expect(cmsSlots.safeParse(imported).success).toBe(true);
 });
});

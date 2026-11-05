import type {HomeBlock} from "./home-content";
export function offerIsStored(savedBlocks:Pick<HomeBlock,"id">[],offerId:string):boolean{
 return savedBlocks.some(block=>block.id===offerId);
}
export function offerDeletePlan(savedBlocks:Pick<HomeBlock,"id">[],offerId:string):"delete-persisted"|"discard-unsaved"{
 return offerIsStored(savedBlocks,offerId)?"delete-persisted":"discard-unsaved";
}
export function offerEditorPage(): "Homepage" { return "Homepage"; }

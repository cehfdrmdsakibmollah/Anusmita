import type {CmsSlot} from "./cms-page-slots";

/** Make a completely independent editable copy of a section and its nested cards. */
export function cloneCmsSlotWithFreshIds(
 slot: CmsSlot,
 position: number,
 newId: () => string = () => crypto.randomUUID()
): CmsSlot {
 return {
  ...slot,
  id: newId(),
  position,
  style: {...slot.style},
  cssRules: slot.cssRules.map(rule => ({...rule})),
  children: slot.children.map(card => ({
   ...card,
   id: newId(),
   subcards: card.subcards.map(leaf => ({...leaf, id: newId()}))
  }))
 };
}

/** Imported section IDs must not collide with other sections or nested items. */
export function remapImportedCmsSlots(
 slots: readonly CmsSlot[],
 newId: () => string = () => crypto.randomUUID()
): CmsSlot[] {
 return slots.map((slot,index) => cloneCmsSlotWithFreshIds(slot,index,newId));
}

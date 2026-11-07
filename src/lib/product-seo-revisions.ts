/** Saved SEO revision format. Never restores an old database revision number. */
export type SeoRevisionFields={
 metaTitle:string;metaDescription:string;focusKeyword:string;
 keywords:string[];imageAltTexts:string[];ogTitle:string;ogDescription:string;
 robotsIndex:boolean;robotsFollow:boolean;schemaEnabled:boolean
};
export const seoRevisionFieldNames=["metaTitle","metaDescription","focusKeyword","keywords","imageAltTexts","ogTitle","ogDescription","robotsIndex","robotsFollow","schemaEnabled"] as const;
export function seoRevisionSnapshot(source:SeoRevisionFields):SeoRevisionFields{
 return {
  metaTitle:source.metaTitle,metaDescription:source.metaDescription,focusKeyword:source.focusKeyword,
  keywords:[...source.keywords],imageAltTexts:[...source.imageAltTexts],ogTitle:source.ogTitle,
  ogDescription:source.ogDescription,robotsIndex:source.robotsIndex,robotsFollow:source.robotsFollow,
  schemaEnabled:source.schemaEnabled
 };
}
export function restoreSeoRevisionDraft<T extends SeoRevisionFields&{revision:number}>(current:T,saved:SeoRevisionFields):T{
 return {...current,...seoRevisionSnapshot(saved),revision:current.revision};
}

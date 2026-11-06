export function shouldConfirmCmsPageSwitch(current:string,next:string,homepageDirty:boolean,secondaryDirty:boolean):boolean{
 if(next===current)return false;
 return current==="Homepage"?homepageDirty:secondaryDirty;
}
export function shouldConfirmCustomDraftReplacement(isCustomPage:boolean,dirty:boolean):boolean{
 return isCustomPage&&dirty;
}

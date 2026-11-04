import {CatalogCategory} from "@/lib/models";
import {HttpError} from "@/lib/auth";
/** Verify optional product subcategory belongs to its displayed parent category.
 * Existing records without a subcategory remain valid and are never rewritten.
 * Call only after db() has connected.
 */
export async function validateProductSubcategory(category:string,subcategoryId:string|null|undefined){
 if(!subcategoryId)return;
 const child=await CatalogCategory.findById(subcategoryId).select("name parentId").lean<{name:string;parentId?:unknown}|null>();
 if(!child||!child.parentId)throw new HttpError(400,"Choose a valid subcategory from the category registry");
 const parent=await CatalogCategory.findById(child.parentId).select("name parentId").lean<{name:string;parentId?:unknown}|null>();
 if(!parent||parent.parentId||parent.name.toLocaleLowerCase()!==category.toLocaleLowerCase())
  throw new HttpError(400,"Subcategory does not belong to the selected product category");
}

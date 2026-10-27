export const storyCategories=['All Stories','Skincare','Beauty','Perfume','Fashion','Home & Lifestyle'] as const;
export type StoryCategory=typeof storyCategories[number];
export type StoryFormat='All content'|'Photo'|'Video';
export type Story={id:string;title:string;category:Exclude<StoryCategory,'All Stories'>;format:'Photo'|'Video';art:readonly number[];collection:string;rank:number};
export const sampleStories:Story[]=[
 {id:'morning',title:'A morning skincare moment',category:'Skincare',format:'Photo',art:[49,514,216,195],collection:'Skincare',rank:6},
 {id:'routine',title:'Inside a daily routine',category:'Beauty',format:'Video',art:[282,514,215,195],collection:'Beauty',rank:5},
 {id:'fragrance',title:'A fragrance unboxing',category:'Perfume',format:'Photo',art:[513,514,212,195],collection:'Perfumes',rank:4},
 {id:'fashion',title:'Styled for the everyday',category:'Fashion',format:'Photo',art:[49,812,216,197],collection:'Fashion',rank:3},
 {id:'home',title:'A softer start at home',category:'Home & Lifestyle',format:'Photo',art:[282,812,215,197],collection:'Bed Sheets',rank:2},
 {id:'shelf',title:'The beauty shelf edit',category:'Beauty',format:'Video',art:[513,812,212,197],collection:'Beauty',rank:1},
];
export function filterStories(category:StoryCategory,format:StoryFormat,sort:'recommended'|'title'){
 const list=sampleStories.filter(s=>(category==='All Stories'||s.category===category)&&(format==='All content'||s.format===format));
 return sort==='title'?[...list].sort((a,b)=>a.title.localeCompare(b.title)):list;
}
export function validateStoryFile(file:{type:string;size:number}):string|null {
 if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type))return 'Choose a JPG, PNG, WebP, MP4 or WebM file.';
 if(file.size===0)return 'This file is empty. Choose another file.';
 if(file.size>20*1024*1024)return 'Choose a file smaller than 20 MB.';
 return null;
}

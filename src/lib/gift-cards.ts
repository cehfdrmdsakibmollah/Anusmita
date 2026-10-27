export const giftAmounts = [500, 1000, 2000, 5000] as const;
export const giftStyles = ['Classic', 'Blush', 'Celebration'] as const;
export type GiftDraft = { amount:number; recipient:string; email:string; sender:string; message:string; delivery:'now'|'later'; date:string };
export function dhakaDate(now = new Date()) { return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function validateGift(draft:GiftDraft, today=dhakaDate()) {
 const errors:Partial<Record<keyof GiftDraft,string>>={};
 if(!giftAmounts.some(a=>a===draft.amount)) errors.amount='Choose one of the available gift values.';
 if(!draft.recipient.trim() || draft.recipient.length>80) errors.recipient='Enter the recipient’s name (up to 80 characters).';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || draft.email.length>254) errors.email='Enter a valid recipient email address.';
 if(!draft.sender.trim() || draft.sender.length>80) errors.sender='Enter your name (up to 80 characters).';
 if(draft.message.length>500) errors.message='Keep your message within 500 characters.';
 if(draft.delivery==='later') {
  const parsed=new Date(draft.date+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==draft.date||draft.date<=today) errors.date='Choose a future date (Bangladesh time).';
 }
 return errors;
}
export function giftMoney(value:number){return `৳${value.toLocaleString('en-BD')}`;}

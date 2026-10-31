import Link from "next/link";
import {Check,ShoppingBag,Truck} from "lucide-react";
export default function CommerceSteps({step}:{step:1|2|3}){
 const steps=[{name:"Bag",href:"/cart"},{name:"Delivery & Payment",href:"/checkout"},{name:"Confirmation",href:""}];
 return <nav className="anFlowSteps" aria-label="Shopping progress">{steps.map((s,i)=><div className={"anFlowStep "+(step===i+1?"current":step>i+1?"done":"future")} key={s.name}><span className="anFlowStepDot">{step>i+1?<Check size={15}/>:i===0?<ShoppingBag size={15}/>:i===1?<Truck size={15}/>:i+1}</span>{s.href&&i<step-1?<Link href={s.href}>{s.name}</Link>:<span>{s.name}</span>}</div>)}</nav>;
}

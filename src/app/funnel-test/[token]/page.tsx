import {notFound} from "next/navigation";
import {readExperiment} from "@/lib/funnel-experiment";
import {FunnelExperimentEntry} from "@/components/funnel-experiment-entry";
import "@/components/funnel-public.css";

export const metadata={title:"ANUSMITA Campaign",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function FunnelTestPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const experiment=await readExperiment(token);
 if(!experiment||Date.now()>=experiment.endsAt)notFound();
 return <main className="anFunnelRoot"><div className="anFunnelBody"><section className="anFunnelBlock">
  <h1>Continue to the campaign</h1><FunnelExperimentEntry token={token}/>
 </section></div></main>;
}

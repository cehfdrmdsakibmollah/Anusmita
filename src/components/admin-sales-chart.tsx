'use client';
import {chartGeometry,type DailyPoint} from '@/lib/dashboard-metrics';
export default function AdminSalesChart({series}:{series:DailyPoint[]}) {
 const {min,max,x,y}=chartGeometry(series);
 const tick=(value:number)=>new Intl.NumberFormat('en-BD',{notation:'compact',maximumFractionDigits:1}).format(value/100);
 return <><svg className="ao-chart" viewBox="0 0 610 190" role="img" aria-label="Ordered sales and net verified collections in BDT; refunds can produce negative collection days">
 {[0,1,2,3,4].map(i=>{const amount=max-(max-min)*i/4;return <g key={i}><line x1="48" y1={y(amount)} x2="588" y2={y(amount)}/><text x="23" y={y(amount)+4} textAnchor="middle">{tick(amount)}</text></g>;})}
 {series.map((p,i)=><g key={p.date}>{(i%Math.ceil(series.length/7)===0||i===series.length-1)&&<text x={x(i)} y="175" textAnchor="middle">{p.date.slice(5)}</text>}</g>)}
 <polyline className="ao-line light" points={series.map((p,i)=>`${x(i)},${y(p.collectedPaisa)}`).join(' ')}/><polyline className="ao-line" points={series.map((p,i)=>`${x(i)},${y(p.orderedPaisa)}`).join(' ')}/>
 </svg><div className="ao-legend"><span>Ordered sales</span><span>Net collected</span></div><details className="ao-chart-data"><summary>View daily figures</summary><table><caption>BDT · Asia/Dhaka · verified collections less refunds</caption><thead><tr><th>Date</th><th>Ordered</th><th>Net collected</th></tr></thead><tbody>{series.map(p=><tr key={p.date}><td>{p.date}</td><td>{(p.orderedPaisa/100).toFixed(2)}</td><td>{(p.collectedPaisa/100).toFixed(2)}</td></tr>)}</tbody></table></details></>;
}

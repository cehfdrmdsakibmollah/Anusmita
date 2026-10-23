
"use client";
import Link from "next/link";
export default function PrintToolbar(){const path=typeof window!=="undefined"?window.location.pathname:"";
 return <div style={{display:"flex",gap:8,margin:"16px 0",flexWrap:"wrap"}}><Link className="button light small" href="?format=a4">A4</Link><Link className="button light small" href="?format=80">80 mm</Link><Link className="button light small" href="?format=58">58 mm</Link><button className="button small" onClick={()=>window.print()}>Print / Save PDF</button></div>;
}

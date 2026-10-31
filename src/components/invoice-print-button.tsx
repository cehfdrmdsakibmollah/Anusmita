"use client";
import {Printer,Download} from "lucide-react";
export default function InvoicePrintButton(){return <div className="anFlowPrintActions"><button type="button" onClick={()=>window.print()}><Printer size={16}/> Print Invoice</button><button type="button" onClick={()=>window.print()} title="Choose Save as PDF in the print dialog"><Download size={16}/> Save as PDF</button></div>}

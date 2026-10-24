import type { Metadata } from "next";
import RadiancePreview from "@/components/radiance-preview";
import "./radiance.css";

export const metadata: Metadata = {
  title: "Radiance product design preview",
  description: "ANUSMITA interactive product design preview. All prices and product claims are sample content, not a live offer.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/products/design-preview" },
};
export default function Page() { return <RadiancePreview />; }

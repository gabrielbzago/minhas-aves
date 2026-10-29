"use client";
import type {ReactNode} from "react";
export default function SponsorLink({sponsor,children}:{sponsor:any;children:ReactNode}){async function click(){try{await fetch('/api/sponsors/click',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sponsorId:sponsor.id,destination:sponsor.website_url||sponsor.whatsapp_url||null})})}catch{}}return <a href={sponsor.website_url||sponsor.whatsapp_url||'#'} target="_blank" rel="noopener noreferrer sponsored" onClick={click}>{children}</a>}

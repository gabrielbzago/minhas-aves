import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:Request){const {sponsorId,destination}=await request.json();if(!sponsorId)return NextResponse.json({ok:false},{status:400});const admin=createAdminClient();let userId:string|null=null;try{const supabase=await createClient();userId=(await supabase.auth.getUser()).data.user?.id||null}catch{}await admin.from("sponsor_clicks").insert({sponsor_id:sponsorId,user_id:userId,destination:destination||null});return NextResponse.json({ok:true});}

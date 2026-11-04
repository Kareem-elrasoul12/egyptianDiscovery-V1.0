import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function authorized(request){
 const expected=process.env.CRON_SECRET;
 const supplied=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||"";
 if(!expected||!supplied)return false;
 const a=Buffer.from(expected),b=Buffer.from(supplied);
 return a.length===b.length&&timingSafeEqual(a,b);
}

export async function GET(request){
 if(!authorized(request))return Response.json({error:"Unauthorized"},{status:401});
 const {NEXT_PUBLIC_SUPABASE_URL:url,SUPABASE_SECRET_KEY:key,WHATSAPP_CLOUD_PHONE_NUMBER_ID:phoneId,WHATSAPP_CLOUD_ACCESS_TOKEN:token,WHATSAPP_NOTIFICATION_TEMPLATE:template="booking_update",WHATSAPP_TEMPLATE_LANGUAGE:language="en",WHATSAPP_GRAPH_API_VERSION:version="v26.0"}=process.env;
 if(!url||!key||!phoneId||!token)return Response.json({error:"Notification service is not configured."},{status:503});
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error:queueError}=await supabase.rpc("queue_scheduled_notifications");
 if(queueError)return Response.json({error:"Could not queue scheduled notifications."},{status:500});
 const {data:jobs,error}=await supabase.from("notifications").select("id,template,payload,profiles!inner(phone)").eq("status","queued").order("created_at").limit(25);
 if(error)return Response.json({error:"Could not load notification queue."},{status:500});
 let sent=0,failed=0;
 for(const job of jobs||[]){
  const phone=job.profiles?.phone;
  if(!phone){await supabase.from("notifications").update({status:"failed",payload:{...job.payload,error:"Customer phone is missing"}}).eq("id",job.id);failed++;continue;}
  try{
   const response=await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({messaging_product:"whatsapp",to:phone,type:"template",template:{name:template,language:{code:language},components:[{type:"body",parameters:[{type:"text",text:String(job.payload?.message||"You have an update from Egyptian Discovery.").slice(0,1024)}]}]}})});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(body?.error?.code?`Provider code ${body.error.code}`:"Provider rejected the message");
   await supabase.from("notifications").update({status:"sent",provider_reference:body?.messages?.[0]?.id||null,sent_at:new Date().toISOString()}).eq("id",job.id);
   sent++;
  }catch(error){await supabase.from("notifications").update({status:"failed",payload:{...job.payload,error:error.message}}).eq("id",job.id);failed++;}
 }
 return Response.json({processed:(jobs||[]).length,sent,failed});
}

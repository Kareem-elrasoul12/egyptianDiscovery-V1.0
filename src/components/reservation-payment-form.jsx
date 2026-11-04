"use client";

import {useState} from "react";
import {createClient} from "../lib/supabase/client";

export default function ReservationPaymentForm({reservation,paid}) {
 const limit=reservation.status==="confirmed"?Number(reservation.amount_due):Number(reservation.deposit_due);
 const [file,setFile]=useState(null),[method,setMethod]=useState("instapay"),[amount,setAmount]=useState(String(Math.max(0,limit-paid))),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function submit(event){event.preventDefault();setBusy(true);setMessage("");
  try{
   if(!file)throw new Error("Choose a payment proof image or PDF.");
   if(file.size>5*1024*1024)throw new Error("The file must be 5 MB or smaller.");
   if(!["image/jpeg","image/png","application/pdf"].includes(file.type))throw new Error("Upload a JPG, PNG, or PDF file.");
   const supabase=createClient();if(!supabase)throw new Error("Payment submission is unavailable until Supabase is configured.");
   const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)throw new Error("Sign in to submit payment.");
   const path=`${user.id}/${reservation.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
   const {error:uploadError}=await supabase.storage.from("payment-proofs").upload(path,file,{contentType:file.type,upsert:false});if(uploadError)throw uploadError;
   const {error}=await supabase.rpc("submit_reservation_payment",{p_reservation_id:reservation.id,p_amount:Number(amount),p_method:method,p_proof_path:path});if(error){await supabase.storage.from("payment-proofs").remove([path]);throw error;}
   window.location.reload();
  }catch(error){setMessage(error.message||"Payment proof could not be submitted.");}finally{setBusy(false);}
 }
 return paid>=limit?<p className="form-message">{reservation.status==="confirmed"?"The full trip balance is paid.":"The deposit is paid. The reservation remains subject to trip confirmation."}</p>:<form className="stack-form payment-form" onSubmit={submit}><label>Payment method<select value={method} onChange={e=>setMethod(e.target.value)}><option value="instapay">InstaPay</option><option value="bank_transfer">Bank transfer</option></select></label><label>Amount (EGP)<input type="number" min="1" max={Math.max(0,limit-paid)} step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Transfer receipt<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} required/><small>Private upload · JPG, PNG, or PDF · up to 5 MB</small></label><button className="button button-dark" disabled={busy}>{busy?"Submitting…":"Submit payment for review"} ↗</button>{message&&<p className="form-message" role="alert">{message}</p>}</form>;
}

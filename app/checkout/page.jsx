import {getPublicGovernorates} from "../../src/lib/data/public";
import CheckoutForm from "../../src/components/checkout-form";
export const metadata={title:"Checkout · Egyptian Discovery"};
export default async function CheckoutPage(){const areas=await getPublicGovernorates();return <CheckoutForm governorates={areas}/>;}

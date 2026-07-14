import { supabase } from "./supabase";
import { wilayas } from "algeria-locations";

export interface ShippingRate {
  wilaya_id: string;
  home_price: number;
  desk_price: number;
}

export async function getShippingRates(): Promise<ShippingRate[]> {
  try {
    const { data, error } = await supabase.from('shipping_rates').select('*');
    
    if (error) {
      console.warn("Shipping rates table not found or error fetching. Using defaults.", error);
      return getDefaultShippingRates();
    }
    
    if (data && data.length > 0) {
      // Merge with defaults in case some wilayas are missing
      const defaults = getDefaultShippingRates();
      const mapped = defaults.map(def => {
        const found = data.find(d => d.wilaya_id === def.wilaya_id);
        return found ? { ...def, ...found } : def;
      });
      return mapped;
    }
    
    return getDefaultShippingRates();
  } catch (err) {
    console.warn("Exception fetching shipping rates:", err);
    return getDefaultShippingRates();
  }
}

export async function updateShippingRate(wilaya_id: string, home_price: number, desk_price: number) {
  const { error } = await supabase
    .from('shipping_rates')
    .upsert({ wilaya_id, home_price, desk_price });
  
  if (error) throw error;
}

function getDefaultShippingRates(): ShippingRate[] {
  return wilayas.map(w => ({
    wilaya_id: w.id.toString(),
    home_price: 800,
    desk_price: 400
  }));
}

declare module 'algeria-locations' {
  export interface Wilaya {
    id: number;
    code: number;
    name_ar: string;
    name_en: string;
    name_ber?: string;
  }

  export interface Commune {
    id: number;
    code: number;
    name_ar: string;
    name_en: string;
    name_ber?: string;
    wilaya_id: number;
    daira_id: number;
  }

  export interface Daira {
    id: number;
    code: number;
    name_ar: string;
    name_en: string;
    name_ber?: string;
    wilaya_id: number;
  }

  export const wilayas: Wilaya[];
  export const communes: Commune[];
  export const dairas: Daira[];

  export function getWilayas(): Wilaya[];
  export function getCommunesByWilayaId(wilayaId: number): Commune[];
  export function getDairasByWilayaId(wilayaId: number): Daira[];
  export function getCommuneByCode(code: number): Commune | undefined;
  export function searchWilayaByName(name: string): Wilaya[];
  export function searchCommuneNames(name: string): Commune[];
  export function searchDairaNames(name: string): Daira[];
}
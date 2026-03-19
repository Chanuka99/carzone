// CarZone vehicle reference data

export const BRANDS = [
  { name: "Toyota", models: ["Corolla","Axio","Premio","Allion","Vitz","Aqua","Prius","Raize","CHR","Land Cruiser Prado","Land Cruiser","Rush","KDH","Hiace","Noah","Voxy","Other"] },
  { name: "Suzuki", models: ["Alto","Wagon R","Celerio","Swift","Every","Spacia","Other"] },
  { name: "Nissan", models: ["Sunny","X-Trail","Leaf","March","Dayz","Caravan","Other"] },
  { name: "Honda", models: ["Fit","Vezel","Civic","Grace","CR-V","Other"] },
  { name: "Mitsubishi", models: ["Lancer","Outlander","Montero","Pajero","Eclipse Cross","Other"] },
  { name: "Mazda", models: ["Demio","Axela","CX-5","Other"] },
  { name: "Hyundai", models: ["Grand i10","Eon","Tucson","Santa Fe","Other"] },
  { name: "Kia", models: ["Picanto","Sportage","Sorento","Other"] },
  { name: "Daihatsu", models: ["Mira","Tanto","Hijet","Other"] },
  { name: "Perodua", models: ["Axia","Bezza","Myvi","Other"] },
  { name: "BMW", models: ["3 Series","5 Series","X1","X5","Other"] },
  { name: "Mercedes-Benz", models: ["C-Class","E-Class","Other"] },
  { name: "Audi", models: ["A4","Q5","Other"] },
  { name: "Land Rover", models: ["Range Rover","Other"] },
  { name: "Other", models: ["Other"] },
] as const;

export type BrandName = (typeof BRANDS)[number]["name"];

export function getModels(brand: string): string[] {
  const found = BRANDS.find(b => b.name === brand);
  return found ? [...found.models] : ["Other"];
}

export const COLORS = [
  "White","Silver","Black","Gray","Red","Blue","Green",
  "Brown","Gold","Maroon","Navy Blue","Pearl White","Other",
];

export const FUEL_TYPES = ["Petrol","Diesel","Hybrid","Electric","Gas","Other"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSION_TYPES = ["Automatic","Manual","Tiptronic"] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const PAYMENT_TYPES = ["Full","Half"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const VEHICLE_TYPES = ["Sedan","Hatchback","SUV","Van","Pickup","Bus","Other"] as const;

/**
 * Calculate the 4 rate tiers from a monthly rate.
 * Tiers:
 *   Below 1 Week  (1–6 days):   M/30 + 2000
 *   Above 1 Week  (7–13 days):  M/30 + 1500
 *   Above 2 Weeks (14–29 days): M/30 + 1000
 *   1 Month       (30+ days):   M/30
 */
export function calcTiersFromMonthly(monthly: number) {
  const base = monthly / 30;
  return [
    { label: "Below 1 Week",  days_from: 1,  days_to: 6,    rate_per_day: Math.round(base + 2000) },
    { label: "Above 1 Week",  days_from: 7,  days_to: 13,   rate_per_day: Math.round(base + 1500) },
    { label: "Above 2 Weeks", days_from: 14, days_to: 29,   rate_per_day: Math.round(base + 1000) },
    { label: "1 Month",       days_from: 30, days_to: null, rate_per_day: Math.round(base) },
  ];
}

export const YEARS = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => 2026 - i); // 2026 down to 2000

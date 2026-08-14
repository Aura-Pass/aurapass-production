/**
 * Canonical list of Nigerian cities used across AuraPass.
 *
 * Every city input in the app (event creation/editing, artist available
 * locations, event discovery filter, artist booking filters) selects from this
 * single list so that location matching can be a reliable exact string compare
 * instead of fuzzy text matching.
 *
 * Coverage: all 36 state capitals + FCT, major secondary cities, and the Lagos
 * districts that matter for events specifically.
 */
export const NIGERIAN_CITIES: string[] = [
  // Lagos + districts
  "Lagos",
  "Ikeja",
  "Lekki",
  "Victoria Island",
  "Ikoyi",
  "Surulere",
  "Yaba",
  "Ajah",
  "Festac",
  "Ikorodu",
  "Badagry",
  "Epe",
  // Capitals and major cities
  "Abuja",
  "Ibadan",
  "Kano",
  "Port Harcourt",
  "Benin City",
  "Kaduna",
  "Enugu",
  "Aba",
  "Onitsha",
  "Nnewi",
  "Warri",
  "Sapele",
  "Ughelli",
  "Effurun",
  "Owerri",
  "Umuahia",
  "Uyo",
  "Eket",
  "Calabar",
  "Abeokuta",
  "Ijebu-Ode",
  "Sagamu",
  "Akure",
  "Ondo",
  "Ilorin",
  "Offa",
  "Jos",
  "Maiduguri",
  "Zaria",
  "Sokoto",
  "Katsina",
  "Bauchi",
  "Yola",
  "Gombe",
  "Jalingo",
  "Lafia",
  "Lokoja",
  "Minna",
  "Makurdi",
  "Awka",
  "Asaba",
  "Yenagoa",
  "Ado-Ekiti",
  "Osogbo",
  "Ile-Ife",
  "Iwo",
  "Ogbomoso",
  "Oyo",
  "Ekpoma",
  "Nsukka",
  "Okene",
  "Wukari",
  "Gusau",
  "Damaturu",
  "Birnin Kebbi",
  "Dutse",
  "Abakaliki",
  "Ikot Ekpene",
  "Others",
].sort((a, b) => a.localeCompare(b));

/** Normalised comparison for city values coming from the canonical list. */
export function citiesMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

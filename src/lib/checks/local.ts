import type { Issue } from "@/lib/schemas";
import { collapseWhitespace, MAX_EVIDENCE_ITEMS, truncate, type ParsedPage } from "./page";
import { makeIssue } from "./registry";

// LocalBusiness and the subtypes small businesses use most (schema.org).
const LOCAL_BUSINESS_TYPES = new Set(
  [
    "LocalBusiness", "AnimalShelter", "AutomotiveBusiness", "AutoRepair", "AutoDealer", "AutoBodyShop",
    "ChildCare", "Dentist", "DryCleaningOrLaundry", "EmergencyService", "EmploymentAgency",
    "EntertainmentBusiness", "FinancialService", "AccountingService", "InsuranceAgency", "FoodEstablishment",
    "Bakery", "BarOrPub", "CafeOrCoffeeShop", "FastFoodRestaurant", "IceCreamShop", "Restaurant", "Winery",
    "GovernmentOffice", "HealthAndBeautyBusiness", "BeautySalon", "DaySpa", "HairSalon", "HealthClub",
    "NailSalon", "TattooParlor", "HomeAndConstructionBusiness", "Electrician", "GeneralContractor",
    "HVACBusiness", "HousePainter", "Locksmith", "MovingCompany", "Plumber", "RoofingContractor",
    "LegalService", "Attorney", "Notary", "LodgingBusiness", "Hotel", "Motel", "BedAndBreakfast",
    "MedicalBusiness", "MedicalClinic", "Optician", "Pharmacy", "Physician", "Hospital",
    "ProfessionalService", "RealEstateAgent", "SelfStorage", "ShoppingCenter", "SportsActivityLocation",
    "Store", "BookStore", "ClothingStore", "ElectronicsStore", "Florist", "FurnitureStore", "GardenStore",
    "GroceryStore", "HardwareStore", "JewelryStore", "PetStore", "ShoeStore", "SportingGoodsStore",
    "ToyStore", "TravelAgency", "VeterinaryCare",
  ].map((type) => type.toLowerCase()),
);

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Every object in the page's JSON-LD blocks, including @graph members and nested values. */
function jsonLdNodes({ $ }: ParsedPage): JsonObject[] {
  const nodes: JsonObject[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 6) return;
    if (Array.isArray(value)) value.forEach((item) => visit(item, depth + 1));
    else if (isObject(value)) {
      nodes.push(value);
      Object.values(value).forEach((child) => visit(child, depth + 1));
    }
  };
  $('script[type="application/ld+json" i]').each((_, el) => {
    try {
      visit(JSON.parse($(el).text()), 0);
    } catch {
      // Broken JSON-LD is treated as absent.
    }
  });
  return nodes;
}

function typesOf(node: JsonObject): string[] {
  const type = node["@type"];
  const list = Array.isArray(type) ? type : [type];
  return list.filter((value): value is string => typeof value === "string");
}

function isLocalBusiness(node: JsonObject): boolean {
  return typesOf(node).some((type) => LOCAL_BUSINESS_TYPES.has(type.replace(/^.*[/#:]/, "").toLowerCase()));
}

const PHONE_PATTERN = /\+?\d[\d\s().-]{6,}\d/;
const MAP_PATTERN = /(google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl)/i;

export function localChecks(page: ParsedPage): Issue[] {
  const { $ } = page;
  const businesses = jsonLdNodes(page).filter(isLocalBusiness);
  const business = businesses[0];

  const telLinks = $('a[href^="tel:" i]')
    .toArray()
    .map((el) => truncate($(el).attr("href") ?? "", 40));
  const visibleText = collapseWhitespace($("body").text());
  const visiblePhone = PHONE_PATTERN.test(visibleText);

  const addressElement = collapseWhitespace($("address").first().text());
  const schemaAddress = businesses.some((node) => node["address"] !== undefined);
  const schemaHours = businesses.some(
    (node) => node["openingHours"] !== undefined || node["openingHoursSpecification"] !== undefined,
  );

  const maps = [
    ...$("a[href]").toArray().map((el) => $(el).attr("href") ?? ""),
    ...$("iframe[src]").toArray().map((el) => $(el).attr("src") ?? ""),
  ].filter((value) => MAP_PATTERN.test(value));

  return [
    makeIssue("local.schema.missing", Boolean(business), {
      types: business ? typesOf(business).slice(0, MAX_EVIDENCE_ITEMS) : [],
    }),
    makeIssue("local.phone.missing", telLinks.length > 0, {
      telLinks: telLinks.slice(0, MAX_EVIDENCE_ITEMS),
      phoneNumberInText: visiblePhone,
    }),
    makeIssue("local.address.missing", schemaAddress || Boolean(addressElement), {
      inStructuredData: schemaAddress,
      ...(addressElement ? { addressElement: truncate(addressElement, 160) } : {}),
    }),
    makeIssue("local.hours.missing", schemaHours, { inStructuredData: schemaHours }),
    makeIssue("local.map.missing", maps.length > 0, { links: maps.slice(0, MAX_EVIDENCE_ITEMS).map((u) => truncate(u)) }),
  ];
}

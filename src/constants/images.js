/**
 * Sulfag image library — warm agriculture aligned with brown brand (#5C4033, #F3E9DC).
 * All Unsplash IDs verified (200 OK on images.unsplash.com).
 */

const UNSPLASH = 'https://images.unsplash.com'

export const PHOTOS = {
  /** Young seedlings in fertile brown soil — hero */
  soilSeedlings: 'photo-1748873611377-a7d28d1537b2',
  /** Hands planting in garden soil */
  handsPlanting: 'photo-1611843467160-25afb8df1074',
  /** Green shoots on brown soil */
  plantOnSoil: 'photo-1613036582025-ba1d4ccb3226',
  /** Brown wheat at sunset — section backgrounds */
  wheatSunset: 'photo-1596969159760-99bc3126cc7b',
  /** Harvest field */
  harvestField: 'photo-1574943320219-553eb213f72d',
  /** Golden grain */
  goldenGrain: 'photo-1574323347407-f5e1ad6d020b',
  /** Rolling farmland */
  farmland: 'photo-1542601906990-b4d3fb778b09',
}

export function imageUrl(photoId, width = 1920) {
  return `${UNSPLASH}/${photoId}?w=${width}&q=85&auto=format&fit=crop`
}

/** Hero — soil & young plants (landing page) */
export const HERO_BACKGROUND = imageUrl(PHOTOS.soilSeedlings)

/** Page header backgrounds (products, about, contact) */
export const PAGE_HEADER_BACKGROUND = imageUrl(PHOTOS.plantOnSoil)

export const INDUSTRY_BACKGROUND = imageUrl(PHOTOS.wheatSunset)
export const FACILITY_BACKGROUND = imageUrl(PHOTOS.goldenGrain)

/** About page content images */
export const ABOUT_SNIPPET_IMAGE = imageUrl(PHOTOS.handsPlanting, 1200)
export const ABOUT_HERO_IMAGE = imageUrl(PHOTOS.harvestField, 1200)
export const ABOUT_LIQUID_IMAGE = imageUrl(PHOTOS.goldenGrain, 1200)
export const ABOUT_POWDER_IMAGE = imageUrl(PHOTOS.harvestField, 1200)

/** Original category card images (unchanged from pre-theme version) */
export const CATEGORY_IMAGES = {
  insecticides:
    'https://plus.unsplash.com/premium_photo-1661942064041-a15c0c93d2a5?fm=jpg&q=80&w=1200&fit=crop&ixlib=rb-4.1.0',
  fungicides:
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=800&fit=crop&q=90&auto=format',
  herbicides:
    'https://tse1.mm.bing.net/th/id/OIP.UHaGoa9dW6pXDCap41rHyAHaE8?pid=Api&rs=1',
  specialty:
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&h=800&fit=crop&q=90&auto=format',
}

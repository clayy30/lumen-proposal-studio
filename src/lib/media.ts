/**
 * Curated real-world solar / home photography (Unsplash — free commercial use).
 * Actual photos, not illustrations — for in-home proposal credibility.
 */

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

export const SOLAR_MEDIA = {
  /** Modern home exterior — cover hero */
  heroHome: u("photo-1613665813446-82a78c468a1d", 1800),
  /** Rooftop solar array, strong product shot */
  roofGolden: u("photo-1509391366360-2e959784a276", 1600),
  /** Aerial / wide solar on structure */
  aerialHome: u("photo-1508514177221-188b1cf16e9d", 1600),
  /** Solar farm rows — scale & professionalism */
  installer: u("photo-1466611653911-95081537e5b7", 1400),
  /** Module close detail */
  panelDetail: u("photo-1509391366360-2e959784a276", 1200),
  /** Dark roof modern array */
  modernArray: u("photo-1559302504-64aae6ca6b6d", 1600),
  /** Beautiful residential exterior */
  lifestyleHome: u("photo-1564013799919-ab600027ffc6", 1600),
  /** Clean tech / EV energy lifestyle */
  batteryTech: u("photo-1593941707882-a5bba14938c7", 1400),
  /** Suburban home */
  neighborhood: u("photo-1570129477492-45c003edd2be", 1600),
  /** Nature / environmental */
  nature: u("photo-1441974231531-c6227db76b6e", 1400),
  /** Craftsmanship / construction quality */
  craft: u("photo-1504307651254-35680f356dfd", 1400),
  /** Second strong array shot */
  arrayAlt: u("photo-1497435334941-8c899ee9e8e9", 1600),
} as const;

export const GALLERY: Array<{ src: string; caption: string }> = [
  {
    src: SOLAR_MEDIA.modernArray,
    caption: "Premium black modules, low-profile racking",
  },
  {
    src: SOLAR_MEDIA.aerialHome,
    caption: "Clean array geometry sized to real usage",
  },
  {
    src: SOLAR_MEDIA.arrayAlt,
    caption: "Production-grade systems, professional finish",
  },
  {
    src: SOLAR_MEDIA.lifestyleHome,
    caption: "Designed to look like it belongs on your home",
  },
];

export const PROCESS_STEPS: Array<{
  title: string;
  body: string;
  src: string;
}> = [
  {
    title: "Site & design",
    body: "We confirm roof geometry, usage, and utility rules — then lock a production-ready layout.",
    src: SOLAR_MEDIA.aerialHome,
  },
  {
    title: "Permits & utility",
    body: "We handle applications, HOA packages when needed, and interconnection paperwork.",
    src: SOLAR_MEDIA.craft,
  },
  {
    title: "Install day",
    body: "Typically 1–2 days on site. Crews protect landscaping and leave the property clean.",
    src: SOLAR_MEDIA.installer,
  },
  {
    title: "Inspection & power",
    body: "Final inspection, utility PTO, app monitoring — you watch production from day one.",
    src: SOLAR_MEDIA.panelDetail,
  },
];

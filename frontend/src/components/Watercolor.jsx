/**
 * Real watercolor assets uploaded by the client. Each exported component
 * accepts a `className` and renders a plain <img>. Component names are
 * unchanged so the rest of the app doesn't need updates; a few extra
 * variants are exported for richer pillar/journey imagery.
 *
 * Mapping:
 *  - home page.webp                  → WatercolorEstuary   (hero landscape)
 *  - About therapy art.png           → WatercolorRiver     (wide river band)
 *  - watercolour stamp 9.png         → WatercolorRipple    (2 birds by water, small)
 *  - watercolour stamp 3.png         → WatercolorBird      (single bird on branch)
 *  - watercolour stamp 4.png         → WatercolorPair      (two birds on eucalyptus)
 *  - watercolour stamp 2.png         → WatercolorFlock     (three birds among leaves)
 *  - about therapy page art 2.png    → WatercolorBirdsLarge (three bluebirds hero art)
 *  - about therapy hero art.png      → WatercolorEucalyptus (eucalyptus + berries + bird)
 *  - watercolour art 3.png           → WatercolorSapling   (sapling on soil)
 *  - watercolour stamp 6.png         → WatercolorStamp     (tiny mark, dashboard accents)
 */

const ASSET = {
  estuary:      "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/tn8yiytw_home%20page.webp",
  river:        "https://customer-assets-cm19k8pv.emergentagent.net/job_5324cc8f-7830-4d4f-b5e3-d39decfbd68c/artifacts/12pmwvam_About%20therapy%20art.png",
  ripple:       "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/cc1b59cn_watercolour%20stamp%209.png",
  bird:         "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/paqx9jpy_Watercolour%20stamp%203.png",
  pair:         "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/smnsogc8_Watercolour%20stamp%204.png",
  flock:        "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/4rgnzfk3_Watercolour%20stamp%202.png",
  birdsLarge:   "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/9xb9ghh1_about%20therapy%20page%20art%202.png",
  eucalyptus:   "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/49x3kmri_about%20therapy%20hero%20art.png",
  sapling:      "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/2j39iv5k_watercolour%20art%203.png",
  stamp:        "https://customer-assets-wrfwihn1.emergentagent.net/job_calm-therapy-app/artifacts/4atr4rz7_watercolour%20stamp%206.png",
};

const Img = ({ src, alt, className = "", position = "center", contain = true, style }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    className={`w-full h-full ${contain ? "object-contain" : "object-cover"} select-none pointer-events-none ${className}`}
    style={{ objectPosition: position, ...(style || {}) }}
    draggable={false}
  />
);

/** Hero landscape — full-bleed background for home hero + login side panel. */
export function WatercolorEstuary({ className = "", position = "center 22%" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.estuary} alt="" contain={false} position={position} />
    </div>
  );
}

/** Wide river ribbon — decorative continuity band. */
export function WatercolorRiver({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.river} alt="" />
    </div>
  );
}

/** Two bluebirds beside a rippling pool — used for the 'Reflect' motif. */
export function WatercolorRipple({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.ripple} alt="" />
    </div>
  );
}

/** Single bird on a branch — the 'Guidance' motif. */
export function WatercolorBird({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.bird} alt="" />
    </div>
  );
}

/** Two birds side by side — used for 'Book' / relational moments. */
export function WatercolorPair({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.pair} alt="" />
    </div>
  );
}

/** Small flock of three flying birds — 'Understanding' / departure motif. */
export function WatercolorFlock({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.flock} alt="" />
    </div>
  );
}

/** Larger bluebirds composition — pillar / editorial cards. */
export function WatercolorBirdsLarge({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.birdsLarge} alt="" />
    </div>
  );
}

/** Eucalyptus + berries + bird — hero side art. */
export function WatercolorEucalyptus({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.eucalyptus} alt="" position="right center" />
    </div>
  );
}

/** Sapling on soft ground — the 'Progress / Growth' motif. */
export function WatercolorSapling({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.sapling} alt="" />
    </div>
  );
}

/** Tiny decorative stamp — dashboard accents, footer marks. */
export function WatercolorStamp({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <Img src={ASSET.stamp} alt="" />
    </div>
  );
}

/** Backwards-compatible alias so pages that use WatercolorBridge keep working —
 *  now shows two birds together, which reads well as 'meeting / booking'. */
export function WatercolorBridge({ className = "" }) {
  return <WatercolorPair className={className} />;
}

/** Slim decorative flock line — remains SVG so it can scale inline precisely. */
export function BirdFlock({ className = "" }) {
  return (
    <svg viewBox="0 0 400 60" className={className} aria-hidden>
      <g fill="none" stroke="#1C3829" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
        <path d="M20 30 q10 -8 20 0 q10 -8 20 0"/>
        <path d="M110 22 q9 -8 18 0 q9 -8 18 0"/>
        <path d="M200 30 q11 -9 22 0 q11 -9 22 0"/>
        <path d="M300 20 q8 -7 16 0 q8 -7 16 0"/>
        <path d="M360 32 q7 -6 14 0 q7 -6 14 0"/>
      </g>
    </svg>
  );
}

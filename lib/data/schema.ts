import { z } from 'zod';

/**
 * Data model for one imported annotation edition (`data/coffins/<slug>.json`).
 *
 * The shapes mirror what `scripts/import-nederhof.mjs` extracts from the published
 * St Andrews editions. Coordinates stay in the source model's space; the viewer applies
 * the display transform at render time (see `lib/scene/orientation.ts`).
 */

const finite = z.number().finite();
const vec3 = z.tuple([finite, finite, finite]);

/** One boundary edge of a surface region: start xyz followed by end xyz, in model space. */
export const RegionEdgeSchema = z.array(finite).length(6);

export const RegionSchema = z.object({
  id: z.string().min(1),
  /** Id of the annotation entry this surface belongs to. */
  textId: z.string().min(1),
  /** Viewing direction recorded by the source edition (points into the surface). */
  direction: vec3,
  rotation: finite,
  /** Dash style used by the source viewer when drawing the outline. */
  dash: z.number().int(),
  /** Closed polygon as consecutive edges. */
  lines: z.array(RegionEdgeSchema).min(3),
});

export const FragmentSchema = z.object({
  /** ResLite encoding consumed by Nederhof's renderer; empty when Unicode is used. */
  hieroglyphs: z.string(),
  /** Unicode hieroglyphs (Amenirdis edition); empty when ResLite is used. */
  hieroglyphUnicode: z.string(),
  transliteration: z.string(),
  translation: z.string(),
});

export const AnnotationKindSchema = z.enum(['inscription', 'interpretation', 'vocabulary']);

export const AnnotationSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  kind: AnnotationKindSchema,
  description: z.string(),
  fragments: z.array(FragmentSchema),
  /** Surface regions where this entry occurs. One entry can occur in several places. */
  areaIds: z.array(z.string().min(1)).min(1),
});

export const ModelSettingsSchema = z.object({
  /** Base file name (without extension) of the OBJ/MTL pair in `public/models/<slug>/`. */
  name: z.string().min(1),
  /** Source orientation quaternion (x, y, z, w). */
  quaternion: z.tuple([finite, finite, finite, finite]),
  /** Raw viewer settings from the source edition; indices 6 and 13 encode initial tilt. */
  settings: z.array(finite).min(14).max(15),
});

export const CoffinDataSchema = z.object({
  slug: z.string().min(1),
  source: z.string().url(),
  model: ModelSettingsSchema,
  areas: z.array(RegionSchema),
  annotations: z.array(AnnotationSchema),
});

export type Region = z.infer<typeof RegionSchema>;
export type Fragment = z.infer<typeof FragmentSchema>;
export type AnnotationKind = z.infer<typeof AnnotationKindSchema>;
export type Annotation = z.infer<typeof AnnotationSchema>;
export type ModelSettings = z.infer<typeof ModelSettingsSchema>;
export type CoffinData = z.infer<typeof CoffinDataSchema>;

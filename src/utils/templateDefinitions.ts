import type { EditorDocument, EditorElement } from '../types/editor';
import type { CarouselTemplate } from '../types/template';
import { idbGet, idbPut } from './storage';
import { assetFromBlob } from './image';
import { drawImageHolder } from './imageHolder';

function baseElement(partial: Pick<EditorElement, 'id' | 'name' | 'x' | 'y' | 'width' | 'height'>) {
  return {
    ...partial,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };
}

// -------------------------------------------------------------
// TEMPLATE 1: TORN ROMANCE (Terracotta & Torn Paper Collage)
// -------------------------------------------------------------
function createTornRomanceDoc(): EditorDocument {
  return {
    name: 'Torn Romance',
    canvas: {
      format: 'portrait',
      slideWidth: 1080,
      slideHeight: 1350,
      slideCount: 10,
      background: {
        type: 'solid',
        color: '#f8f6f2',
        gradientFrom: '#f8f6f2',
        gradientTo: '#ece8e1',
        angle: 90,
        imageId: null,
      },
    },
    elements: [
      // Slide 1 (0..1080): Full Bleed Couple Close-up
      {
        ...baseElement({ id: 't1-p1', name: 'Slide 1 • Close-up Portrait', x: 0, y: 0, width: 1080, height: 1350 }),
        type: 'image',
        imageId: 't1_photo_1',
        lockAspect: false,
        aspectRatio: 1080 / 1350,
      },
      {
        ...baseElement({ id: 't1-t1-kicker', name: 'Slide 1 • Kicker', x: 90, y: 110, width: 600, height: 40 }),
        type: 'text',
        text: 'CHAPTER 01 • INTIMATE MEMORIES',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 20,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 6,
        lineHeight: 1.2,
        fill: '#ffffff',
      },
      {
        ...baseElement({ id: 't1-t1-title', name: 'Slide 1 • Title', x: 88, y: 160, width: 880, height: 120 }),
        type: 'text',
        text: 'FOREVER',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 92,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 10,
        lineHeight: 1,
        fill: '#ffffff',
      },
      {
        ...baseElement({ id: 't1-t1-num', name: 'Slide 1 • Slide Num', x: 920, y: 1240, width: 80, height: 40 }),
        type: 'text',
        text: '01',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 22,
        fontWeight: 600,
        align: 'right',
        letterSpacing: 2,
        lineHeight: 1,
        fill: 'rgba(255,255,255,0.7)',
      },

      // Slide 2 (1080..2160): Overlapping Torn Paper Photo
      {
        ...baseElement({ id: 't1-s2-frame', name: 'Slide 2 • Paper Matting', x: 1120, y: 60, width: 900, height: 1230 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 4,
      },
      {
        ...baseElement({ id: 't1-p2', name: 'Slide 2 • Embracing with Hat', x: 1140, y: 80, width: 860, height: 1190 }),
        type: 'image',
        imageId: 't1_photo_2',
        lockAspect: false,
        aspectRatio: 860 / 1190,
      },
      {
        ...baseElement({ id: 't1-t2-sub', name: 'Slide 2 • Caption', x: 1200, y: 1160, width: 700, height: 50 }),
        type: 'text',
        text: 'IN YOUR ARMS, THE WORLD STOPS',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 26,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 4,
        lineHeight: 1.2,
        fill: '#ffffff',
      },

      // Slide 3 (2160..3240): Seaside Rocks Couple
      {
        ...baseElement({ id: 't1-p3', name: 'Slide 3 • Rocky Shore', x: 2160, y: 0, width: 1080, height: 1350 }),
        type: 'image',
        imageId: 't1_photo_3',
        lockAspect: false,
        aspectRatio: 1080 / 1350,
      },
      {
        ...baseElement({ id: 't1-t3-text', name: 'Slide 3 • Title', x: 2260, y: 150, width: 760, height: 80 }),
        type: 'text',
        text: 'THE OCEAN BREEZE',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 44,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 6,
        lineHeight: 1.1,
        fill: '#ffffff',
      },

      // Slide 4-5 Seamless Panorama Spanning across Seam (3240..5400)
      {
        ...baseElement({ id: 't1-p4', name: 'Slide 4-5 • Coastal Panorama (Seam Span)', x: 3240, y: 0, width: 1620, height: 1350 }),
        type: 'image',
        imageId: 't1_photo_4',
        lockAspect: false,
        aspectRatio: 1620 / 1350,
      },
      {
        ...baseElement({ id: 't1-t4-span', name: 'Slide 4 • Panorama Label', x: 3380, y: 1180, width: 800, height: 50 }),
        type: 'text',
        text: 'SEAMLESS HORIZON',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 22,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 6,
        lineHeight: 1,
        fill: '#ffffff',
      },

      // Slide 5 (4320..5400): Cliff Edge Photo Card
      {
        ...baseElement({ id: 't1-s5-frame', name: 'Slide 5 • Frame', x: 4500, y: 100, width: 800, height: 1150 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 6,
      },
      {
        ...baseElement({ id: 't1-p5', name: 'Slide 5 • Distant Horizon', x: 4520, y: 120, width: 760, height: 1110 }),
        type: 'image',
        imageId: 't1_photo_5',
        lockAspect: false,
        aspectRatio: 760 / 1110,
      },

      // Slide 6 (5400..6480): Sitting by the Waves with Bouquet
      {
        ...baseElement({ id: 't1-s6-card', name: 'Slide 6 • Torn Card Mat', x: 5520, y: 80, width: 880, height: 1190 }),
        type: 'shape',
        shape: 'rect',
        fill: '#fcfaf6',
        cornerRadius: 4,
      },
      {
        ...baseElement({ id: 't1-p6', name: 'Slide 6 • Ocean Sitting Portrait', x: 5540, y: 100, width: 840, height: 1150 }),
        type: 'image',
        imageId: 't1_photo_6',
        lockAspect: false,
        aspectRatio: 840 / 1150,
      },

      // Slide 7 (6480..7560): Couple in Warm Knitwear
      {
        ...baseElement({ id: 't1-p7', name: 'Slide 7 • Knitwear & Florals', x: 6580, y: 60, width: 880, height: 1230 }),
        type: 'image',
        imageId: 't1_photo_7',
        lockAspect: false,
        aspectRatio: 880 / 1230,
      },
      {
        ...baseElement({ id: 't1-t7-kicker', name: 'Slide 7 • Kicker', x: 6620, y: 160, width: 700, height: 40 }),
        type: 'text',
        text: 'TIMELESS CONNECTION',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 22,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 5,
        lineHeight: 1,
        fill: '#2c2724',
      },

      // Slide 8 (7560..8640): Intimate Embrace Close
      {
        ...baseElement({ id: 't1-p8', name: 'Slide 8 • Amber Knit Embrace', x: 7560, y: 0, width: 1080, height: 1350 }),
        type: 'image',
        imageId: 't1_photo_8',
        lockAspect: false,
        aspectRatio: 1080 / 1350,
      },
      {
        ...baseElement({ id: 't1-t8-title', name: 'Slide 8 • Title', x: 7700, y: 1150, width: 800, height: 70 }),
        type: 'text',
        text: 'CLOSER STILL',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 54,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 6,
        lineHeight: 1,
        fill: '#f7f1e8',
      },

      // Slide 9 (8640..9720): Stacked Dual Mini Photos
      {
        ...baseElement({ id: 't1-s9-frame1', name: 'Slide 9 • Top Polaroid Frame', x: 8740, y: 80, width: 860, height: 580 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 4,
      },
      {
        ...baseElement({ id: 't1-p9', name: 'Slide 9 • Top Mini Moment', x: 8760, y: 100, width: 820, height: 540 }),
        type: 'image',
        imageId: 't1_photo_9',
        lockAspect: false,
        aspectRatio: 820 / 540,
      },
      {
        ...baseElement({ id: 't1-s9-frame2', name: 'Slide 9 • Bottom Mat Frame', x: 8740, y: 720, width: 860, height: 550 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 4,
      },
      {
        ...baseElement({ id: 't1-t9-quote', name: 'Slide 9 • Editorial Quote', x: 8820, y: 860, width: 700, height: 160 }),
        type: 'text',
        text: '“Every breath, every second,\nwe write a timeless story.”',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 34,
        fontWeight: 500,
        align: 'center',
        letterSpacing: 2,
        lineHeight: 1.3,
        fill: '#423730',
      },

      // Slide 10 (9720..10800): Final Sunset Embrace
      {
        ...baseElement({ id: 't1-p10', name: 'Slide 10 • Sunset Embrace', x: 9720, y: 0, width: 1080, height: 1350 }),
        type: 'image',
        imageId: 't1_photo_10',
        lockAspect: false,
        aspectRatio: 1080 / 1350,
      },
      {
        ...baseElement({ id: 't1-t10-sign', name: 'Slide 10 • Signature Title', x: 9860, y: 580, width: 800, height: 100 }),
        type: 'text',
        text: 'ALWAYS & FOREVER',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 54,
        fontWeight: 600,
        align: 'center',
        letterSpacing: 6,
        lineHeight: 1.1,
        fill: '#ffffff',
      },
      {
        ...baseElement({ id: 't1-t10-sub', name: 'Slide 10 • Action Kicker', x: 9860, y: 700, width: 800, height: 40 }),
        type: 'text',
        text: 'TAP TO SAVE FOR INSPIRATION',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
        fontWeight: 600,
        align: 'center',
        letterSpacing: 5,
        lineHeight: 1,
        fill: 'rgba(255,255,255,0.85)',
      },
    ],
  };
}

// -------------------------------------------------------------
// TEMPLATE 2: MODERN NOIR (High-Contrast Film Editorial)
// -------------------------------------------------------------
function createModernNoirDoc(): EditorDocument {
  return {
    name: 'Modern Noir',
    canvas: {
      format: 'portrait',
      slideWidth: 1080,
      slideHeight: 1350,
      slideCount: 10,
      background: {
        type: 'solid',
        color: '#f6f4f0',
        gradientFrom: '#f6f4f0',
        gradientTo: '#e9e6e0',
        angle: 90,
        imageId: null,
      },
    },
    elements: [
      // Slide 1 (0..1080): Golden Silk Drapery Side Portrait
      {
        ...baseElement({ id: 't2-p1', name: 'Slide 1 • Silk Drape Portrait', x: 0, y: 0, width: 1080, height: 1350 }),
        type: 'image',
        imageId: 't2_photo_1',
        lockAspect: false,
        aspectRatio: 1080 / 1350,
      },
      {
        ...baseElement({ id: 't2-t1-kicker', name: 'Slide 1 • Kicker', x: 90, y: 130, width: 500, height: 40 }),
        type: 'text',
        text: 'CINEMATIC ESSAY • ISSUE 04',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 5,
        lineHeight: 1,
        fill: '#e2c488',
      },
      {
        ...baseElement({ id: 't2-t1-title', name: 'Slide 1 • Title', x: 88, y: 180, width: 800, height: 170 }),
        type: 'text',
        text: 'NOIR\n& BLANC',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 90,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 6,
        lineHeight: 0.95,
        fill: '#ffffff',
      },

      // Slide 2 (1080..2160): Floating Offset Film Cards
      {
        ...baseElement({ id: 't2-s2-f1', name: 'Slide 2 • Top Card Frame', x: 1210, y: 120, width: 560, height: 720 }),
        type: 'shape',
        shape: 'rect',
        fill: '#111111',
        cornerRadius: 2,
      },
      {
        ...baseElement({ id: 't2-p2', name: 'Slide 2 • Upper Detail', x: 1220, y: 130, width: 540, height: 700 }),
        type: 'image',
        imageId: 't2_photo_2',
        lockAspect: false,
        aspectRatio: 540 / 700,
      },
      {
        ...baseElement({ id: 't2-s2-f2', name: 'Slide 2 • Lower Card Frame', x: 1510, y: 600, width: 540, height: 600 }),
        type: 'shape',
        shape: 'rect',
        fill: '#111111',
        cornerRadius: 2,
      },
      {
        ...baseElement({ id: 't2-p3', name: 'Slide 2 • Lower Detail', x: 1520, y: 610, width: 520, height: 580 }),
        type: 'image',
        imageId: 't2_photo_3',
        lockAspect: false,
        aspectRatio: 520 / 580,
      },
      {
        ...baseElement({ id: 't2-t2-caption', name: 'Slide 2 • Editorial Note', x: 1220, y: 1220, width: 700, height: 40 }),
        type: 'text',
        text: 'FIGURE II • STUDY IN TEXTURE AND SHADOW',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 4,
        lineHeight: 1,
        fill: '#111111',
      },

      // Slide 3 (2160..3240): Deep Moody Hands & Rings Close-up
      {
        ...baseElement({ id: 't2-s3-frame', name: 'Slide 3 • Film Backing', x: 2300, y: 140, width: 800, height: 1040 }),
        type: 'shape',
        shape: 'rect',
        fill: '#0f0f0f',
        cornerRadius: 0,
      },
      {
        ...baseElement({ id: 't2-p4', name: 'Slide 3 • Hands Close-up', x: 2320, y: 160, width: 760, height: 1000 }),
        type: 'image',
        imageId: 't2_photo_4',
        lockAspect: false,
        aspectRatio: 760 / 1000,
      },
      {
        ...baseElement({ id: 't2-t3-text', name: 'Slide 3 • Caption', x: 2320, y: 1210, width: 760, height: 40 }),
        type: 'text',
        text: 'THE SILENCE OF TOUCH',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 22,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 3,
        lineHeight: 1,
        fill: '#111111',
      },

      // Slide 4 (3240..4320): Staggered Turtleneck Portraits
      {
        ...baseElement({ id: 't2-p5', name: 'Slide 4 • Lower Left Portrait', x: 3360, y: 520, width: 540, height: 700 }),
        type: 'image',
        imageId: 't2_photo_5',
        lockAspect: false,
        aspectRatio: 540 / 700,
      },
      {
        ...baseElement({ id: 't2-p6', name: 'Slide 4 • Upper Right Portrait', x: 3740, y: 100, width: 520, height: 680 }),
        type: 'image',
        imageId: 't2_photo_6',
        lockAspect: false,
        aspectRatio: 520 / 680,
      },

      // Slide 5 (4320..5400): Curved Doorway Arch Silhouette
      {
        ...baseElement({ id: 't2-s5-frame', name: 'Slide 5 • Arch Frame', x: 4480, y: 140, width: 760, height: 1070 }),
        type: 'shape',
        shape: 'rect',
        fill: '#111111',
        cornerRadius: 48,
      },
      {
        ...baseElement({ id: 't2-p7', name: 'Slide 5 • Doorway Silhouette', x: 4500, y: 160, width: 720, height: 1030 }),
        type: 'image',
        imageId: 't2_photo_7',
        lockAspect: false,
        aspectRatio: 720 / 1030,
      },

      // Slide 6 (5400..6480): Deep Shadows
      {
        ...baseElement({ id: 't2-s6-frame', name: 'Slide 6 • Shadow Frame', x: 5560, y: 140, width: 760, height: 1040 }),
        type: 'shape',
        shape: 'rect',
        fill: '#111111',
        cornerRadius: 0,
      },
      {
        ...baseElement({ id: 't2-p8', name: 'Slide 6 • Shadow Portrait', x: 5580, y: 160, width: 720, height: 1000 }),
        type: 'image',
        imageId: 't2_photo_8',
        lockAspect: false,
        aspectRatio: 720 / 1000,
      },

      // Slide 7 (6480..7560): Minimalist Negative Space & Offset Portrait
      {
        ...baseElement({ id: 't2-t7-kicker', name: 'Slide 7 • Editorial Heading', x: 6600, y: 220, width: 600, height: 40 }),
        type: 'text',
        text: 'SERIES 02 • THE OUTDOORS',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 20,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 5,
        lineHeight: 1,
        fill: '#111111',
      },
      {
        ...baseElement({ id: 't2-t7-quote', name: 'Slide 7 • Statement', x: 6600, y: 280, width: 780, height: 120 }),
        type: 'text',
        text: 'Where contrast dissolves\ninto open sky.',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 40,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 1,
        lineHeight: 1.15,
        fill: '#111111',
      },

      // Slide 8-9 (7560..9720): Panoramic Meadow Embrace Spanning across Slides 8 & 9!
      {
        ...baseElement({ id: 't2-p9', name: 'Slide 8-9 • Meadow Romance Panorama', x: 7700, y: 100, width: 1900, height: 1150 }),
        type: 'image',
        imageId: 't2_photo_9',
        lockAspect: false,
        aspectRatio: 1900 / 1150,
      },
      {
        ...baseElement({ id: 't2-t9-title', name: 'Slide 8 • Panorama Title', x: 7840, y: 1100, width: 1400, height: 60 }),
        type: 'text',
        text: 'WRAPPED IN GOLDEN LIGHT',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 42,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 6,
        lineHeight: 1,
        fill: '#ffffff',
      },

      // Slide 10 (9720..10800): Minimalist Closing Photo Card
      {
        ...baseElement({ id: 't2-s10-frame', name: 'Slide 10 • Small Card Frame', x: 9940, y: 390, width: 640, height: 740 }),
        type: 'shape',
        shape: 'rect',
        fill: '#111111',
        cornerRadius: 0,
      },
      {
        ...baseElement({ id: 't2-p10', name: 'Slide 10 • Courtyard Silhouette', x: 9950, y: 400, width: 620, height: 720 }),
        type: 'image',
        imageId: 't2_photo_10',
        lockAspect: false,
        aspectRatio: 620 / 720,
      },
      {
        ...baseElement({ id: 't2-t10-fin', name: 'Slide 10 • Fin', x: 9880, y: 240, width: 760, height: 80 }),
        type: 'text',
        text: 'FIN',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 68,
        fontWeight: 600,
        align: 'center',
        letterSpacing: 12,
        lineHeight: 1,
        fill: '#111111',
      },
      {
        ...baseElement({ id: 't2-t10-sub', name: 'Slide 10 • Swipe Back', x: 9880, y: 1200, width: 760, height: 40 }),
        type: 'text',
        text: 'SWIPE BACK TO BEGIN',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
        fontWeight: 600,
        align: 'center',
        letterSpacing: 5,
        lineHeight: 1,
        fill: '#777777',
      },
    ],
  };
}

// -------------------------------------------------------------
// TEMPLATE 3: CHÂTEAU CLASSIC (Architectural Symmetry & Romance)
// -------------------------------------------------------------
function createChateauClassicDoc(): EditorDocument {
  return {
    name: 'Château Romance',
    canvas: {
      format: 'portrait',
      slideWidth: 1080,
      slideHeight: 1350,
      slideCount: 10,
      background: {
        type: 'solid',
        color: '#f4f1ea',
        gradientFrom: '#f4f1ea',
        gradientTo: '#e7e2d7',
        angle: 90,
        imageId: null,
      },
    },
    elements: [
      // Slide 1 (0..1080): Golden Tree Avenue Portrait
      {
        ...baseElement({ id: 't3-s1-mat', name: 'Slide 1 • Passe-partout Mat', x: 60, y: 80, width: 960, height: 1190 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 0,
      },
      {
        ...baseElement({ id: 't3-p1', name: 'Slide 1 • Tall Autumn Portrait', x: 80, y: 100, width: 700, height: 1150 }),
        type: 'image',
        imageId: 't3_photo_1',
        lockAspect: false,
        aspectRatio: 700 / 1150,
      },
      {
        ...baseElement({ id: 't3-p3-comp', name: 'Slide 1 • Companion Detail', x: 730, y: 400, width: 270, height: 420 }),
        type: 'image',
        imageId: 't3_photo_3',
        lockAspect: false,
        aspectRatio: 270 / 420,
      },
      {
        ...baseElement({ id: 't3-t1-title', name: 'Slide 1 • Title', x: 120, y: 170, width: 620, height: 110 }),
        type: 'text',
        text: "L'AMOUR",
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 82,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 8,
        lineHeight: 1,
        fill: '#ffffff',
      },
      {
        ...baseElement({ id: 't3-t1-sub', name: 'Slide 1 • Subtitle', x: 124, y: 290, width: 500, height: 40 }),
        type: 'text',
        text: 'CHÂTEAU DE VERSAILLES',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 5,
        lineHeight: 1,
        fill: 'rgba(255,255,255,0.95)',
      },

      // Slide 2 (1080..2160): Kiss on Forehead with Bridal Bouquet
      {
        ...baseElement({ id: 't3-s2-mat', name: 'Slide 2 • White Border', x: 1180, y: 80, width: 880, height: 1190 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 0,
      },
      {
        ...baseElement({ id: 't3-p2', name: 'Slide 2 • Forehead Kiss', x: 1200, y: 100, width: 840, height: 1150 }),
        type: 'image',
        imageId: 't3_photo_2',
        lockAspect: false,
        aspectRatio: 840 / 1150,
      },

      // Slide 3 (2160..3240): Stone Archway Perspective
      {
        ...baseElement({ id: 't3-s3-frame', name: 'Slide 3 • Archway Mat', x: 2280, y: 100, width: 840, height: 1150 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 24,
      },
      {
        ...baseElement({ id: 't3-p4', name: 'Slide 3 • Archway Center', x: 2300, y: 120, width: 800, height: 1110 }),
        type: 'image',
        imageId: 't3_photo_4',
        lockAspect: false,
        aspectRatio: 800 / 1110,
      },
      {
        ...baseElement({ id: 't3-t3-text', name: 'Slide 3 • Caption', x: 2300, y: 1260, width: 800, height: 40 }),
        type: 'text',
        text: 'THE ARCHWAY OF MEMORY',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
        fontWeight: 600,
        align: 'center',
        letterSpacing: 4,
        lineHeight: 1,
        fill: '#333333',
      },

      // Slide 4-5-6 (3240..6480): Grand Golden Tree Avenue Panorama Spanning across Slides!
      {
        ...baseElement({ id: 't3-p5', name: 'Slide 4-5 • Golden Tree Avenue Panorama', x: 3360, y: 0, width: 2040, height: 1350 }),
        type: 'image',
        imageId: 't3_photo_5',
        lockAspect: false,
        aspectRatio: 2040 / 1350,
      },
      {
        ...baseElement({ id: 't3-t5-title', name: 'Slide 4 • Panorama Heading', x: 3480, y: 1160, width: 1200, height: 70 }),
        type: 'text',
        text: 'THE GOLDEN ALLÉE',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 50,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 6,
        lineHeight: 1,
        fill: '#ffffff',
      },

      // Slide 7 (6480..7560): Stacked Gallery Frames
      {
        ...baseElement({ id: 't3-s7-mat', name: 'Slide 7 • Double Gallery Mat', x: 6580, y: 100, width: 880, height: 1150 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 0,
      },
      {
        ...baseElement({ id: 't3-p6', name: 'Slide 7 • Garden Path & Statue', x: 6600, y: 120, width: 840, height: 530 }),
        type: 'image',
        imageId: 't3_photo_6',
        lockAspect: false,
        aspectRatio: 840 / 530,
      },
      {
        ...baseElement({ id: 't3-p7', name: 'Slide 7 • Lower Garden Couple', x: 6600, y: 700, width: 840, height: 530 }),
        type: 'image',
        imageId: 't3_photo_7',
        lockAspect: false,
        aspectRatio: 840 / 530,
      },

      // Slide 8-9 (7560..9720): Grand Château Facade with Reflecting Fountain Pool Spanning Seam!
      {
        ...baseElement({ id: 't3-p8', name: 'Slide 8-9 • Grand Château Panorama', x: 7560, y: 0, width: 2160, height: 1350 }),
        type: 'image',
        imageId: 't3_photo_8',
        lockAspect: false,
        aspectRatio: 2160 / 1350,
      },
      {
        ...baseElement({ id: 't3-t8-title', name: 'Slide 8 • Château Title', x: 7700, y: 140, width: 1200, height: 80 }),
        type: 'text',
        text: 'THE PALACE RESIDENCE',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 52,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 8,
        lineHeight: 1,
        fill: '#ffffff',
      },

      // Slide 10 (9720..10800): Symmetrical Clean Framed Portrait
      {
        ...baseElement({ id: 't3-s10-mat', name: 'Slide 10 • White Gallery Mat', x: 9820, y: 100, width: 880, height: 1150 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 0,
      },
      {
        ...baseElement({ id: 't3-p9', name: 'Slide 10 • Clean Wedding Portrait', x: 9840, y: 120, width: 840, height: 1110 }),
        type: 'image',
        imageId: 't3_photo_9',
        lockAspect: false,
        aspectRatio: 840 / 1110,
      },
      {
        ...baseElement({ id: 't3-t10-caption', name: 'Slide 10 • Closing Note', x: 9900, y: 1260, width: 720, height: 40 }),
        type: 'text',
        text: 'PARIS • AUTOMNE 2024',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 20,
        fontWeight: 600,
        align: 'center',
        letterSpacing: 5,
        lineHeight: 1,
        fill: '#24282f',
      },
    ],
  };
}

// -------------------------------------------------------------
// TEMPLATE 4: FOREST EDITORIAL (Organic & Split-Tone Woodland)
// -------------------------------------------------------------
function createForestEditorialDoc(): EditorDocument {
  return {
    name: 'Forest Story',
    canvas: {
      format: 'portrait',
      slideWidth: 1080,
      slideHeight: 1350,
      slideCount: 10,
      background: {
        type: 'solid',
        color: '#f5f3ed',
        gradientFrom: '#f5f3ed',
        gradientTo: '#e3dfd3',
        angle: 90,
        imageId: null,
      },
    },
    elements: [
      // Slide 1 (0..1080): Bride and Groom Outdoor Portrait
      {
        ...baseElement({ id: 't4-p1', name: 'Slide 1 • Garden Portrait', x: 80, y: 60, width: 920, height: 1230 }),
        type: 'image',
        imageId: 't4_photo_1',
        lockAspect: false,
        aspectRatio: 920 / 1230,
      },
      {
        ...baseElement({ id: 't4-t1-kicker', name: 'Slide 1 • Kicker', x: 124, y: 140, width: 500, height: 40 }),
        type: 'text',
        text: 'INTO THE WILDERNESS • VOL. 04',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 5,
        lineHeight: 1,
        fill: '#e0d9cc',
      },
      {
        ...baseElement({ id: 't4-t1-title', name: 'Slide 1 • Title', x: 120, y: 180, width: 800, height: 110 }),
        type: 'text',
        text: 'WILD HEARTS',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 84,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 8,
        lineHeight: 1,
        fill: '#ffffff',
      },

      // Slide 2 (1080..2160): Split Composition (B&W Groom Detail + Forest Walk)
      {
        ...baseElement({ id: 't4-p2', name: 'Slide 2 • Watch & Cufflinks Detail', x: 1180, y: 80, width: 420, height: 1190 }),
        type: 'image',
        imageId: 't4_photo_2',
        lockAspect: false,
        aspectRatio: 420 / 1190,
      },
      {
        ...baseElement({ id: 't4-p3', name: 'Slide 2 • Forest Walk Detail', x: 1640, y: 650, width: 460, height: 620 }),
        type: 'image',
        imageId: 't4_photo_3',
        lockAspect: false,
        aspectRatio: 460 / 620,
      },
      {
        ...baseElement({ id: 't4-t2-title', name: 'Slide 2 • Title', x: 1640, y: 460, width: 460, height: 120 }),
        type: 'text',
        text: 'THE\nPATHWAY',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 48,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 4,
        lineHeight: 1.05,
        fill: '#1a1f1b',
      },

      // Slide 3-4 (2160..4320): Intimate Embrace under Forest Canopy
      {
        ...baseElement({ id: 't4-p4', name: 'Slide 3 • Woodland Embrace', x: 2160, y: 0, width: 1400, height: 1350 }),
        type: 'image',
        imageId: 't4_photo_4',
        lockAspect: false,
        aspectRatio: 1400 / 1350,
      },

      // Slide 5 (4320..5400): Stacked Dual Photos on Charcoal Contrast Block
      {
        ...baseElement({ id: 't4-s5-block', name: 'Slide 5 • Contrast Block', x: 4400, y: 60, width: 860, height: 1230 }),
        type: 'shape',
        shape: 'rect',
        fill: '#1a1f1b',
        cornerRadius: 4,
      },
      {
        ...baseElement({ id: 't4-p5', name: 'Slide 5 • Reception Fairy Lights', x: 4440, y: 100, width: 780, height: 540 }),
        type: 'image',
        imageId: 't4_photo_5',
        lockAspect: false,
        aspectRatio: 780 / 540,
      },
      {
        ...baseElement({ id: 't4-p6', name: 'Slide 5 • Intimate Kiss', x: 4440, y: 690, width: 780, height: 550 }),
        type: 'image',
        imageId: 't4_photo_6',
        lockAspect: false,
        aspectRatio: 780 / 550,
      },

      // Slide 6 (5400..6480): Dark Moody Florals & Warm Bride Portrait
      {
        ...baseElement({ id: 't4-p7', name: 'Slide 6 • Dark Florals Portrait', x: 5400, y: 0, width: 1080, height: 1350 }),
        type: 'image',
        imageId: 't4_photo_7',
        lockAspect: false,
        aspectRatio: 1080 / 1350,
      },

      // Slide 7 (6480..7560): Bride Smiling with Bouquet
      {
        ...baseElement({ id: 't4-p8', name: 'Slide 7 • Bride with Bouquet', x: 6580, y: 80, width: 880, height: 1190 }),
        type: 'image',
        imageId: 't4_photo_8',
        lockAspect: false,
        aspectRatio: 880 / 1190,
      },

      // Slide 8 (7560..8640): Joyful Laughing Outdoors
      {
        ...baseElement({ id: 't4-p9', name: 'Slide 8 • Joyful Embrace', x: 7560, y: 0, width: 1080, height: 1350 }),
        type: 'image',
        imageId: 't4_photo_9',
        lockAspect: false,
        aspectRatio: 1080 / 1350,
      },
      {
        ...baseElement({ id: 't4-t8-text', name: 'Slide 8 • Heading', x: 7700, y: 1180, width: 800, height: 60 }),
        type: 'text',
        text: 'JOY IN EVERY MOMENT',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 38,
        fontWeight: 600,
        align: 'left',
        letterSpacing: 4,
        lineHeight: 1,
        fill: '#ffffff',
      },

      // Slide 9 (8640..9720): Multi-Photo Grid (Vintage Car Mirror & Manor House)
      {
        ...baseElement({ id: 't4-s9-mat', name: 'Slide 9 • White Grid Mat', x: 8720, y: 80, width: 900, height: 1190 }),
        type: 'shape',
        shape: 'rect',
        fill: '#ffffff',
        cornerRadius: 0,
      },
      {
        ...baseElement({ id: 't4-p10', name: 'Slide 9 • Car Mirror Detail', x: 8740, y: 100, width: 860, height: 550 }),
        type: 'image',
        imageId: 't4_photo_10',
        lockAspect: false,
        aspectRatio: 860 / 550,
      },
      {
        ...baseElement({ id: 't4-p11', name: 'Slide 9 • Country Manor House', x: 8740, y: 700, width: 860, height: 550 }),
        type: 'image',
        imageId: 't4_photo_11',
        lockAspect: false,
        aspectRatio: 860 / 550,
      },

      // Slide 10 (9720..10800): Countryside Couple with Vintage Getaway Car
      {
        ...baseElement({ id: 't4-p12', name: 'Slide 10 • Vintage Getaway Car', x: 9800, y: 80, width: 920, height: 1190 }),
        type: 'image',
        imageId: 't4_photo_12',
        lockAspect: false,
        aspectRatio: 920 / 1190,
      },
      {
        ...baseElement({ id: 't4-t10-fin', name: 'Slide 10 • Signature', x: 9900, y: 1180, width: 720, height: 40 }),
        type: 'text',
        text: 'TO BE CONTINUED',
        fontFamily: 'Outfit, sans-serif',
        fontSize: 22,
        fontWeight: 600,
        align: 'center',
        letterSpacing: 6,
        lineHeight: 1,
        fill: '#ffffff',
      },
    ],
  };
}

// -------------------------------------------------------------
// TEMPLATES REGISTRY
// -------------------------------------------------------------
export const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
  {
    meta: {
      id: 'template-torn-romance',
      name: 'Torn Romance',
      subtitle: 'Warm terracotta & torn-paper collage',
      description: 'A romantic 10-slide wedding & couple story featuring ripped-edge matting, stacked polaroids, and a seamless coastal panorama spanning across slides 4 and 5.',
      category: 'Wedding & Romance',
      slideCount: 10,
      format: 'portrait',
      bannerUrl: '/templates/thumbnails/template_1_banner.png',
      accentColor: '#c77959',
      tags: ['Terracotta', 'Torn Paper', 'Collage', 'Romantic', 'Ocean Panorama'],
      features: [
        '10 continuous portrait slides (1080 × 1350)',
        'Seamless coastal panorama across slides 4 & 5',
        'Torn-paper borders & polaroid collage layers',
        'Fraunces serif typography & editorial captions',
      ],
    },
    createDocument: createTornRomanceDoc,
    assets: {
      t1_photo_1: '/templates/assets/t1_photo_1.jpg',
      t1_photo_2: '/templates/assets/t1_photo_2.jpg',
      t1_photo_3: '/templates/assets/t1_photo_3.jpg',
      t1_photo_4: '/templates/assets/t1_photo_4.jpg',
      t1_photo_5: '/templates/assets/t1_photo_5.jpg',
      t1_photo_6: '/templates/assets/t1_photo_6.jpg',
      t1_photo_7: '/templates/assets/t1_photo_7.jpg',
      t1_photo_8: '/templates/assets/t1_photo_8.jpg',
      t1_photo_9: '/templates/assets/t1_photo_9.jpg',
      t1_photo_10: '/templates/assets/t1_photo_10.jpg',
    },
  },
  {
    meta: {
      id: 'template-modern-noir',
      name: 'Modern Noir',
      subtitle: 'High-contrast cinematic film editorial',
      description: 'Moody, high-fashion layout set on an ivory linen canvas. Features floating dark film cards, architectural silhouettes, and a panoramic meadow embrace.',
      category: 'Fashion & Editorial',
      slideCount: 10,
      format: 'portrait',
      bannerUrl: '/templates/thumbnails/template_2_banner.png',
      accentColor: '#1a1a1a',
      tags: ['Noir', 'Cinematic', 'Fashion', 'Minimalist', 'Negative Space'],
      features: [
        '10 continuous portrait slides (1080 × 1350)',
        'Dramatic film noir lighting & golden silk drape',
        'Floating asymmetric photo blocks & arches',
        'Seamless meadow romance panorama across slides 8 & 9',
      ],
    },
    createDocument: createModernNoirDoc,
    assets: {
      t2_photo_1: '/templates/assets/t2_photo_1.jpg',
      t2_photo_2: '/templates/assets/t2_photo_2.jpg',
      t2_photo_3: '/templates/assets/t2_photo_3.jpg',
      t2_photo_4: '/templates/assets/t2_photo_4.jpg',
      t2_photo_5: '/templates/assets/t2_photo_5.jpg',
      t2_photo_6: '/templates/assets/t2_photo_6.jpg',
      t2_photo_7: '/templates/assets/t2_photo_7.jpg',
      t2_photo_8: '/templates/assets/t2_photo_8.jpg',
      t2_photo_9: '/templates/assets/t2_photo_9.jpg',
      t2_photo_10: '/templates/assets/t2_photo_10.jpg',
    },
  },
  {
    meta: {
      id: 'template-chateau-classic',
      name: 'Château Romance',
      subtitle: 'Grand European architecture & golden autumn tree allée',
      description: 'Timeless European chateau elegance with classical stone archways, clean white gallery borders, and two grand panoramas: an autumn tree avenue and a palace reflecting fountain pool.',
      category: 'Classic & Luxury',
      slideCount: 10,
      format: 'portrait',
      bannerUrl: '/templates/thumbnails/template_3_banner.png',
      accentColor: '#8a6e45',
      tags: ['Château', 'Architecture', 'Symmetry', 'Autumn', 'Luxury'],
      features: [
        '10 continuous portrait slides (1080 × 1350)',
        'Two seamless panoramas (Golden Allée 4-5 & Palace Facade 8-9)',
        'Classical stone archway & clean gallery borders',
        'Parisian luxury typography & subtitle layouts',
      ],
    },
    createDocument: createChateauClassicDoc,
    assets: {
      t3_photo_1: '/templates/assets/t3_photo_1.jpg',
      t3_photo_2: '/templates/assets/t3_photo_2.jpg',
      t3_photo_3: '/templates/assets/t3_photo_3.jpg',
      t3_photo_4: '/templates/assets/t3_photo_4.jpg',
      t3_photo_5: '/templates/assets/t3_photo_5.jpg',
      t3_photo_6: '/templates/assets/t3_photo_6.jpg',
      t3_photo_7: '/templates/assets/t3_photo_7.jpg',
      t3_photo_8: '/templates/assets/t3_photo_8.jpg',
      t3_photo_9: '/templates/assets/t3_photo_9.jpg',
    },
  },
  {
    meta: {
      id: 'template-forest-editorial',
      name: 'Forest Story',
      subtitle: 'Organic split-tone woodland collage with candid moments',
      description: 'Rich deep forest greens with crisp neutral parchment, black & white details, stacked polaroid memories, intimate woodland portraits, and a vintage getaway car grid.',
      category: 'Moody & Story',
      slideCount: 10,
      format: 'portrait',
      bannerUrl: '/templates/thumbnails/template_4_banner.png',
      accentColor: '#263529',
      tags: ['Woodland', 'Forest', 'Organic', 'Candid', 'Editorial Grid'],
      features: [
        '10 continuous portrait slides (1080 × 1350)',
        'Split-tone contrast blocks & magazine grids',
        'Stacked polaroids with fairy-light reception shots',
        'Multi-image detail grid for wedding day storytelling',
      ],
    },
    createDocument: createForestEditorialDoc,
    assets: {
      t4_photo_1: '/templates/assets/t4_photo_1.jpg',
      t4_photo_2: '/templates/assets/t4_photo_2.jpg',
      t4_photo_3: '/templates/assets/t4_photo_3.jpg',
      t4_photo_4: '/templates/assets/t4_photo_4.jpg',
      t4_photo_5: '/templates/assets/t4_photo_5.jpg',
      t4_photo_6: '/templates/assets/t4_photo_6.jpg',
      t4_photo_7: '/templates/assets/t4_photo_7.jpg',
      t4_photo_8: '/templates/assets/t4_photo_8.jpg',
      t4_photo_9: '/templates/assets/t4_photo_9.jpg',
      t4_photo_10: '/templates/assets/t4_photo_10.jpg',
      t4_photo_11: '/templates/assets/t4_photo_11.jpg',
      t4_photo_12: '/templates/assets/t4_photo_12.jpg',
    },
  },
];

export function getTemplates() {
  return CAROUSEL_TEMPLATES;
}

export function getTemplateById(id: string) {
  return CAROUSEL_TEMPLATES.find((t) => t.meta.id === id);
}

export async function loadTemplateAssets(template: CarouselTemplate) {
  const map: Record<string, import('../types/editor').ImageAsset> = {};
  const doc = template.createDocument();
  const imageElements = doc.elements.filter((el): el is import('../types/editor').ImageElement => el.type === 'image');

  const dimMap: Record<string, { width: number; height: number; name: string }> = {};
  for (const el of imageElements) {
    if (!dimMap[el.imageId]) {
      dimMap[el.imageId] = { width: el.width, height: el.height, name: el.name };
    }
  }

  await Promise.all(
    Object.keys(template.assets).map(async (imageId) => {
      try {
        const dim = dimMap[imageId] || { width: 1080, height: 1350, name: 'Photo' };
        const storageKey = `holder_v2_${template.meta.id}_${imageId}_${dim.width}_${dim.height}`;
        let blob = await idbGet(storageKey);
        if (!blob) {
          blob = await drawImageHolder(dim.width, dim.height, 'Add Photo', 'Click or tap to choose image');
          await idbPut(storageKey, blob);
        }
        if (blob) {
          const asset = await assetFromBlob(imageId, blob);
          asset.isPlaceholder = true;
          map[imageId] = asset;
        }
      } catch (err) {
        console.warn(`Could not generate template holder asset ${imageId}`, err);
      }
    }),
  );
  return map;
}


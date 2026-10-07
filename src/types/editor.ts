export type FormatId = 'portrait' | 'square' | 'landscape';

export type TextAlign = 'left' | 'center' | 'right';

export type ShapeKind = 'rect' | 'ellipse';

export type LayerMove = 'forward' | 'backward' | 'front' | 'back';

export type ExportFormat = 'png' | 'jpeg';

export type CanvasBackground = {
  type: 'solid' | 'gradient';
  color: string;
  gradientFrom: string;
  gradientTo: string;
  angle: number;
  imageId: string | null;
};

export type CanvasSettings = {
  format: FormatId;
  slideWidth: number;
  slideHeight: number;
  slideCount: number;
  background: CanvasBackground;
};

type ElementBase = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
};

export type ImageElement = ElementBase & {
  type: 'image';
  imageId: string;
  lockAspect: boolean;
  aspectRatio: number;
};

export type TextElement = ElementBase & {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  align: TextAlign;
  letterSpacing: number;
  lineHeight: number;
  fill: string;
};

export type ShapeElement = ElementBase & {
  type: 'shape';
  shape: ShapeKind;
  fill: string;
  cornerRadius: number;
};

export type EditorElement = ImageElement | TextElement | ShapeElement;

export type EditorDocument = {
  name: string;
  canvas: CanvasSettings;
  elements: EditorElement[];
};

export type ElementPatch = {
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  align?: TextAlign;
  letterSpacing?: number;
  lineHeight?: number;
  fill?: string;
  lockAspect?: boolean;
  cornerRadius?: number;
};

export type ImageAsset = {
  id: string;
  url: string;
  image: HTMLImageElement;
  width: number;
  height: number;
};

export type AssetMap = Record<string, ImageAsset>;

export type CanvasPatch = {
  format?: FormatId;
  slideWidth?: number;
  slideHeight?: number;
  slideCount?: number;
  background?: Partial<CanvasBackground>;
};

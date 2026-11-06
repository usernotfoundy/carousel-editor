import type { EditorDocument, FormatId } from './editor';

export type TemplateCategory = 'All' | 'Wedding & Romance' | 'Fashion & Editorial' | 'Classic & Luxury' | 'Moody & Story';

export type TemplateMeta = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: TemplateCategory;
  slideCount: number;
  format: FormatId;
  bannerUrl: string;
  accentColor: string;
  tags: string[];
  features: string[];
};

export type CarouselTemplate = {
  meta: TemplateMeta;
  createDocument: (format?: FormatId) => EditorDocument;
  assets: Record<string, string>; // imageId -> URL or relative path
};


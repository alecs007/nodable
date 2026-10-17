import { DEFAULT_LAYOUT_OPTIONS, type LayoutOptions, layoutTree } from '../layout/layout-tree'
import { type Session, getTree } from '../session/session'
import { pendingVariants } from '../session/variants'
import { createWorkspace, serializeWorkspace } from '../workspace/workspace'
import { toLatex } from './to-latex'
import { type SvgPanel, drawSvg } from './to-svg'
import { toText } from './to-text'

export type ExportCaptions = {
  readonly variants: readonly string[]
}

const NO_CAPTIONS: ExportCaptions = { variants: [] }

export type ExportFormat = 'svg' | 'png' | 'json' | 'latex' | 'text'

export type TextExportResult = {
  readonly kind: 'text'
  readonly format: Exclude<ExportFormat, 'png'>
  readonly fileName: string
  readonly mimeType: string
  readonly content: string
}

export type RasterExportResult = {
  readonly kind: 'raster'
  readonly format: 'png'
  readonly fileName: string
  readonly mimeType: 'image/png'
  readonly svg: string
  readonly width: number
  readonly height: number
}

export type ExportResult = TextExportResult | RasterExportResult

const FALLBACK_STEM = 'nodable-tree'

export function fileStem(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return slug === '' ? FALLBACK_STEM : slug
}

function textResult(
  format: Exclude<ExportFormat, 'png'>,
  mimeType: string,
  extension: string,
  content: string,
  stem: string,
): TextExportResult {
  return { kind: 'text', format, fileName: `${stem}.${extension}`, mimeType, content }
}

function panelsOf(
  session: Session,
  options: LayoutOptions,
  captions: ExportCaptions,
): readonly SvgPanel[] {
  const snapshot = getTree(session)
  const variants = pendingVariants(snapshot)

  if (variants.length < 2) {
    const only = variants[0]

    return [
      {
        layout: layoutTree(only?.snapshot ?? snapshot, options),
        caption: '',
        unlabelled: only?.pending ?? [],
      },
    ]
  }

  return variants.map((variant, index) => ({
    layout: layoutTree(variant.snapshot, options),
    caption: captions.variants[index] ?? '',
    unlabelled: variant.pending,
  }))
}

export function exportSession(
  session: Session,
  format: ExportFormat,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS,
  captions: ExportCaptions = NO_CAPTIONS,
): ExportResult {
  const snapshot = getTree(session)
  const stem = fileStem(session.name)
  const panels = panelsOf(session, options, captions)
  const drawing = drawSvg(panels, session.input)

  switch (format) {
    case 'svg':
      return textResult('svg', 'image/svg+xml', 'svg', drawing.markup, stem)
    case 'text':
      return textResult('text', 'text/plain', 'txt', toText(snapshot.root), stem)
    case 'latex':
      return textResult('latex', 'text/x-tex', 'tex', toLatex(snapshot.root), stem)
    case 'json':
      return textResult(
        'json',
        'application/json',
        'json',
        serializeWorkspace(createWorkspace(session.input, [session])),
        stem,
      )
    case 'png':
      return {
        kind: 'raster',
        format: 'png',
        fileName: `${stem}.png`,
        mimeType: 'image/png',
        svg: drawing.markup,
        width: drawing.width,
        height: drawing.height,
      }
  }
}

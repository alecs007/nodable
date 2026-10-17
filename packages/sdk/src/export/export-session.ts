import { DEFAULT_LAYOUT_OPTIONS, type LayoutOptions, layoutTree } from '../layout/layout-tree'
import { type Session, getTree } from '../session/session'
import { createWorkspace, serializeWorkspace } from '../workspace/workspace'
import { toLatex } from './to-latex'
import { toSvg } from './to-svg'
import { toText } from './to-text'

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

export function exportSession(
  session: Session,
  format: ExportFormat,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS,
): ExportResult {
  const snapshot = getTree(session)
  const stem = fileStem(session.name)

  switch (format) {
    case 'svg':
      return textResult('svg', 'image/svg+xml', 'svg', toSvg(layoutTree(snapshot, options)), stem)
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
    case 'png': {
      const layout = layoutTree(snapshot, options)

      return {
        kind: 'raster',
        format: 'png',
        fileName: `${stem}.png`,
        mimeType: 'image/png',
        svg: toSvg(layout),
        width: layout.width,
        height: layout.height,
      }
    }
  }
}

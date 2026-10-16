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

const FILE_STEM = 'nodable-tree'

function textResult(
  format: Exclude<ExportFormat, 'png'>,
  mimeType: string,
  extension: string,
  content: string,
): TextExportResult {
  return { kind: 'text', format, fileName: `${FILE_STEM}.${extension}`, mimeType, content }
}

export function exportSession(
  session: Session,
  format: ExportFormat,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS,
): ExportResult {
  const snapshot = getTree(session)

  switch (format) {
    case 'svg':
      return textResult('svg', 'image/svg+xml', 'svg', toSvg(layoutTree(snapshot, options)))
    case 'text':
      return textResult('text', 'text/plain', 'txt', toText(snapshot.root))
    case 'latex':
      return textResult('latex', 'text/x-tex', 'tex', toLatex(snapshot.root))
    case 'json':
      return textResult(
        'json',
        'application/json',
        'json',
        serializeWorkspace(createWorkspace(session.input, [session])),
      )
    case 'png': {
      const layout = layoutTree(snapshot, options)

      return {
        kind: 'raster',
        format: 'png',
        fileName: `${FILE_STEM}.png`,
        mimeType: 'image/png',
        svg: toSvg(layout),
        width: layout.width,
        height: layout.height,
      }
    }
  }
}

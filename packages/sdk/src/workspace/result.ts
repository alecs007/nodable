export type Result<TValue, TError> =
  { readonly ok: true; readonly value: TValue } | { readonly ok: false; readonly error: TError }

export function ok<TValue, TError>(value: TValue): Result<TValue, TError> {
  return { ok: true, value }
}

export function fail<TValue, TError>(error: TError): Result<TValue, TError> {
  return { ok: false, error }
}

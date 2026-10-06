import { cvQueries } from '@/entities/cv/api/cvQueries'
import { readPrefill } from '@/features/cv-create/model/createForm'

/** The CV that New CV starts from, as the URL names it; `null` for the plain form. */
export function parentCvQuery(params: URLSearchParams) {
  const { fromCvId } = readPrefill(params)
  return fromCvId ? cvQueries.detail(fromCvId) : null
}

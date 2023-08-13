export type SearchResult = {
  name: string
  city: string
  state: string
  registerCourtAndNumber: string
  registerType: RegisterType
  registerNumber: string
  status: 'aktuell' | 'gelöscht'
  history?: {
    name: string
    city: string
  }[]
  documentLinks: Map<RegisterDocument, string | null>
}

export enum RegisterType {
  HRA = 'HRA',
  HRB = 'HRB',
  GnR = 'GnR',
  PR = 'PR',
  VR = 'VR',
}

export enum RegisterDocument {
  AD = 'AD',
  CD = 'CD',
  HD = 'HD',
  DK = 'DK',
  UT = 'UT',
  VÖ = 'VÖ',
  SI = 'SI',
}

export enum DkDocument {
  LdG = 'Liste der Gesellschafter',
  // to be continued
}

export type CacheDocument = Omit<RegisterDocument, 'DK'> | DkDocument

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
  documentLinks: Map<RegisterDocumentType, string | null>
}

export enum RegisterType {
  HRA = 'HRA',
  HRB = 'HRB',
  GnR = 'GnR',
  PR = 'PR',
  VR = 'VR',
}

export enum RegisterDocumentType {
  AD = 'AD',
  CD = 'CD',
  HD = 'HD',
  DK = 'DK',
  UT = 'UT',
  VÖ = 'VÖ',
  SI = 'SI',
}

export enum DkDocumentTypes {
  LdG = 'Liste der Gesellschafter',
  // to be continued
}

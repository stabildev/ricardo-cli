export interface CompanySearchResult {
  companyName?: string
  city?: string
  state?: string
  registryCourtAndNumber?: string
  registryType?: RegistryType
  registryNumber?: string
  status?: string
  history?: string[][]
  documentLinks: {
    [key in RegistryDocument]: string
  }
}

export enum RegistryType {
  HRA = 'HRA',
  HRB = 'HRB',
  PR = 'PR',
  VR = 'VR',
  GnR = 'GnR',
}

export type RegistryDocument = 'AD' | 'CD' | 'HD' | 'DK' | 'UT' | 'VÖ' | 'SI'

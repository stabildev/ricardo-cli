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
    [key in RegistryDocument]: string | undefined
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

export type DocumentLink = string & { _documentLinkBrand: never }

export type DocumentNode = {
  name: string
  parent: DocumentNode
  content: DocumentNode[] | DocumentLink
}

export interface FinancialLineItem {
  lineItem: string
  values: {
    year: string
    value: number | null
    currency?: string
    unit?: string
    note?: string
  }[]
}

export interface FinancialData {
  companyName?: string
  reportingPeriod?: string
  currency?: string
  unit?: string
  lineItems: FinancialLineItem[]
  metadata: {
    extractionDate: string
    sourceDocument?: string
    confidence?: 'high' | 'medium' | 'low'
    notes?: string[]
  }
}

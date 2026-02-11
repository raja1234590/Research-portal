import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { FinancialData } from '@/types'

export function exportToExcel(financialData: FinancialData, filename?: string) {
  // Create workbook
  const wb = XLSX.utils.book_new()

  // Prepare data for main sheet
  const allYears = new Set<string>()
  financialData.lineItems.forEach((item) => {
    item.values.forEach((val) => {
      if (val.year) allYears.add(val.year)
    })
  })

  const sortedYears = Array.from(allYears).sort()

  // Create main data array
  const data: any[][] = []

  // Header row
  const header = ['Line Item', ...sortedYears, 'Currency', 'Unit', 'Notes']
  data.push(header)

  // Data rows
  financialData.lineItems.forEach((item) => {
    const row: any[] = [item.lineItem]

    sortedYears.forEach((year) => {
      const valueObj = item.values.find((v) => v.year === year)
      if (valueObj) {
        if (valueObj.value === null) {
          row.push('N/A')
        } else {
          row.push(valueObj.value)
        }
      } else {
        row.push('')
      }
    })

    // Add currency and unit from first value or metadata
    const firstValue = item.values[0]
    row.push(firstValue?.currency || financialData.currency || '')
    row.push(firstValue?.unit || financialData.unit || '')

    // Collect notes
    const notes = item.values
      .map((v) => v.note)
      .filter((n) => n)
      .join('; ')
    row.push(notes || '')

    data.push(row)
  })

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data)

  // Set column widths
  const colWidths = [
    { wch: 40 }, // Line Item
    ...sortedYears.map(() => ({ wch: 15 })), // Year columns
    { wch: 10 }, // Currency
    { wch: 10 }, // Unit
    { wch: 30 }, // Notes
  ]
  ws['!cols'] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Financial Data')

  // Create metadata sheet
  const metadataData = [
    ['Metadata', ''],
    ['Company Name', financialData.companyName || 'N/A'],
    ['Reporting Period', financialData.reportingPeriod || 'N/A'],
    ['Currency', financialData.currency || 'N/A'],
    ['Unit', financialData.unit || 'N/A'],
    ['Extraction Date', financialData.metadata.extractionDate],
    ['Confidence', financialData.metadata.confidence || 'N/A'],
    ['', ''],
    ['Notes', ''],
    ...(financialData.metadata.notes || []).map((note) => ['', note]),
  ]

  const metadataWs = XLSX.utils.aoa_to_sheet(metadataData)
  XLSX.utils.book_append_sheet(wb, metadataWs, 'Metadata')

  // Generate filename
  const defaultFilename = `financial_data_${new Date().toISOString().split('T')[0]}.xlsx`
  const finalFilename = filename || defaultFilename

  // Write file
  XLSX.writeFile(wb, finalFilename)
}

export function exportToCSV(financialData: FinancialData, filename?: string) {
  const allYears = new Set<string>()
  financialData.lineItems.forEach((item) => {
    item.values.forEach((val) => {
      if (val.year) allYears.add(val.year)
    })
  })

  const sortedYears = Array.from(allYears).sort()

  // Create CSV content
  let csv = 'Line Item,' + sortedYears.join(',') + ',Currency,Unit,Notes\n'

  financialData.lineItems.forEach((item) => {
    const row = [item.lineItem]

    sortedYears.forEach((year) => {
      const valueObj = item.values.find((v) => v.year === year)
      if (valueObj) {
        if (valueObj.value === null) {
          row.push('N/A')
        } else {
          row.push(String(valueObj.value))
        }
      } else {
        row.push('')
      }
    })

    const firstValue = item.values[0]
    row.push(firstValue?.currency || financialData.currency || '')
    row.push(firstValue?.unit || financialData.unit || '')

    const notes = item.values
      .map((v) => v.note)
      .filter((n) => n)
      .join('; ')
    row.push(`"${notes || ''}"`)

    csv += row.join(',') + '\n'
  })

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const defaultFilename = `financial_data_${new Date().toISOString().split('T')[0]}.csv`
  const finalFilename = filename || defaultFilename
  saveAs(blob, finalFilename)
}

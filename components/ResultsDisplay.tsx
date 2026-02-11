'use client'

import { FinancialData } from '@/types'
import { exportToExcel, exportToCSV } from '@/lib/excelExporter'

interface ResultsDisplayProps {
  financialData: FinancialData
}

export default function ResultsDisplay({ financialData }: ResultsDisplayProps) {
  const handleExportExcel = () => {
    exportToExcel(financialData)
  }

  const handleExportCSV = () => {
    exportToCSV(financialData)
  }

  // Get all unique years
  const allYears = new Set<string>()
  financialData.lineItems.forEach((item) => {
    item.values.forEach((val) => {
      if (val.year) allYears.add(val.year)
    })
  })
  const sortedYears = Array.from(allYears).sort()

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Extracted Financial Data</h2>
          {financialData.companyName && (
            <p className="text-gray-600">Company: {financialData.companyName}</p>
          )}
          {financialData.reportingPeriod && (
            <p className="text-gray-600">Period: {financialData.reportingPeriod}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Extraction Metadata</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Currency:</span>{' '}
            <span className="font-medium">
              {financialData.currency || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Unit:</span>{' '}
            <span className="font-medium">
              {financialData.unit || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Confidence:</span>{' '}
            <span
              className={`font-medium ${
                financialData.metadata.confidence === 'high'
                  ? 'text-green-600'
                  : financialData.metadata.confidence === 'medium'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {financialData.metadata.confidence || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Extracted:</span>{' '}
            <span className="font-medium">
              {new Date(financialData.metadata.extractionDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        {financialData.metadata.notes && financialData.metadata.notes.length > 0 && (
          <div className="mt-3">
            <span className="text-gray-600 text-sm">Notes:</span>
            <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
              {financialData.metadata.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                Line Item
              </th>
              {sortedYears.map((year) => (
                <th
                  key={year}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {financialData.lineItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                  {item.lineItem}
                </td>
                {sortedYears.map((year) => {
                  const valueObj = item.values.find((v) => v.year === year)
                  const value = valueObj?.value
                  const note = valueObj?.note

                  return (
                    <td
                      key={year}
                      className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900"
                    >
                      {value === null ? (
                        <span className="text-gray-400 italic">N/A</span>
                      ) : value !== undefined ? (
                        <div>
                          <span>
                            {typeof value === 'number'
                              ? value.toLocaleString()
                              : value}
                          </span>
                          {note && (
                            <span
                              className="ml-2 text-yellow-600"
                              title={note}
                            >
                              ⚠
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {financialData.lineItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No financial line items were extracted from the document.
        </div>
      )}
    </div>
  )
}

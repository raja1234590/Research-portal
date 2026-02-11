'use client'

import { useState } from 'react'
import DocumentUpload from '@/components/DocumentUpload'
import TextInput from '@/components/TextInput'
import ResultsDisplay from '@/components/ResultsDisplay'
import { FinancialData } from '@/types'

export default function Home() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExtractionComplete = (data: FinancialData) => {
    setFinancialData(data)
    setLoading(false)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setLoading(false)
    setFinancialData(null)
  }

  const handleProcessingStart = () => {
    setLoading(true)
    setError(null)
    setFinancialData(null)
  }

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Research Portal
          </h1>
          <p className="text-lg text-gray-600">
            Financial Statement Extraction Tool
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <DocumentUpload
            onProcessingStart={handleProcessingStart}
            onExtractionComplete={handleExtractionComplete}
            onError={handleError}
            loading={loading}
          />
          <TextInput
            onProcessingStart={handleProcessingStart}
            onExtractionComplete={handleExtractionComplete}
            onError={handleError}
            loading={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {financialData && (
          <ResultsDisplay financialData={financialData} />
        )}
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { FinancialData } from '@/types'

interface TextInputProps {
  onProcessingStart: () => void
  onExtractionComplete: (data: FinancialData) => void
  onError: (error: string) => void
  loading: boolean
}

export default function TextInput({
  onProcessingStart,
  onExtractionComplete,
  onError,
  loading,
}: TextInputProps) {
  const [text, setText] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) {
      onError('Please enter some text content')
      return
    }

    // Guard extremely long text to avoid hitting server 413 limits
    const MAX_CHARS = 80000 
    if (text.length > MAX_CHARS) {
      onError(
        `Text too long. Please limit input to about ${MAX_CHARS.toLocaleString()} characters.`
      )
      return
    }

    onProcessingStart()

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to extract financial data'

        try {
          const contentType = response.headers.get('content-type') || ''

          if (contentType.includes('application/json')) {
            const errorData = await response.json()
            if (errorData?.error) {
              errorMessage = errorData.error
            }
          } else {
            const textBody = await response.text()
            if (textBody) {
              errorMessage = textBody
            }
          }
        } catch {
          if (response.status === 413) {
            errorMessage =
              'Text is too large for processing. Please shorten the content and try again.'
          } else if (response.statusText) {
            errorMessage = response.statusText
          }
        }

        throw new Error(errorMessage)
      }

      const data: FinancialData = await response.json()
      onExtractionComplete(data)
    } catch (error) {
      console.error('Extraction error:', error)
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to process text. Please try again.'
      )
    }
  }

  if (!showInput) {
    return (
      <div className="text-center">
        <button
          onClick={() => setShowInput(true)}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Or paste text content directly
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Paste Financial Statement Text
        </label>
        <button
          onClick={() => {
            setShowInput(false)
            setText('')
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Hide
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the financial statement text here..."
        className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing...' : 'Extract Financial Data'}
      </button>
    </div>
  )
}

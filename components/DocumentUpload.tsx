'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FinancialData } from '@/types'

interface DocumentUploadProps {
  onProcessingStart: () => void
  onExtractionComplete: (data: FinancialData) => void
  onError: (error: string) => void
  loading: boolean
}

export default function DocumentUpload({
  onProcessingStart,
  onExtractionComplete,
  onError,
  loading,
}: DocumentUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Basic client-side file size guard to avoid hitting server 413 limits
      const MAX_FILE_SIZE_MB = 5
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        onError(
          `File too large. Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`
        )
        return
      }

      setUploadedFile(file)
      onProcessingStart()

      try {
        // Read file content
        const text = await readFileContent(file)

        // Call API to extract financial data
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
            // If parsing fails (e.g. HTML error page), fall back to status info
            if (response.status === 413) {
              errorMessage =
                'File or text is too large for processing. Please upload a smaller document or shorten the content.'
            } else if (response.statusText) {
              errorMessage = response.statusText
            }
          }

          throw new Error(errorMessage)
        }

        const data: FinancialData = await response.json()
        onExtractionComplete(data)
      } catch (error) {
        console.error('Upload error:', error)
        onError(
          error instanceof Error
            ? error.message
            : 'Failed to process document. Please try again.'
        )
      }
    },
    [onProcessingStart, onExtractionComplete, onError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    disabled: loading,
  })

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Upload Financial Document</h2>
      <p className="text-gray-600 mb-4">
        Upload an annual report, financial statement, or earnings document. Supported formats: TXT, DOCX, PDF (text-based only)
      </p>
      <p className="text-sm text-gray-500 mb-4">
        💡 Tip: For best results with PDFs, ensure they are text-based (not scanned images). You can also copy and paste text content directly.
      </p>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Processing document...</p>
          </div>
        ) : isDragActive ? (
          <p className="text-blue-600">Drop the file here...</p>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-gray-600 mb-2">
              Drag and drop a file here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              PDF, DOCX, or TXT files up to 10MB
            </p>
          </div>
        )}
      </div>

      {uploadedFile && !loading && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            ✓ Uploaded: {uploadedFile.name}
          </p>
        </div>
      )}
    </div>
  )
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content === 'string') {
        resolve(content)
      } else {
        reject(new Error('Failed to read file as text'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }

    if (file.type === 'application/pdf') {
      // For PDF files, try to read as text (basic support)
      // Note: This works for text-based PDFs but may not work for scanned PDFs
      // For production, consider using a PDF parsing library like pdf-parse
      reader.readAsText(file)
    } else {
      reader.readAsText(file)
    }
  })
}

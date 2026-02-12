import { NextRequest, NextResponse } from 'next/server'
import { extractFinancialData } from '@/lib/financialExtractor'

// Increase the maximum execution time for this route on platforms like Vercel.
// This helps avoid FUNCTION_INVOCATION_TIMEOUT when the LLM call is slow.
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    if (text.length === 0) {
      return NextResponse.json(
        { error: 'Text content cannot be empty' },
        { status: 400 }
      )
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
        },
        { status: 500 }
      )
    }

    // Extract financial data
    const financialData = await extractFinancialData(text)

    return NextResponse.json(financialData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to extract financial data',
      },
      { status: 500 }
    )
  }
}

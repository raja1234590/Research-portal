import OpenAI from 'openai'
import { FinancialData } from '@/types'

function getEnv(name: string) {
  const v = process.env[name]
  return v && v.trim().length > 0 ? v.trim() : undefined
}

function getOpenAIClient() {
  const apiKey = getEnv('OPENAI_API_KEY')
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const baseURL = getEnv('OPENAI_BASE_URL')

  return new OpenAI({
    apiKey,
    baseURL,
  })
}

function getModel() {
  return getEnv('OPENAI_MODEL') ?? 'llama3-70b-8192'
}

function extractFirstJsonObject(text: string): string {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Model did not return JSON')
  return match[0]
}

interface ExtractionResult {
  companyName?: string
  reportingPeriod?: string
  currency?: string
  unit?: string
  lineItems: Array<{
    lineItem: string
    values: Array<{
      year: string
      value: number | null
      currency?: string
      unit?: string
      note?: string | null
    }>
  }>
  metadata: {
    confidence: 'high' | 'medium' | 'low'
    notes: string[]
  }
}

export async function extractFinancialData(
  documentText: string
): Promise<FinancialData> {
  try {
    const openai = getOpenAIClient()
    const model = getModel()

    const systemPrompt = `
You are a financial data extraction engine.

Return ONLY minified JSON.
No markdown.
No explanations.
No backticks.
No text before or after JSON.
Response must start with { and end with }.

Extract:
- companyName
- reportingPeriod
- currency
- unit
- all financial lineItems across years
- metadata with confidence and notes

If unsure, lower confidence.
If no data found, return empty lineItems array.

Format:
{
"companyName": "...",
"reportingPeriod": "...",
"currency": "...",
"unit": "...",
"lineItems": [],
"metadata": {
  "confidence": "low",
  "notes": []
}
}
`

    const response = await openai.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Extract financial data from this document:\n\n${documentText.substring(
            0,
            6000
          )}`,
        },
      ],
    })

    const raw = response.choices[0]?.message?.content

    if (!raw) throw new Error('Empty model response')

    console.log('Raw model output:', raw)

    let parsed: ExtractionResult

    try {
      parsed = JSON.parse(raw)
    } catch {
      const cleaned = extractFirstJsonObject(raw)
      parsed = JSON.parse(cleaned)
    }

    const result: FinancialData = {
      companyName: parsed.companyName || undefined,
      reportingPeriod: parsed.reportingPeriod || undefined,
      currency: parsed.currency || undefined,
      unit: parsed.unit || undefined,

      // 🔥 Type-safe normalization (FIXED note issue here)
      lineItems: (parsed.lineItems || []).map(item => ({
        lineItem: item.lineItem,
        values: (item.values || []).map(v => ({
          year: v.year,
          value: v.value ?? null,
          currency: v.currency || undefined,
          unit: v.unit || undefined,
          note: v.note ?? undefined, // ✅ converts null → undefined
        })),
      })),

      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: parsed.metadata?.confidence || 'low',
        notes: parsed.metadata?.notes || [],
      },
    }

    return result
  } catch (error) {
    console.error('Extraction error:', error)

    return {
      companyName: undefined,
      reportingPeriod: undefined,
      currency: undefined,
      unit: undefined,
      lineItems: [],
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: 'low',
        notes: ['Model failed to return valid structured data'],
      },
    }
  }
}

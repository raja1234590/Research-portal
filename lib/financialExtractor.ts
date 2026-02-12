import OpenAI from 'openai'
import { FinancialData } from '@/types'

function getEnv(name: string) {
  const v = process.env[name]
  return v && v.trim().length > 0 ? v.trim() : undefined
}

function getOpenAIClient() {
  const apiKey = getEnv('OPENAI_API_KEY')
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Please set OPENAI_API_KEY environment variable.'
    )
  }
  const baseURL = getEnv('OPENAI_BASE_URL')
  return new OpenAI({ apiKey, baseURL })
}

function getModel() {
  return getEnv('OPENAI_MODEL') ?? 'gpt-4o-mini'
}

function isGroqProvider() {
  const base = getEnv('OPENAI_BASE_URL') ?? ''
  return base.includes('api.groq.com')
}

function extractFirstJsonObject(text: string): string {
  // Attempts to find the first top-level JSON object in a possibly messy response.
  const start = text.indexOf('{')
  if (start === -1) throw new Error('Model did not return JSON')
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\') {
      if (inString) escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth === 0) return text.slice(start, i + 1)
  }
  throw new Error('Could not parse JSON from model response')
}

function detectCurrencyAndUnit(documentText: string): {
  currency?: string
  unit?: string
} {
  const snippet = documentText.slice(0, 4000).toLowerCase()

  let currency: string | undefined
  let unit: string | undefined

  // Currency detection
  if (/[₹]/.test(snippet) || /\binr\b/.test(snippet) || /\b₹\s*in\b/.test(snippet)) {
    currency = 'INR'
  } else if (/\busd\b/.test(snippet) || /\bUS dollars?\b/i.test(documentText) || /\$/.test(snippet)) {
    currency = 'USD'
  } else if (/[€]/.test(snippet) || /\beur\b/.test(snippet) || /\beuro\b/.test(snippet)) {
    currency = 'EUR'
  } else if (/\bgbp\b/.test(snippet) || /£/.test(snippet)) {
    currency = 'GBP'
  } else if (/\bJPY\b/i.test(documentText) || /¥/.test(snippet)) {
    currency = 'JPY'
  }

  // Unit detection (crores, millions, thousands, etc.)
  if (/in\s+crores/.test(snippet) || /₹\s*in\s*crores/.test(snippet) || /rs\.\s*in\s*crores/.test(snippet)) {
    unit = 'crores'
  } else if (/in\s+lakhs?/.test(snippet) || /in\s+lacs?/.test(snippet)) {
    unit = 'lakhs'
  } else if (/in\s+millions?/.test(snippet) || /\bmn\b/.test(snippet)) {
    unit = 'millions'
  } else if (/in\s+billions?/.test(snippet) || /\bbn\b/.test(snippet)) {
    unit = 'billions'
  } else if (/in\s+thousands?/.test(snippet) || /in\s+'000s?/.test(snippet)) {
    unit = 'thousands'
  }

  return { currency, unit }
}

function cleanModelJsonString(raw: string): string {
  // Some models may echo pseudo-types like "number or null" from the prompt.
  // Replace the most common patterns with valid JSON fallbacks.
  return raw
    .replace(/:\s*number or null/gi, ': null')
    .replace(/:\s*string or null/gi, ': null')
    .replace(/:\s*\"number\" or \"null\"/gi, ': null')
    .replace(/:\s*\"string\" or \"null\"/gi, ': null')
}

/**
 * Some providers (including Groq) may wrap JSON responses in Markdown fences
 * like ```json ... ``` even when instructed not to. This helper strips those
 * fences so that downstream JSON.parse calls have a clean payload.
 */
function stripMarkdownFences(raw: string): string {
  let text = raw.trim()

  if (text.startsWith('```')) {
    // Remove leading fence (``` or ```json)
    const firstNewline = text.indexOf('\n')
    if (firstNewline !== -1) {
      text = text.slice(firstNewline + 1)
    } else {
      // Edge case: everything is on one line like ```{...}
      text = text.replace(/^```[a-zA-Z0-9]*\s*/, '')
    }

    // Remove trailing fence if present
    const lastFence = text.lastIndexOf('```')
    if (lastFence !== -1) {
      text = text.slice(0, lastFence)
    }
  }

  return text.trim()
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
      note?: string
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
  const systemPrompt = `You are a financial data extraction expert. Extract financial statement line items from the provided document and return structured JSON data.

Your task:
1. Identify all financial line items (Revenue, Expenses, Profit, etc.)
2. Extract values for each line item across all available years/periods
3. Identify the currency and unit (e.g., "crores", "millions", "thousands")
4. Handle missing or ambiguous data appropriately
5. Normalize line item names to standard accounting terms where possible

Standard line items to look for (but extract ALL found items):
- Revenue from operations / Operating Revenue / Total Revenue
- Other Income / Other Revenue
- Total Income / Total Revenue
- Cost of Materials / Cost of Goods Sold / COGS
- Employee Benefits Expense / Salaries and Wages
- Finance Costs / Interest Expense
- Depreciation and Amortization
- Other Expenses
- Operating Profit / EBIT
- Profit Before Tax / PBT
- Tax Expense
- Profit After Tax / Net Profit / PAT
- Gross Profit
- Gross Margin

For each line item:
- Extract all available years/periods
- If a value is missing, use null
- If a value is ambiguous or estimated, add a note
- Preserve the original line item name if it doesn't match standard terms

Return JSON in this exact format:
{
  "companyName": "Tata Motors Limited",
  "reportingPeriod": "For the year ended March 31, 2025",
  "currency": "INR",
  "unit": "crores",
  "lineItems": [
    {
      "lineItem": "Revenue from operations",
      "values": [
        {
          "year": "FY 25",
          "value": 204813,
          "currency": "INR",
          "unit": "crores",
          "note": null
        }
      ]
    }
  ],
  "metadata": {
    "confidence": "high",
    "notes": ["example note about any important observation"]
  }
}

Be precise with numbers. Do not hallucinate values. If uncertain, set confidence to "medium" or "low" and add notes.

CRITICAL RESPONSE RULES:
- Your entire reply MUST be a single valid JSON object exactly in the format shown above.
- Do NOT include any additional text, explanations, comments, or markdown.
- Do NOT wrap the JSON in backticks.
- Do NOT prepend or append any text outside the JSON object.`

  try {
    const openai = getOpenAIClient()
    const model = getModel()
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        // Use a smaller slice of the document so the model call is faster
        // and less likely to hit the Vercel FUNCTION_INVOCATION_TIMEOUT limit.
        content: `Extract financial data from this document. Focus on the main statement tables and key totals only:\n\n${documentText.substring(
          0,
          2500
        )}`,
      },
    ]

    let content: string | undefined

    const isGroq = isGroqProvider()

    if (!isGroq) {
      // OpenAI with JSON mode
      try {
        const response = await openai.chat.completions.create({
          model,
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.1,
        })
        content = response.choices[0]?.message?.content ?? undefined
      } catch {
        const response = await openai.chat.completions.create({
          model,
          messages,
          temperature: 0.1,
        })
        content = response.choices[0]?.message?.content ?? undefined
      }
    } else {
      // Groq provider: try to force JSON mode as well
      try {
        const response = await openai.chat.completions.create({
          model,
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.1,
        })
        content = response.choices[0]?.message?.content ?? undefined
      } catch {
        // Fallback without response_format if Groq model rejects json_object
        const response = await openai.chat.completions.create({
          model,
          messages,
          temperature: 0.1,
        })
        content = response.choices[0]?.message?.content ?? undefined
      }
    }

    if (!content) throw new Error('No response from AI model')

    // Helpful for debugging model output during development.
    // Log a larger portion so you can see the full JSON the model returns.
    console.log(
      'Model raw content (first 2000 chars):',
      content.slice(0, 2000)
    )

    // Normalise content before attempting JSON parsing
    content = stripMarkdownFences(content)
    content = cleanModelJsonString(content)

    let extracted: ExtractionResult
    try {
      // First, try to parse the whole content as JSON
      extracted = JSON.parse(content)
    } catch {
      try {
        // Next, try to pull out the first JSON object from a messy reply
        extracted = JSON.parse(extractFirstJsonObject(content))
      } catch {
        // Fallback: model did not return valid JSON at all
        extracted = {
          companyName: undefined,
          reportingPeriod: undefined,
          currency: undefined,
          unit: undefined,
          lineItems: [],
          metadata: {
            confidence: 'low',
            notes: [
              'Model did not return valid JSON. Raw response was kept only in logs for debugging.',
            ],
          },
        }
      }
    }

    // Heuristic detection from raw text (used when model leaves fields empty)
    const detected = detectCurrencyAndUnit(documentText)

    // Transform to FinancialData format
    const financialData: FinancialData = {
      companyName: extracted.companyName || undefined,
      reportingPeriod: extracted.reportingPeriod || undefined,
      currency: extracted.currency || detected.currency || undefined,
      unit: extracted.unit || detected.unit || undefined,
      lineItems: extracted.lineItems,
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: extracted.metadata.confidence,
        notes: extracted.metadata.notes || [],
      },
    }

    return financialData
  } catch (error) {
    console.error('Extraction error:', error)
    throw new Error(
      `Failed to extract financial data: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

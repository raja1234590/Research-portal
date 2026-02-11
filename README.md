# Research Portal - Financial Statement Extractor

An AI-powered research portal that extracts financial statement data from documents and exports it to Excel/CSV format.

## Features

- **Document Upload**: Upload financial documents (TXT, DOCX, PDF support planned)
- **AI-Powered Extraction**: Uses GPT-4 to extract financial line items from unstructured documents
- **Multi-Year Support**: Extracts data across multiple reporting periods
- **Excel/CSV Export**: Export extracted data in analyst-ready formats
- **Data Quality Indicators**: Shows confidence levels and notes for ambiguous data

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Optional (for OpenAI-compatible providers like Groq):
   ```
   # Example for Groq (OpenAI-compatible)
   OPENAI_BASE_URL=https://api.groq.com/openai/v1
   OPENAI_MODEL=llama-3.1-70b-versatile
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

## Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project (framework preset: Next.js)

3. **Add Environment Variable:**
   - In Vercel project settings, go to "Environment Variables"
   - Add `OPENAI_API_KEY` with your OpenAI API key
   - Make sure it's available for Production, Preview, and Development

4. **Deploy:**
   - Click "Deploy"
   - Your app will be available at `https://your-project.vercel.app`

### Environment Variables Required

- `OPENAI_API_KEY`: Your OpenAI API key (required for extraction)
  - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Using Groq instead of OpenAI (allowed)

Groq provides an **OpenAI-compatible API**. To use Groq:

- Set `OPENAI_API_KEY` to your **Groq API key**
- Set `OPENAI_BASE_URL` to `https://api.groq.com/openai/v1`
- Set `OPENAI_MODEL` to a Groq-supported model (example: `llama-3.1-70b-versatile`)

Note: Some providers may not support strict JSON mode; this app includes a **JSON parsing fallback** to stay reliable.

### Deployment Notes

- **Free Tier Limitations:**
  - Vercel free tier allows 10-second function execution time
  - For large documents or slower API responses, consider upgrading to Vercel Pro (30s timeout)
  - API calls to OpenAI count against your OpenAI usage limits
  - File uploads are limited to 10MB

- **Alternative Hosting:**
  - **Netlify**: Similar setup, supports Next.js
  - **Render**: Supports Next.js with environment variables
  - **Railway**: Good for full-stack apps

## Usage

1. Upload a financial document (annual report, financial statement, etc.)
2. Wait for the AI to extract financial data
3. Review the extracted data in the table
4. Export to Excel or CSV for further analysis

## Limitations

- **PDF Support**: Currently, PDF files need to be converted to text first. Full PDF parsing will be added in future versions.
- **File Size**: Maximum file size is 10MB
- **Token Limits**: Documents are truncated to ~15,000 characters to fit within API limits
- **Free Hosting**: Vercel free tier has limitations on serverless function execution time (10 seconds)

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **OpenAI API**: GPT-4 for financial data extraction
- **xlsx**: Excel file generation
- **react-dropzone**: File upload component

## Project Structure

```
├── app/
│   ├── api/extract/     # API route for financial extraction
│   ├── page.tsx         # Main page
│   └── layout.tsx       # Root layout
├── components/
│   ├── DocumentUpload.tsx   # File upload component
│   └── ResultsDisplay.tsx   # Results table and export
├── lib/
│   ├── financialExtractor.ts  # AI extraction logic
│   └── excelExporter.ts       # Excel/CSV export
└── types/
    └── index.ts              # TypeScript types
```

## Notes

- The extraction uses GPT-4 with JSON mode for structured output
- Confidence levels indicate extraction quality (high/medium/low)
- Missing or ambiguous data is marked with notes
- All extracted values preserve original currency and units

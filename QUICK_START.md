# Quick Start Guide

## Local Development

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   Create `.env.local`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Run:**
   ```bash
   npm run dev
   ```

4. **Test:**
   - Open http://localhost:3000
   - Upload a financial document or paste text
   - Review extracted data
   - Export to Excel/CSV

## Testing with Sample Data

You can test with financial statement text like:

```
TATA MOTORS LIMITED
Financial Year 2025

Revenue from operations: 204,813 crores
Other sources: 1,212 crores
Total Revenue: 206,025 crores

Cost of Materials Consumed: 82,937.43 crores
Employee Benefits: 12,663 crores
Finance Costs: 1,076 crores
Depreciation: 5,295 crores
Other Expenses: 21,187 crores

Profit Before Tax: 11,504 crores
Tax Expense: 2,948 crores
Net Profit: 8,556 crores
```

## Common Issues

**"OpenAI API key not configured"**
- Check `.env.local` exists and has `OPENAI_API_KEY`
- Restart dev server after adding env var

**"Failed to extract financial data"**
- Verify API key is valid
- Check OpenAI account has credits
- Try with smaller text sample

**PDF files not working**
- PDFs need to be text-based (not scanned)
- Convert to TXT or DOCX first
- Or copy/paste text content

## Next Steps

- Deploy to Vercel (see DEPLOYMENT.md)
- Test with real financial documents
- Customize extraction prompts if needed

# Deployment Guide

## Quick Start

1. **Set up environment variables:**
   ```bash
   # Create .env.local file
   echo "OPENAI_API_KEY=your_key_here" > .env.local
   ```

2. **Install and run locally:**
   ```bash
   npm install
   npm run dev
   ```

3. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel

   # Add environment variable
   vercel env add OPENAI_API_KEY
   ```

## Testing Before Deployment

1. Test with a sample financial statement text
2. Verify Excel/CSV export works
3. Check that error handling works for invalid inputs
4. Test with different document formats

## Production Checklist

- [ ] OpenAI API key is set in environment variables
- [ ] API key has sufficient credits/quota
- [ ] File size limits are appropriate (currently 10MB)
- [ ] Error messages are user-friendly
- [ ] CORS is configured if needed
- [ ] Rate limiting is considered (if needed)

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `OPENAI_API_KEY` is set in Vercel environment variables
- Redeploy after adding environment variables

### "Function timeout"
- Large documents may exceed free tier limits
- Consider upgrading to Vercel Pro (30s timeout)
- Or implement chunking for very large documents

### "Failed to extract financial data"
- Check OpenAI API key is valid
- Verify API key has credits
- Check OpenAI API status
- Review error logs in Vercel dashboard

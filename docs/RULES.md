# DEVELOPMENT RULES

## 4.1 General Code Rules
- **Use TypeScript**: Strict mode enabled
- **Reuse existing components**: Do not duplicate
- **Keep functions small**: Single responsibility
- **Do not modify unrelated files**: Focused changes
- **Follow DESIGN.md exactly**: Maintain consistency

## 4.2 Frontend Rules
- **Mobile responsive**: Test at all breakpoints (375px, 768px, 1440px)
- **Loading states**: Always show spinner + message
- **Error states**: Display error message and retry
- **Empty states**: Show message when no data
- **Accessibility**: ARIA labels, keyboard navigation
- **No hardcoded API URLs**: Use environment variables

## 4.3 Backend Rules
- **Validate all inputs**: Server-side validation required
- **Check authentication**: Verify user before operations
- **Use RLS**: Row Level Security on all tables
- **Log all changes**: Audit logs for traceability
- **Handle errors gracefully**: Return meaningful messages
- **Use stored procedures**: For complex queries

## 4.4 Security Rules
- **Never expose API keys**: Use `.env.local`
- **Validate user input**: Prevent injection attacks
- **Verify authorization**: Check roles server-side
- **Use HTTPS only**: Production deployment required
- **Sanitize outputs**: Prevent XSS
- **Minimal patient data**: Only blood group

## 4.5 Testing Rules
- **Add tests for important features**
- **Run tests after implementation**
- **Fix failing tests before merging**
- **Test mobile, tablet, desktop**
- **Test with actual slowness (3G throttling)**

## 4.6 Git Rules
- **Make small commits**: One feature per commit
- **Descriptive messages**: 'feat: add emergency matching'
- **Branch per feature**: `feature/emergency-matching`
- **Push frequently**: Commit every 30-60 minutes
- **Never force push to main**

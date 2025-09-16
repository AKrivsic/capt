# Runbook - Provoz & Incidenty

## Přehled

Tento runbook obsahuje postupy pro provozní úkoly, řešení incidentů a monitoring Captioni systému.

## Monitoring & Alerting

### Health Checks

```bash
# API health check
curl https://captioni.com/api/health

# Queue status
curl https://captioni.com/api/queue/test

# Database connection
curl https://captioni.com/api/health | jq '.services.database'
```

### Key Metrics

**API Performance:**
- Response time p95 < 2s
- Error rate < 1%
- Success rate > 99%

**Queue Performance:**
- Waiting jobs < 100
- Processing time p95 < 5min
- Failed jobs < 5%

**Database:**
- Connection pool usage < 80%
- Query time p95 < 500ms
- Active connections < 50

### Logs

```bash
# Vercel logs
vercel logs --follow

# Specific function logs
vercel logs --follow --function=api/generate
vercel logs --follow --function=api/crons/daily

# Worker logs (pokud běží na separátním serveru)
tail -f /var/log/captioni-worker.log
```

## Video Pipeline Troubleshooting

### "No such file or directory" errors
**Symptom:** FFmpeg fails with file not found errors
**Root Cause:** Missing demo files or incorrect paths
**Solution:**
```bash
# Check if demo files exist
ls -la public/demo/videos/

# Verify font files
ls -la public/fonts/Inter-Regular.ttf

# Test video generation
curl -X POST $BASE/api/video/generate \
  -H "content-type: application/json" \
  -d '{"demoFile":"demo.mp4","text":"Test"}'
```

### "fontfile not found" errors
**Symptom:** FFmpeg drawtext fails with font errors
**Root Cause:** Missing or inaccessible font files
**Solution:**
```bash
# Verify font file exists and is readable
ls -la public/fonts/Inter-Regular.ttf
file public/fonts/Inter-Regular.ttf

# Test with different font
curl -X POST $BASE/api/video/generate \
  -H "content-type: application/json" \
  -d '{"demoFile":"demo.mp4","text":"Test","style":"BARBIE"}'
```

### R2 storage failures
**Symptom:** Upload/download operations fail
**Root Cause:** R2 configuration or network issues
**Solution:**
```bash
# Check R2 configuration
echo $R2_ACCESS_KEY_ID
echo $R2_ENDPOINT

# Test R2 connection
curl -X POST $BASE/api/video/upload-init \
  -H "content-type: application/json" \
  -d '{"fileName":"test.mp4","fileSize":1000000,"mimeType":"video/mp4"}'
```

### Worker queue failures
**Symptom:** Video processing jobs stuck or failing
**Root Cause:** Redis connection or worker issues
**Solution:**
```bash
# Check Redis connection
curl $BASE/api/queue/test

# Check worker status
curl $BASE/api/video/job/{jobId}

# Restart worker (if running on separate server)
pm2 restart captioni-worker
```

## Incident Response

### Severity Levels

**P1 - Critical**
- Systém nedostupný
- Payment processing nefunguje
- Data loss

**P2 - High**
- API pomalé (>5s response time)
- Queue backlog >1000 jobs
- High error rate (>5%)

**P3 - Medium**
- Non-critical features nefungují
- Performance degradation
- Minor bugs

### Response Procedures

#### P1 - Critical Incident

1. **Immediate Response (0-5 min)**
   ```bash
   # Check system status
   curl https://captioni.com/api/health
   
   # Check Vercel status
   # Check external services (Stripe, OpenAI, etc.)
   ```

2. **Investigation (5-15 min)**
   ```bash
   # Check logs
   vercel logs --follow
   
   # Check database
   vercel postgres connect captioni-db
   
   # Check queue
   curl https://captioni.com/api/queue/test
   ```

3. **Resolution (15-60 min)**
   - Implement fix
   - Deploy hotfix
   - Monitor recovery

4. **Post-incident (1-24h)**
   - Root cause analysis
   - Update runbook
   - Prevent recurrence

#### P2 - High Priority

1. **Investigation (0-30 min)**
   ```bash
   # Check specific metrics
   # Analyze logs
   # Identify bottleneck
   ```

2. **Resolution (30-120 min)**
   - Implement fix
   - Deploy update
   - Monitor improvement

#### P3 - Medium Priority

1. **Investigation (0-2h)**
   - Analyze issue
   - Plan fix

2. **Resolution (2h-1d)**
   - Implement fix
   - Deploy in next release

## Common Issues & Solutions

### 1. API Slow Response Times

**Symptoms:**
- Response time >5s
- High error rate
- User complaints

**Investigation:**
```bash
# Check API health
curl https://captioni.com/api/health

# Check specific endpoint
curl -w "@curl-format.txt" https://captioni.com/api/generate

# Check Vercel logs
vercel logs --follow --function=api/generate
```

**Solutions:**
- Check OpenAI API status
- Check database performance
- Check Redis connection
- Scale Vercel functions
- Optimize database queries

### 2. Queue Backlog

**Symptoms:**
- Waiting jobs >100
- Long processing times
- User complaints about video processing

**Investigation:**
```bash
# Check queue status
curl https://captioni.com/api/queue/test

# Check worker logs
vercel logs --follow --function=api/crons/daily
```

**Solutions:**
- Restart worker process
- Increase worker concurrency
- Check Redis connection
- Check OpenAI Whisper API
- Check R2 storage

### 3. Database Connection Issues

**Symptoms:**
- Database errors in logs
- API failures
- Connection timeouts

**Investigation:**
```bash
# Check database health
curl https://captioni.com/api/health | jq '.services.database'

# Check Vercel Postgres
vercel postgres connect captioni-db
```

**Solutions:**
- Check Vercel Postgres status
- Restart database connections
- Check connection pooling
- Scale database if needed

### 4. Payment Processing Issues

**Symptoms:**
- Stripe webhook failures
- Payment not processing
- User subscription issues

**Investigation:**
```bash
# Check Stripe webhook logs
vercel logs --follow --function=api/stripe/webhook

# Check Stripe dashboard
# Check webhook endpoint status
```

**Solutions:**
- Check Stripe webhook configuration
- Verify webhook secret
- Check Stripe API status
- Manual payment processing if needed

### 5. Video Processing Failures

**Symptoms:**
- Video jobs failing
- High failure rate
- User complaints

**Investigation:**
```bash
# Check queue status
curl https://captioni.com/api/queue/test

# Check worker logs
vercel logs --follow --function=api/crons/daily

# Check specific job
curl https://captioni.com/api/video/job/{jobId}
```

**Solutions:**
- Check OpenAI Whisper API
- Check R2 storage
- Check FFmpeg availability
- Restart worker process
- Check file formats

## Maintenance Tasks

### Daily Tasks

```bash
# Check system health
curl https://captioni.com/api/health

# Check queue status
curl https://captioni.com/api/queue/test

# Check cron job execution
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://captioni.com/api/crons/daily
```

### Weekly Tasks

```bash
# Check database performance
vercel postgres connect captioni-db
# Run performance queries

# Check storage usage
# Check R2 bucket usage

# Review error logs
vercel logs --follow | grep ERROR
```

### Monthly Tasks

```bash
# Review system metrics
# Check capacity planning
# Update dependencies
# Review security
# Backup verification
```

## Emergency Procedures

### System Down

1. **Check Vercel Status**
   - Vercel dashboard
   - Status page

2. **Check External Services**
   - Stripe status
   - OpenAI status
   - Upstash status
   - Cloudflare status

3. **Rollback if Needed**
   ```bash
   vercel rollback
   ```

4. **Communicate**
   - Update status page
   - Notify users
   - Post on social media

### Data Loss

1. **Immediate Response**
   - Stop all writes
   - Assess damage
   - Notify team

2. **Recovery**
   - Restore from backup
   - Verify data integrity
   - Test system

3. **Communication**
   - Notify affected users
   - Provide timeline
   - Update status

### Security Incident

1. **Immediate Response**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Investigation**
   - Analyze logs
   - Identify attack vector
   - Assess damage

3. **Recovery**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Restore services

4. **Communication**
   - Notify users if needed
   - Update security measures
   - Document lessons learned

## Performance Optimization

### Database Optimization

```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public';
```

### API Optimization

```bash
# Check response times
curl -w "@curl-format.txt" https://captioni.com/api/generate

# Check memory usage
vercel logs --follow | grep "Memory usage"

# Check function duration
vercel logs --follow | grep "Duration"
```

### Queue Optimization

```bash
# Check queue metrics
curl https://captioni.com/api/queue/test

# Monitor job processing times
# Check worker concurrency
# Optimize job payloads
```

## Backup & Recovery

### Database Backup

```bash
# Vercel Postgres automatic backups
# Daily backups kept for 7 days
# Weekly backups kept for 4 weeks

# Manual backup
vercel postgres backup create captioni-db
```

### File Backup

```bash
# Cloudflare R2 automatic backups
# Cross-region replication
# Versioning enabled
```

### Code Backup

```bash
# Git repository
# Vercel deployments
# GitHub Actions (if configured)
```

## Known Issues & Workarounds

### 1. OpenAI API Rate Limits

**Issue:** OpenAI API rate limits causing failures

**Workaround:**
- Implement exponential backoff
- Use multiple API keys
- Cache responses where possible

### 2. Redis Connection Drops

**Issue:** Redis connections occasionally drop

**Workaround:**
- Implement connection retry logic
- Use connection pooling
- Monitor connection health

### 3. Vercel Function Timeouts

**Issue:** Long-running functions timeout

**Workaround:**
- Use background jobs
- Optimize function code
- Increase maxDuration if needed

### 4. Stripe Webhook Delays

**Issue:** Stripe webhooks sometimes delayed

**Workaround:**
- Implement webhook retry logic
- Use Stripe CLI for testing
- Monitor webhook delivery

## Escalation Procedures

### Level 1 - On-call Engineer
- Basic troubleshooting
- Common issues
- Initial investigation

### Level 2 - Senior Engineer
- Complex issues
- System architecture
- Performance optimization

### Level 3 - Engineering Manager
- Critical incidents
- Business impact
- Resource allocation

### Level 4 - CTO/Founder
- Business-critical issues
- Strategic decisions
- External communication

## Contact Information

### Internal Contacts
- **On-call Engineer:** [Contact info]
- **Senior Engineer:** [Contact info]
- **Engineering Manager:** [Contact info]
- **CTO:** [Contact info]

### External Contacts
- **Vercel Support:** [Contact info]
- **Stripe Support:** [Contact info]
- **OpenAI Support:** [Contact info]
- **Upstash Support:** [Contact info]

## Assumptions & Gaps

### Assumptions
- Vercel Postgres backupy jsou dostatečné
- External services jsou spolehlivé
- Monitoring pokrývá všechny kritické metriky

### Gaps
- Chybí automated alerting
- Chybí incident response automation
- Chybí performance monitoring dashboard
- Chybí automated recovery procedures

# Go-Live Checklist

## Staging
- [ ] Populate `.env` with staging credentials.
- [ ] Register Discord slash commands.
- [ ] Verify webhook signature validation.
- [ ] Test Riipen -> Discord thread creation.
- [ ] Test Discord reply -> Riipen message send.
- [ ] Validate retry behavior on forced Riipen API failures.

## Production rollout
- [ ] Deploy with HTTPS URL.
- [ ] Configure Riipen webhook target to production endpoint.
- [ ] Confirm Discord bot online and permissions.
- [ ] Run smoke test with a real project update event.
- [ ] Set up log alerts for webhook signature failures and outbound send failures.

## Post-launch monitoring
- [ ] Track webhook acceptance rate.
- [ ] Track outbound delivery success rate.
- [ ] Review user feedback from students/employers for thread clarity and notification noise.

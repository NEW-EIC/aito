// Vitest setup — populate env vars for modules that boot-validate them.
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
process.env.STRIPE_PUBLISHABLE_KEY ??= "pk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET ??= "whsec_dummy";
process.env.STRIPE_PRICE_PREMIUM_MONTHLY ??= "price_premium_monthly";
process.env.STRIPE_PRICE_PREMIUM_YEARLY ??= "price_premium_yearly";
process.env.STRIPE_PRICE_PRO_MONTHLY ??= "price_pro_monthly";
process.env.STRIPE_PRICE_PRO_YEARLY ??= "price_pro_yearly";

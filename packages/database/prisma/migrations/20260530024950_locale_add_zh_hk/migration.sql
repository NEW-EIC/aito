-- Add Hong Kong Cantonese-leaning Traditional as a first-class locale.
-- The i18n folder already ships zh-HK alongside en + zh-CN, and editors
-- want to author article translations directly in zh-HK without folding
-- them under zh-TW (which is Taiwan Mandarin). Additive enum change —
-- safe on existing rows because no row currently uses zh_TW either.

ALTER TYPE "locale" ADD VALUE IF NOT EXISTS 'zh-HK' BEFORE 'zh-TW';

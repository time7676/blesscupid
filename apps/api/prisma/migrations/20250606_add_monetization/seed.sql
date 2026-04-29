-- Seed default subscription plans and coin packages
-- Run after migration.sql

INSERT INTO "SubscriptionPlan" ("id", "tier", "cycle", "priceIdr", "features", "coinBonus", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'light', 'monthly',   30000, '{"swipeLimit":150,"superLikes":5,"advancedFilter":true,"rewind":false,"boost":false,"messageBeforeMatch":false,"seeWhoLikedYou":false,"incognito":false,"readReceipt":false,"algorithmPriority":0}', 50, true, NOW(), NOW()),
  (gen_random_uuid(), 'light', 'quarterly', 75000, '{"swipeLimit":150,"superLikes":5,"advancedFilter":true,"rewind":false,"boost":false,"messageBeforeMatch":false,"seeWhoLikedYou":false,"incognito":false,"readReceipt":false,"algorithmPriority":0}', 200, true, NOW(), NOW()),
  (gen_random_uuid(), 'open',  'monthly',   89000, '{"swipeLimit":"unlimited","superLikes":10,"advancedFilter":true,"rewind":true,"boost":false,"messageBeforeMatch":true,"seeWhoLikedYou":true,"incognito":false,"readReceipt":false,"algorithmPriority":1}', 150, true, NOW(), NOW()),
  (gen_random_uuid(), 'open',  'quarterly', 229000, '{"swipeLimit":"unlimited","superLikes":10,"advancedFilter":true,"rewind":true,"boost":false,"messageBeforeMatch":true,"seeWhoLikedYou":true,"incognito":false,"readReceipt":false,"algorithmPriority":1}', 500, true, NOW(), NOW()),
  (gen_random_uuid(), 'deep',  'monthly',   159000, '{"swipeLimit":"unlimited","superLikes":"unlimited","advancedFilter":true,"rewind":true,"boost":true,"messageBeforeMatch":true,"seeWhoLikedYou":true,"incognito":true,"readReceipt":true,"algorithmPriority":2}', 300, true, NOW(), NOW()),
  (gen_random_uuid(), 'deep',  'quarterly', 429000, '{"swipeLimit":"unlimited","superLikes":"unlimited","advancedFilter":true,"rewind":true,"boost":true,"messageBeforeMatch":true,"seeWhoLikedYou":true,"incognito":true,"readReceipt":true,"algorithmPriority":2}', 1000, true, NOW(), NOW())
ON CONFLICT ("tier", "cycle") DO NOTHING;

INSERT INTO "CoinPackage" ("id", "coinAmount", "bonusCoins", "priceIdr", "isActive", "createdAt")
VALUES
  (gen_random_uuid(), 50,  0,  15000,  true, NOW()),
  (gen_random_uuid(), 120, 10, 35000,  true, NOW()),
  (gen_random_uuid(), 300, 40, 75000,  true, NOW()),
  (gen_random_uuid(), 700, 120, 150000, true, NOW());

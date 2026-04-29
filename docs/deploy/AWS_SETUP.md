# AWS Setup — Rekognition + IAM

## 1. Create AWS Account
- https://aws.amazon.com/free/ (free tier 12 months)
- Sign in with root email; verify phone

## 2. Create IAM User (not root)
- IAM → Users → Add user
- Name: `blesscupid-rekognition`
- Attach policies directly:
  - `AmazonRekognitionFullAccess`
- Skip console access (programmatic only)
- Save Access Key ID + Secret Access Key

## 3. Get credentials into .env
```
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
PHOTO_BUCKET=blesscupid-photos-dev
```

## 4. Test locally
```bash
aws configure  # enter keys above
aws rekognition detect-faces \
  --image "S3Object={Bucket=blesscupid-photos-dev,Name=test.jpg}" \
  --region ap-northeast-1
```

## 5. Cost
- 5,000 face comparisons/mo free for 12mo
- After: ~$0.001/face → ~$0.09/day for 3 daily matches

Next: Cloudflare R2 for image storage.

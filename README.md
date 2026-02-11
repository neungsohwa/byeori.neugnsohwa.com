# Byeori

<img src="./src/assets/byeori.svg" width="100" height="100" alt="Byeori" />

AI Supervision OS

## 개발 (Development)

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

## 빌드 (Build)

```bash
# 프로덕션 빌드
pnpm build

# 빌드 프리뷰
pnpm preview
```

## Cloudflare Pages 배포 (Cloudflare Pages Deployment)

이 프로젝트는 Cloudflare Pages에 배포할 수 있도록 설정되어 있습니다.

### 자동 배포 (Automatic Deployment)

1. Cloudflare 대시보드에 로그인: https://dash.cloudflare.com/
2. **Workers & Pages** 메뉴로 이동
3. **Create application** > **Pages** > **Connect to Git** 선택
4. GitHub 저장소 연결 및 선택
5. 빌드 설정:
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Node version**: `18` 이상
6. **Save and Deploy** 클릭

### Wrangler CLI를 통한 배포 (CLI Deployment)

```bash
# Wrangler 설치
npm install -g wrangler

# Cloudflare 로그인
wrangler login

# 빌드
pnpm build

# 배포
wrangler pages deploy dist --project-name=byeori-neugnsohwa
```

### 환경 변수 설정 (Environment Variables)

Cloudflare Pages 대시보드에서 환경 변수를 설정할 수 있습니다:
1. Cloudflare Pages 프로젝트 대시보드로 이동
2. **Settings** > **Environment variables** 선택
3. 다음 환경 변수들을 추가:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`

**참고**: `.env` 파일의 모든 변수들을 Cloudflare Pages에 동일하게 추가하세요.
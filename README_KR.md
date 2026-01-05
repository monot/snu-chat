# SNUF 챗봇 실행 가이드

이 문서는 서울대학교 발전재단 챗봇(SNUF Chatbot)을 설치하고 실행하는 방법을 설명합니다.

## 1. 필수 요구사항
- **Node.js**: 18.17.0 이상
- **OpenAI API Key**: GPT 모델 사용을 위해 필요

## 2. 설치 (Installation)

프로젝트 루트 디렉토리에서 다음 명령어를 실행하여 의존성 패키지를 설치합니다.

```bash
npm install
```

## 3. 환경 변수 설정 (Environment Setup)

루트 디렉토리에 `.env.local` 파일을 생성하고 OpenAI API 키를 입력해야 합니다.

`.env.local` 파일 예시:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

## 4. 데이터 준비 (Data Preparation)

챗봇이 답변에 사용할 지식 베이스를 구축해야 합니다. 다음 명령어들을 순서대로 실행하세요.

### 4.1. 데이터 수집 (Scraping)
서울대학교 발전재단 홈페이지에서 정보를 수집합니다.
```bash
node scripts/scrape.mjs
```
실행 후 `data/knowledge.json` 파일이 생성됩니다.

### 4.2. 임베딩 생성 (Embedding)
수집된 데이터를 벡터화하여 검색 가능한 형태로 변환합니다. (OpenAI API 과금 발생)
```bash
node scripts/embed.mjs
```
실행 후 `data/embeddings.json` 파일이 생성됩니다.

## 5. 실행 (Running the App)

개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 챗봇을 테스트할 수 있습니다.

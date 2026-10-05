# 작업 로그

컴퓨터를 옮겨가며 작업하니까, **다른 데서 이어서 시작할 때 여기부터 읽는다.**
`README.md`는 "이게 뭐고 어떻게 돌리나", 이 파일은 "어디까지 했고 다음에 뭘 하나"만 다룬다.

작업을 마치면 **[상태]와 [다음]을 고치고, [기록] 맨 위에 한 줄 남긴 다음 커밋·푸시한다.**

---

## 상태 (2026-10-06 기준)

이 저장소는 **주인님 디스코드 서버에 넣는 봇·AI 모음**이다. 봇마다 폴더 하나 (`README.md`의 봇 표).

**방향 (2026-10-06 주인님과 이야기한 결과)**
- 원래 목표는 "개발팀"이었다. 정리 결과 **개발은 봇이 아니라 Claude Code를 직접 쓴다** —
  봇 하나를 거쳐도 결국 Claude Code이고, 밖에서는 Remote Control(휴대폰 앱)·Claude Code 웹으로 충분하다.
- 시로는 비서로만. 이 저장소와 연결되지 않는다.
- 공유 기억은 각 저장소의 `CLAUDE.md` + `WORKLOG.md`로 충분하다 (Pinecone 등은 필요해지면).

### 패치노트 봇 (`patch-notes/`) — 코드 끝, 비밀값 넣으면 켜짐
- GitHub Actions가 10분마다 `repos.json`의 저장소(시로, Safehouse=`safehouse_unity`)를 보고, 새 커밋을 Gemini 3.8 Flash로 요약해 웹후크로 올린다.
- 로컬에서 시로의 최근 커밋 3개로 DRY_RUN 확인: 요약 품질 괜찮음, 입력 8.6k/출력 1k 토큰 (10~20원).
- **실제 디스코드 게시와 Actions 실행은 아직 안 해 봤다.**

### 콘텐츠 팀 (`team/`) — 보류
- 나중에 인스타 콘텐츠용. 코드는 있다 (PM Claude Opus 5.5 + 리서처/작가/리뷰어/디자이너).
- Gemini 두 모델은 실제 호출 확인됨. **Claude Opus는 쿼터 0이라 429** — 켤 때 쿼터 신청 (global, anthropic-claude-opus, 분당 요청 20 / 입력 40만).
- 디스코드: PM 봇(`PM`, id 1554355441566220410) 만들어 서버에 초대, Intent 켬. 팀 채널·웹후크는 아직.

### GCP·디스코드 (이 Windows PC에 설정됨)
- 프로젝트 `aistudio-510104` (시로와 다른 새 프로젝트). Vertex AI API 켬, Claude Opus 5.5 사용 설정.
- 서비스 계정 `ai-team@aistudio-510104.iam.gserviceaccount.com` (Vertex AI 사용자). 키는 `C:\Users\User\.gcp\ai-team.json` — 저장소 밖.
- `.env` 채운 값: PM_BOT_TOKEN, TEAM_OWNER_ID, GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS.
- gcloud 설치됨 (`%LOCALAPPDATA%\Google\Cloud SDK`), 로그인은 안 함 (키 파일 사용).
- 디스코드 서버 id 1554315530691936337, 주인님 id 397941414614532096. 텍스트 채널은 `#일반`뿐.

---

## 다음 (순서대로)

1. **패치노트 켜기**
   - 디스코드에 `#패치노트` 채널 → 웹후크 URL.
   - GitHub aistudio → Settings → Secrets → Actions에 `PATCH_NOTES_WEBHOOK_SHIRO`(채널 1556779649025974394), `PATCH_NOTES_WEBHOOK_SAFEHOUSE`(채널 1556779700154802256), `GCP_SA_KEY`(키 JSON 내용 전체),
     `PATCH_NOTES_GH_TOKEN`(`safehouse_unity`가 비공개라 필요. fine-grained, Contents 읽기 전용).
   - Actions → patch-notes → Run workflow로 첫 실행 (북마크만 됨) → 아무 저장소에 커밋 푸시 → 10~20분 안에 올라오는지.
2. **PM 봇 토큰 Reset** — 채팅에 노출됐다. 콘텐츠 팀을 켤 때 새로 받아 `.env`에.
3. 다음 봇 후보 (주인님과 이야기한 순서): 스튜디오 상태 알림(서비스가 조용히 멈추면 알림) → 커밋 검토(다른 회사 모델) →
   취업 공고 봇(시로 `tools/jobspy/crawl.py` 재활용, 웹후크로 직접. 공개 서버면 LinkedIn·Indeed 약관 위험) → 인스타 콘텐츠 팀.

### 알려진 한계 / 나중에
- 패치노트: 비공개 저장소는 `PATCH_NOTES_GH_TOKEN`이 있어야 읽힌다 (토큰 만료되면 404로 실패 — 새로 넣기). 공개 저장소에 60일 커밋이 없으면 GitHub이 예약 실행을 끈다.
- 콘텐츠 팀: 스레드가 길면 PM 입력 비용이 커진다 → 프롬프트 캐싱. 주인님 첨부 이미지는 이름만 보인다.

---

## 기록

최신이 위.

### 2026-10-06 — 패치노트 대상: 시로 + Safehouse

aistudio는 빼고 `safehouse_unity`(비공개, PC `Desktop\Safehouse`)를 넣었다. 비공개 저장소용 읽기 토큰 비밀값을 받게 했고, 유니티 바이너리·에셋 파일 diff는 요약에서 뺀다.

### 2026-10-06 — 방향 정리, 패치노트 봇

개발팀을 봇으로 만들려던 것을 접었다: Claude Code를 직접 쓰는 게 낫다 (밖에서는 Remote Control·웹). 이 저장소는 서버용 봇 모음으로.
콘텐츠 팀 코드를 `src/` → `team/`으로 옮기고(서비스 파일이 지운 `src/server.ts`를 가리키던 것도 고침), 패치노트 봇을 새로 만들었다.
GCP 새 프로젝트·서비스 계정을 만들고 Gemini 호출까지 확인했다. 키 파일이 저장소에 staged 돼 있던 걸 빼고 저장소 밖으로 옮겼다 (커밋된 적 없음).

### 2026-09-29 — PM을 시로에서 떼어내 별도 봇으로

주인님 결정: 시로는 비서로만 두고 PM은 따로. PM 모델은 Claude Opus 5.5.
HTTP 서버(`server.ts`, `/members`·`/tasks`)를 없애고 `src/pm.ts`(디스코드 봇)가 같은 프로세스에서 팀원을 부른다.
PM이 스레드 기록을 직접 읽으니 "팀원 원문이 시로 기록에 안 남는" 한계도 없어졌다. 앞선 결과는 `include`로 번호만 넘겨 원문을 붙인다.

### 2026-09-29 — systemd 서비스 파일

`deploy/ai-team.service` 추가. `.env`는 저장소 폴더에서 읽고, 쓸 수 있는 곳은 `data/`뿐(ProtectSystem=strict).
npm 대신 `node_modules/.bin/tsx`를 직접 실행 (npm이 읽기 전용 홈에 로그를 쓰려 해서). 이 Windows PC엔 gcloud·VM 키가 없어 실행 확인은 못 함.

### 2026-09-29 — 팀 서버 만들고 시로에서 분리

처음엔 Claude Agent SDK로 독립 디스코드 봇(PM+팀원)을 만들었다가, Vertex로 여러 회사 모델을 쓰기로 하면서 방향을 바꿨다.
시로를 PM으로 쓰기로 하고 팀원을 시로 안(`team/`)에 넣었다가, 주인님 요청으로 **별도 프로젝트로 분리**했다.
시로 쪽에는 `team/client.ts` 하나와 연결 몇 줄만 남았다 (shiro `team-channel` 브랜치, 커밋 `5a582fb`).

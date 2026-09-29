# 작업 로그

컴퓨터를 옮겨가며 작업하니까, **다른 데서 이어서 시작할 때 여기부터 읽는다.**
`README.md`는 "이게 뭐고 어떻게 돌리나", 이 파일은 "어디까지 했고 다음에 뭘 하나"만 다룬다.

작업을 마치면 **[상태]와 [다음]을 고치고, [기록] 맨 위에 한 줄 남긴 다음 커밋·푸시한다.**

---

## 상태 (2026-09-29 기준)

**코드는 다 있고, 실제 디스코드·Vertex로 돌려본 적은 없다.**

목표: 디스코드 팀 채널에서 **PM 봇**이 팀원 AI들에게 일을 나눠 맡기는 AI 팀.
**시로는 PM이 아니다** — 주인님 비서로 따로 있고 이 팀과 연결되지 않는다 (2026-09-29 주인님 결정).
PM·팀원 모두 이 저장소([smandylee/aistudio](https://github.com/smandylee/aistudio)) 한 프로세스에 있다.

```
디스코드 #팀채널 ── 주인님 메시지 → PM 봇이 스레드 열기
   └─ 스레드: PM(봇 계정) ↔ 팀원들(웹후크로 각자 이름). PM은 매번 스레드 기록을 다시 읽는다.
```

### 팀 구성 (정한 것)
| 역할 | 모델 |
|---|---|
| PM | Claude Opus 5.5 (Vertex) |
| 리서처 | Gemini 3.8 Flash + 구글 검색 |
| 작가 | Claude Opus 5.5 (Vertex) |
| 리뷰어 | Gemini 3.1 Pro |
| 디자이너 | Nano Banana Pro (Gemini 3 Pro Image) |
| 개발 | 팀에 없음. 코드 작업은 주인님/시로의 기존 개발 요청으로 |

왜: PM은 일을 쪼개고 도구를 오가며 판단하는 게 핵심이라 가장 강한 모델. 리뷰어는 작가·PM과 **다른 회사 모델**이라
치우침을 잡는다. 리서처는 Vertex의 Claude가 웹 기능이 약해서 Gemini+구글 검색. 영상(Veo 3.1)은 보류.

### 확인한 것
- `tsc` 통과. `PM_BOT_TOKEN`/`TEAM_CHANNEL_ID`/`TEAM_OWNER_ID` 없으면 기동 거부, 다 있으면 디스코드 로그인 단계까지 감 (가짜 토큰이라 TokenInvalid).
- 팀원 모델 호출은 이전 HTTP 서버 시절 가짜 프로젝트로 403 실패 처리까지만 확인.

### 못 한 것
- 실제 디스코드·Vertex로 한 번도 안 돌렸다 (Mac·Windows PC 모두 GCP 인증 없음).
- PM의 스레드 읽기, 도구 호출 루프, 팀원 동시 호출은 실전 확인 필요.

---

## 다음 (순서대로)

1. **디스코드 준비** (자세한 건 README "준비")
   - 팀 채널(텍스트 채널) 만들기 → 웹후크 만들기 → URL (`TEAM_WEBHOOK_URL`).
   - 개발자 포털에서 PM 봇 만들기 → MESSAGE CONTENT INTENT 켜기 → 토큰 (`PM_BOT_TOKEN`) → 서버에 초대, 팀 채널 권한.
   - 채널 ID (`TEAM_CHANNEL_ID`), 주인님 사용자 ID (`TEAM_OWNER_ID`).
2. **Vertex 준비**: Model Garden에서 Claude Opus 5.5 사용 설정 (PM·작가). Gemini는 설정 불필요.
3. **VM에 올리기** (시로와 같은 Lightsail VM, 홍콩)
   - `git clone https://github.com/smandylee/aistudio.git` → `npm install` → `.env` 작성 (`.env.example` 참고).
   - GCP 인증은 시로와 같은 서비스 계정 키 (`GOOGLE_APPLICATION_CREDENTIALS`).
   - `deploy/ai-team.service` 맨 위 주석대로 등록 (`mkdir -p data` 먼저). 경로·사용자 `/home/ubuntu/aistudio`, `ubuntu` 가정.
4. **첫 실행 확인**
   - 로그의 모델 ID 404 여부. 모델 ID는 **문서로만 확인했다**:
     `claude-opus-5-5`, `gemini-3.8-flash`, `gemini-3.1-pro-preview`, `gemini-3-pro-image-preview`. 틀리면 `.env`만 고친다.
   - "OO 조사해서 블로그 글 하나 써줘" → 리서처→작가→리뷰어 흐름, 디자이너 이미지 첨부.
   - 같은 스레드에서 "그 글 더 줄여줘" → PM이 원문을 include로 넘기는지.
5. **shiro 정리**: shiro의 `team-channel` 브랜치(커밋 `5a582fb`)는 더 안 쓴다. 합치지 말고 지울지 주인님이 정한다.

### 알려진 한계 / 나중에
- PM은 매 메시지마다 스레드 최근 60개를 통째로 다시 읽는다. 스레드가 길어지면 PM 입력 비용이 커진다 → 프롬프트 캐싱이나 요약 검토.
- 주인님이 올린 이미지·파일은 이름만 PM에게 보인다 (내용은 못 봄).
- 비용: 토큰 수는 `data/usage.jsonl`에 쌓이지만 금액 계산은 없다. PM·작가(Claude Opus 5.5, $4/$20 per 1M)가 가장 비싸다.
- Gemini 3.8 Flash 가격은 2026-12-31까지 프로모션($0.75/$3.75), 이후 $1.5/$7.5.

---

## 기록

최신이 위.

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

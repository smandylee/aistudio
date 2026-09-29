# 작업 로그

컴퓨터를 옮겨가며 작업하니까, **다른 데서 이어서 시작할 때 여기부터 읽는다.**
`README.md`는 "이게 뭐고 어떻게 돌리나", 이 파일은 "어디까지 했고 다음에 뭘 하나"만 다룬다.

작업을 마치면 **[상태]와 [다음]을 고치고, [기록] 맨 위에 한 줄 남긴 다음 커밋·푸시한다.**

---

## 상태 (2026-09-29 기준)

**코드는 다 있고, 실제로 돌려본 적은 없다.**

목표: 디스코드 팀 채널에서 **시로가 PM**, 팀원 AI들이 일을 나눠 하는 AI 팀.
시로는 별도 저장소([smandylee/shiro](https://github.com/smandylee/shiro))이고, 이 저장소([smandylee/aistudio](https://github.com/smandylee/aistudio))는 **팀원들만** 있는 팀 서버다.

```
디스코드 #팀채널 ── 시로 (shiro 저장소, team-channel 브랜치)
                     │  HTTP  POST /tasks { member, task, threadId }
                     ▼
                  팀 서버 (이 저장소) ── Vertex AI
                     └─ 결과를 웹후크로 스레드에 팀원 이름으로 올림 → 시로에게도 돌려줌
```

### 팀 구성 (정한 것)
| 역할 | 모델 | 어디 |
|---|---|---|
| PM | 시로 (Gemini 3.7 Flash, 기존 그대로) | shiro 저장소 |
| 개발자 | 시로의 기존 `request_dev_task` → 승인 → PC의 Claude Code | shiro 저장소 |
| 리서처 | Gemini 3.8 Flash + 구글 검색 | 이 저장소 |
| 작가 | Claude Opus 5.5 (Vertex) | 이 저장소 |
| 리뷰어 | Gemini 3.1 Pro | 이 저장소 |
| 디자이너 | Nano Banana Pro (Gemini 3 Pro Image) | 이 저장소 |

왜 이렇게 골랐나: PM은 시로가 이미 주인님 기억·도구·페르소나를 갖고 있어서. 리뷰어는 작성자와 **다른 회사 모델**이어야
실수를 더 잘 잡아서. 리서처는 Vertex의 Claude가 웹 기능이 약하고(web fetch 없음) Gemini는 구글 검색이 붙어서.
영상(Veo 3.1)은 필요할 때 추가하기로 보류.

### 확인한 것
- 이 저장소: `tsc` 통과. 로컬에서 서버를 띄워 `/health`, `/members`, 인증(401), 없는 팀원·빈 과제(400),
  작업 실행→조회까지 확인. 모델 호출은 가짜 프로젝트라 403으로 실패하는 것까지 (실패 처리 경로 확인됨).
- 시로 쪽 `team/client.ts`: 위 로컬 서버를 상대로 팀원 목록 받기, 작업 맡기기, 틀린 토큰·서버 꺼짐 처리 확인.

### 못 한 것
- 실제 디스코드·Vertex로 한 번도 안 돌렸다 (작업하던 Mac에 GCP 인증 없음).
- 작업하던 Mac에서는 시로의 `better-sqlite3`가 segfault 나서 시로 전체를 로컬 실행 못 했다 (원래 코드도 동일, 이번 작업과 무관).

---

## 다음 (순서대로)

1. **디스코드 준비**
   - 서버에 팀 채널(텍스트 채널)을 만든다.
   - 시로 봇에 그 채널의 `공개 스레드 만들기`, `스레드에서 메시지 보내기` 권한.
   - 채널 설정 → 연동 → 웹후크 → 새 웹후크 → URL 복사 (팀 서버 `TEAM_WEBHOOK_URL`).
   - 개발자 모드로 채널 ID 복사 (시로 `TEAM_CHANNEL_ID`).
2. **Vertex 준비**: Model Garden에서 Claude Opus 5.5 사용 설정. Gemini는 설정 불필요.
3. **팀 서버를 VM에 올리기** (시로와 같은 Lightsail VM, 홍콩)
   - VM에서 `git clone https://github.com/smandylee/aistudio.git` → `npm install` → `.env` 작성 (`.env.example` 참고, 토큰은 `openssl rand -hex 32`).
   - GCP 인증은 시로와 같은 서비스 계정 키를 쓰면 된다 (`GOOGLE_APPLICATION_CREDENTIALS`).
   - systemd 서비스로 등록 (시로의 `shiro-orchestrator.service`를 본떠서). **아직 서비스 파일 없음 — 만들어야 함.**
4. **시로 쪽 켜기**
   - shiro `team-channel` 브랜치를 main에 합칠지 결정 → 배포 (`package.json` 안 바뀜, 시로의 "배포해" 사용 가능).
   - VM `/etc/shiro.env`에 `TEAM_CHANNEL_ID`, `TEAM_SERVER_URL=http://127.0.0.1:18791`, `TEAM_SERVER_TOKEN`.
5. **첫 실행 확인**
   - 팀 서버 로그의 모델 ID 404 여부. 모델 ID는 **문서로만 확인했다**:
     `gemini-3.8-flash`, `claude-opus-5-5`, `gemini-3.1-pro-preview`, `gemini-3-pro-image-preview`.
     틀리면 `.env`의 `TEAM_*_MODEL`만 고치면 된다.
   - 팀 채널에 "OO 조사해서 블로그 글 하나 써줘" 같은 걸로 리서처→작가→리뷰어 흐름 확인.
   - 디자이너 이미지가 스레드에 첨부되는지.

### 알려진 한계 / 나중에
- 팀원 결과 원문은 시로의 대화 기록에 안 남는다 (시로의 요약만 남음). 같은 스레드에서 "그 글 더 줄여줘"라고 하면
  시로가 원문 없이 다시 맡기게 된다. → 팀 서버가 스레드별 결과를 보관하고 시로가 다시 받아갈 수 있게 하는 방향.
- 아바타가 켜져 있으면 팀 채널의 긴 보고도 시로가 소리 내어 읽는다 (TTS 비용).
- 비용: 토큰 수는 `data/usage.jsonl`에 쌓이지만 금액 계산은 없다. 작가(Claude Opus 5.5)가 가장 비싸다 ($4/$20 per 1M).
- Gemini 3.8 Flash 가격은 2026-12-31까지 프로모션($0.75/$3.75), 이후 $1.5/$7.5.

---

## 기록

최신이 위.

### 2026-09-29 — 팀 서버 만들고 시로에서 분리

처음엔 Claude Agent SDK로 독립 디스코드 봇(PM+팀원)을 만들었다가, Vertex로 여러 회사 모델을 쓰기로 하면서 방향을 바꿨다.
시로를 PM으로 쓰기로 하고 팀원을 시로 안(`team/`)에 넣었다가, 주인님 요청으로 **별도 프로젝트로 분리**했다.
시로 쪽에는 `team/client.ts` 하나와 연결 몇 줄만 남았다 (shiro `team-channel` 브랜치, 커밋 `5a582fb`).

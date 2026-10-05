# AI 스튜디오

주인님 디스코드 서버에 넣는 봇과 AI를 모아 두는 저장소. 봇마다 폴더 하나.

| 봇 | 폴더 | 어디서 도나 | 상태 |
|---|---|---|---|
| 패치노트 | `patch-notes/` | GitHub Actions (10분마다) | 동작 — 비밀값만 넣으면 됨 |
| 콘텐츠 팀 (PM + 팀원) | `team/` | VM (systemd) | 보류 — 나중에 인스타 콘텐츠용 |

개발은 봇이 아니라 Claude Code를 직접 쓴다 (2026-10-06 결정, `WORKLOG.md`).

## 패치노트

`patch-notes/repos.json`에 적힌 저장소(지금 시로, Safehouse)에 새 커밋이 올라오면, Gemini가 커밋과 바뀐 코드를 읽고
한국어 패치노트로 정리해서 저장소마다 정해진 `#패치노트` 채널에 올린다. 감시 대상 저장소에는 아무것도 추가하지 않는다.

- 처음 보는 저장소는 그 시점을 북마크만 하고, 그 뒤 커밋부터 올린다.
- 푸시 후 보통 10~20분 안에 올라온다 (GitHub 예약 실행이 몇 분씩 늦기도 함). 바로 보고 싶으면 Actions에서 수동 실행.
- 모델이 실패하면 커밋 메시지를 그대로 올린다. 디스코드가 실패하면 다음 실행 때 다시 올린다 (빠지지 않음).
- 비용: Gemini 3.8 Flash로 푸시 한 번에 10~20원 정도.

**켜기** — GitHub 저장소 Settings → Secrets and variables → Actions → New repository secret
- `PATCH_NOTES_WEBHOOK_SHIRO`, `PATCH_NOTES_WEBHOOK_SAFEHOUSE`: 각 패치노트 채널의 웹후크 URL.
  웹후크가 `repos.json`의 `channel`과 다른 채널을 가리키면 올리지 않는다 (비밀값을 바꿔 넣는 실수 방지).
- `GCP_SA_KEY`: 서비스 계정 키 JSON 파일 내용 전체 (Vertex AI 사용자 역할)

`GCP_SA_KEY`가 없으면 워크플로는 아무것도 안 하고 성공으로 끝난다. 웹후크가 없는 저장소만 실패로 남는다.

- `PATCH_NOTES_GH_TOKEN`: 비공개 저장소(safehouse_unity)를 읽는 토큰. GitHub → Settings → Developer settings →
  Fine-grained tokens → 저장소는 감시 대상만, 권한은 **Contents: Read-only** 하나 (Metadata는 자동). 만료일이 지나면 새로 넣는다.

**저장소 추가** — `repos.json`에 한 줄 (`repo`, `name`, `branch`, `webhook`=비밀값 이름, `channel`=채널 ID),
워크플로의 `env`에 그 웹후크 비밀값 한 줄, GitHub 비밀값에 웹후크 URL.
비공개 저장소면 위 토큰의 저장소 목록에도 추가한다.

**로컬 시험** — `.env`에 GCP 값이 있으면 `DRY_RUN=1 npm run patch-notes` (디스코드에 안 올리고 출력만).

**알아 둘 것** — GitHub은 공개 저장소에 60일 동안 커밋이 없으면 예약 실행을 끈다. 꺼지면 Actions 화면에서 다시 켠다.

---

## 콘텐츠 팀 (보류)

디스코드 팀 채널에서 일하는 AI 팀. 주인님이 채널에 일을 올리면 **PM 봇**이 스레드를 열고,
팀원들에게 나눠 맡긴 뒤 결과를 모아 보고한다. 팀원은 스레드에 **각자 이름으로** 결과를 올린다.

```
디스코드 #팀채널 ── 주인님: "OO 조사해서 블로그 글 하나 써줘"
   └─ 스레드
        ├─ PM (Claude Opus 5.5, 봇 계정)   계획 → 맡기기 → 보고
        ├─ 리서처 / 작가 / 리뷰어 / 디자이너  (웹후크로 각자 이름)
        └─ 다음 메시지 때 PM이 스레드 기록을 다시 읽음 → "그 글 더 줄여줘"도 원문을 보고 처리
```

| 팀원 | 모델 | 하는 일 |
|---|---|---|
| PM | Claude Opus 5.5 | 일 나누기, 순서 정하기, 결과 판단, 보고 |
| researcher 리서처 | Gemini 3.8 Flash + 구글 검색 | 조사, 비교, 사실 확인 (출처 포함) |
| writer 작가 | Claude Opus 5.5 | 블로그·SNS·대본·문서 |
| reviewer 리뷰어 | Gemini 3.1 Pro | 다른 팀원 결과물 검토 |
| designer 디자이너 | Nano Banana Pro | 이미지 생성 (스레드에 첨부) |

팀은 아무것도 바꾸지 못한다 (조사·글·검토·그림만). 시로(비서)와는 별개다.

### 준비

1. 디스코드 개발자 포털에서 PM 봇을 만든다. Bot → **MESSAGE CONTENT INTENT** 켜기 → 토큰 복사.
   OAuth2 URL Generator에서 `bot` 범위로 서버에 초대한다. 팀 채널에 필요한 권한:
   채널 보기, 메시지 보내기, 공개 스레드 만들기, 스레드에서 메시지 보내기, 메시지 기록 보기, 반응 추가하기.
2. 팀 채널에 웹후크를 만든다 (채널 설정 → 연동 → 웹후크).
3. Vertex Model Garden에서 Claude Opus 5.5를 사용 설정한다 (PM·작가).

### 실행

```bash
npm install
cp .env.example .env   # 값 채우기
npm start
```

- `PM_BOT_TOKEN`, `TEAM_CHANNEL_ID`, `TEAM_OWNER_ID`가 없으면 켜지지 않는다. PM은 주인님 메시지에만 답한다.
- 모델별 토큰 사용량은 `data/usage.jsonl`에 쌓인다.
- VM에서 상시 실행: `deploy/ai-team.service` (설치 방법은 파일 맨 위 주석).

### 쓰는 법

- 팀 채널에 일을 올리면 그 메시지로 스레드가 열린다. 이어지는 요청은 **그 스레드 안에** 쓴다.
- PM이 일하는 중에 스레드에 쓴 메시지에는 ⏳가 붙고 따로 답하지 않는다. 끝난 뒤 다시 말하면 그 메시지도 읽는다.
- PM은 한 번에 팀원에게 최대 10건, 12단계까지만 맡긴다 (비용 상한).

### 팀원 추가·변경

`team/members.ts`의 `TEAM`에 추가하면 끝이다. PM의 도구 설명은 이 목록에서 만들어진다.

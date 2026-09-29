# AI 팀 서버

시로(PM)의 팀원들. 시로가 팀 채널에서 받은 일을 HTTP로 넘기면, 팀원이 Vertex AI 모델로 처리하고
결과를 디스코드 스레드에 **팀원 이름으로** 올린 뒤 시로에게 돌려준다.

```
디스코드 #팀채널 ── 시로 (shiro 저장소, team/client.ts)
                     │  POST /tasks { member, task, threadId }
                     ▼
                  팀 서버 (여기) ── Vertex AI ── 결과를 웹후크로 스레드에 올림
```

| 팀원 | 모델 | 하는 일 |
|---|---|---|
| researcher 리서처 | Gemini 3.8 Flash + 구글 검색 | 조사, 비교, 사실 확인 (출처 포함) |
| writer 작가 | Claude Opus 5.5 | 블로그·SNS·대본·문서 |
| reviewer 리뷰어 | Gemini 3.1 Pro | 다른 팀원 결과물 검토 |
| designer 디자이너 | Nano Banana Pro | 이미지 생성 (스레드에 첨부) |

팀원은 아무것도 바꾸지 못한다 (조사·글·검토·그림만). 코드 작업은 시로의 개발 요청(승인 필요)으로 한다.

## 실행

```bash
npm install
cp .env.example .env   # 값 채우기
npm start
```

- 디스코드 봇 계정이 필요 없다. 팀 채널의 **웹후크 URL** 하나면 된다.
- Vertex Model Garden에서 Claude Opus 5.5를 사용 설정해야 작가가 동작한다.
- `TEAM_SERVER_TOKEN`이 없으면 켜지지 않는다. 시로의 `/etc/shiro.env`에도 같은 값을 넣는다.
- 모델별 토큰 사용량은 `data/usage.jsonl`에 쌓인다.

## API

모두 `Authorization: Bearer <TEAM_SERVER_TOKEN>` 필요 (`/health` 제외).

| | |
|---|---|
| `GET /members` | 팀원 목록 `[{ id, name, role }]` — 시로는 이걸로 도구 설명을 만든다 |
| `POST /tasks` | `{ member, task, threadId? }` → `202 { id, status: "running" }` |
| `GET /tasks/:id?wait=50` | 끝날 때까지 최대 `wait`초 기다렸다가 `{ status, text, images, error }` |

작업은 백그라운드에서 돌고, 끝난 작업은 1시간 동안 조회할 수 있다.

## 팀원 추가·변경

`src/members.ts`의 `TEAM`에 추가하면 끝이다. 시로는 `/members`에서 목록을 받아오므로 시로 쪽은 고칠 게 없다.

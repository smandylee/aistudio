# CLAUDE.md

AI 팀 서버 — 디스코드 팀 채널에서 PM인 시로([smandylee/shiro](https://github.com/smandylee/shiro))가
HTTP로 일을 맡기는 팀원들(Vertex AI 모델). 자세한 구조와 API는 `README.md`.

## 세션 규칙

**시작할 때 `WORKLOG.md`를 읽는다.** 여러 컴퓨터를 옮겨가며 작업하므로, 뭐가 끝났고 뭐가 남았는지는 거기에만 있다.

**작업을 마치면 `WORKLOG.md`를 갱신하고** 커밋·푸시한다.

사용자와는 한국어로 대화한다.

## 구조

```
src/server.ts    HTTP API (/members, /tasks, /tasks/:id). 토큰 없으면 기동 거부
src/members.ts   팀원 정의와 모델 호출. 팀원 추가·변경은 여기만
src/post.ts      웹후크로 스레드에 팀원 이름으로 올리기
src/usage.ts     토큰 사용량 → data/usage.jsonl
```

## 명령

```bash
npm start        # tsx src/server.ts
npm run check    # tsc --noEmit
```

## 지킬 것

- **fail-closed**: `TEAM_SERVER_TOKEN`이 없으면 켜지지 않는다. 편의를 위해 완화하지 않는다.
- **팀원은 아무것도 바꾸지 못한다** (조사·글·검토·그림만). 파일·명령·배포 같은 권한은 주지 않는다.
  코드 작업은 시로의 `request_dev_task`(주인님 승인)로만.
- 시로와의 계약은 `/members`, `/tasks` 응답 모양이다. 바꾸면 shiro의 `orchestrator/src/team/client.ts`도 같이 고친다.
- 비밀값(`.env`)은 저장소에 없다. `.env.example`만 커밋한다.

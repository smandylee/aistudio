# CLAUDE.md

AI 팀 — 디스코드 팀 채널에서 PM 봇(Claude Opus 5.5)이 팀원들(Vertex AI 모델)에게 일을 나눠 맡긴다.
시로([smandylee/shiro](https://github.com/smandylee/shiro))는 주인님 비서로 따로 있고 이 팀과 연결되지 않는다.
자세한 구조는 `README.md`.

## 세션 규칙

**시작할 때 `WORKLOG.md`를 읽는다.** 여러 컴퓨터를 옮겨가며 작업하므로, 뭐가 끝났고 뭐가 남았는지는 거기에만 있다.

**작업을 마치면 `WORKLOG.md`를 갱신하고** 커밋·푸시한다.

사용자와는 한국어로 대화한다.

## 구조

```
src/pm.ts        PM 봇 (진입점). 팀 채널 메시지 → 스레드 → 팀원에게 delegate → 보고
src/members.ts   팀원 정의와 모델 호출. 팀원 추가·변경은 여기만
src/post.ts      웹후크로 스레드에 팀원 이름으로 올리기
src/usage.ts     토큰 사용량 → data/usage.jsonl
deploy/          VM용 systemd 서비스
```

## 명령

```bash
npm start        # tsx src/pm.ts
npm run check    # tsc --noEmit
```

## 지킬 것

- **fail-closed**: `PM_BOT_TOKEN`, `TEAM_CHANNEL_ID`, `TEAM_OWNER_ID`가 없으면 켜지지 않는다. PM은 주인님 메시지에만 답한다
  (다른 사람 메시지로 Vertex 비용이 나가면 안 된다). 편의를 위해 완화하지 않는다.
- **팀은 아무것도 바꾸지 못한다** (조사·글·검토·그림만). PM에게도 팀원에게도 파일·명령·배포 같은 권한은 주지 않는다.
- PM의 비용 상한(`MAX_STEPS`, `MAX_DELEGATIONS`)을 없애지 않는다.
- 비밀값(`.env`)은 저장소에 없다. `.env.example`만 커밋한다.

# CLAUDE.md

AI 스튜디오 — 주인님 디스코드 서버에 넣는 봇·AI를 모아 두는 저장소. 봇마다 폴더 하나.
시로([smandylee/shiro](https://github.com/smandylee/shiro))는 주인님 비서로 따로 있다. 개발은 봇이 아니라 Claude Code를 직접 쓴다.
자세한 건 `README.md`.

## 세션 규칙

**시작할 때 `WORKLOG.md`를 읽는다.** 여러 컴퓨터를 옮겨가며 작업하므로, 뭐가 끝났고 뭐가 남았는지는 거기에만 있다.

**작업을 마치면 `WORKLOG.md`를 갱신하고** 커밋·푸시한다.

사용자와는 한국어로 대화한다.

## 구조

```
patch-notes/run.ts      패치노트 봇. 감시 저장소의 새 커밋 → Gemini 요약 → 웹후크
patch-notes/repos.json  감시할 저장소 목록
.github/workflows/      patch-notes.yml: 10분마다 GitHub Actions에서 실행
team/pm.ts              콘텐츠 팀 PM 봇 (보류). 팀 채널 → 스레드 → 팀원 delegate
team/members.ts         콘텐츠 팀원 정의와 모델 호출
team/post.ts            웹후크로 스레드에 팀원 이름으로 올리기
team/usage.ts           토큰 사용량 → data/usage.jsonl
deploy/                 VM용 systemd 서비스 (콘텐츠 팀)
```

## 명령

```bash
npm run check                    # tsc --noEmit
DRY_RUN=1 npm run patch-notes    # 패치노트를 디스코드에 안 올리고 출력만
npm start                        # 콘텐츠 팀 (tsx team/pm.ts)
```

## 지킬 것

- 새 봇은 폴더 하나로 추가하고, README의 봇 표에 한 줄 넣는다.
- **봇은 남의 저장소나 서버를 바꾸지 않는다.** 패치노트는 GitHub을 읽기만 한다 (`permissions: contents: read`).
- **fail-closed** (콘텐츠 팀): `PM_BOT_TOKEN`, `TEAM_CHANNEL_ID`, `TEAM_OWNER_ID`가 없으면 켜지지 않는다. PM은 주인님 메시지에만 답한다
  (다른 사람 메시지로 Vertex 비용이 나가면 안 된다). 편의를 위해 완화하지 않는다.
- **팀은 아무것도 바꾸지 못한다** (조사·글·검토·그림만). PM에게도 팀원에게도 파일·명령·배포 같은 권한은 주지 않는다.
- PM의 비용 상한(`MAX_STEPS`, `MAX_DELEGATIONS`)을 없애지 않는다.
- 비밀값(`.env`)은 저장소에 없다. `.env.example`만 커밋한다.

---
title: "[서버] FastAPI와 코루틴"
description: FastAPI의 비동기 처리에 대해 자세히 알아보기
date: 2026-10-14
category: 백엔드
tags:
  - 백엔드
  - Python
  - 서버
  - FastAPI
draft: false
slug: fast-api-2
---
## 코루틴이란 ?

**코루틴** : 중간에 멈췄다가 다시 이어서 실행할 수 있는 함수

일반 함수는 시작하면 끝날 때까지 쭉 실행되지만, 코루틴은 `await`를 만나면 기다리는 동안 다른 작업을 할 수 있도록 제어권을 넘긴다.

```python

import asyncio

async def 요리하기():          # async def = 코루틴 함수
    print("주문 접수")
    await asyncio.sleep(3)     # 3초 대기 (이 동안 다른 일 가능)
    print("요리 완료")

```

## Fast API 에서의 사용

```python
from fastapi import FastAPI
import asyncio

app = FastAPI()

@app.get("/async")
async def async_endpoint():
    await asyncio.sleep(3)      # DB 조회, 외부 API 호출 등을 흉내
    return {"message": "done"}

@app.get("/sync")
def sync_endpoint():
    import time
    time.sleep(3)
    return {"message": "done"}

```

- `async def` : 이벤트 루프 위에서 실행됨. `await` 에서 대기하는 동안 다른 요청을 처리
- `def` : FastAPI가 자동으로 별도 스레드풀에서 실행. 고로 서버가 막히지 않는다

## 이벤트 루프

![[Pasted image 20261014111000.png]]

1. Task가 **준비 큐**에서 차례를 기다림
2. **이벤트 루프**가 순차적으로 꺼내서 `await`를 만날때 까지 실행
3. `await`를 만나면 **대기**상태가 됨, 루프는 기다리지 않고 다음 Task를 꺼낸다
4. DB 또는 네트워크 응답이 오면 다시 준비 큐로 돌아가서 `await` 다음 줄부터 이어서 실행

- 스레드가 여러개라도 **이벤트 루프는 스레드 하나당 하나**, 여러 스레드를 쓰는 것은 이벤트 루프 밖에서 일꾼을 더 두는 것과 같음
- 즉, 루프는 스레드 1개라서, `await`가 없이 오래 걸리는 코드 (`time.sleep`, `request.get`, 무거운 계산) 가 실행되면 그동안 다른 Task가 전부 멈춘다

## 문법

```python
import asyncio

async def 인사(이름):            # ① async def: 코루틴 함수 정의
    await asyncio.sleep(1)       # ② await: 결과를 기다리며 양보
    return f"안녕 {이름}"

async def main():
    결과 = await 인사("영진")     # 코루틴은 반드시 await로 호출
    print(결과)

asyncio.run(main())              # ③ 진입점: 이벤트 루프 생성 → 실행 → 종료
```

`async def` : 호출시 코루틴 객체 생성
`await` : `async def` 안에서만 사용 가능
`asyncio.run()` : 프로그램 전체에서 한 번만 호출하는 진입점

### gether

```python
async def 가져오기(n):
    await asyncio.sleep(n)
    return n * 10

async def main():
    결과 = await asyncio.gather(가져오기(1), 가져오기(2), 가져오기(3))
    print(결과)   # [10, 20, 30]  ← 넘긴 순서대로 결과가 나옴, 총 약 3초
```

완료와 상관없이 넘긴 순서대로 리턴

### create_task

```python
async def main():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(가져오기(1))
        t2 = tg.create_task(가져오기(2))
    # with 블록을 나오면 모든 태스크가 끝난 상태
    print(t1.result(), t2.result())
```

task 생성 후 원할 때 작업하기

```python
async def main():
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(가져오기(1))
        t2 = tg.create_task(가져오기(2))
    # with 블록을 나오면 모든 태스크가 끝난 상태
    print(t1.result(), t2.result())
```

`TaskGroup` 
- 하나가 예외로 실패하면 나머지 Task를 자동으로 취소하고 예외를 올려줌
- Python 3.11+ 기준으로 가장 안전한 방식이다

### 이외의 도구

```python
async def main():
    lock = asyncio.Lock()
    sem = asyncio.Semaphore(3)      # 동시에 최대 3개
    event = asyncio.Event()         # 신호 주고받기

    async def 작업자(i):
        async with sem:             # 동시 실행 개수 제한
            async with lock:        # 임계 구역 (한 번에 하나)
                print(f"{i} 공유 자원 사용")
                await asyncio.sleep(0.1)
        await event.wait()          # 신호 올 때까지 대기
        print(f"{i} 출발")

    tasks = [asyncio.create_task(작업자(i)) for i in range(5)]
    await asyncio.sleep(1)
    event.set()                     # 대기 중인 모두를 깨움
    await asyncio.gather(*tasks)
```
``
`Lock` : 한 번에 한 Task만 들어가는 구역
`Semaphore(n)` : 동시에 N개까지 허용
`Event` : 신호를 주고받음
`Queue` : 생성 - 사용자 간 데이터 전달
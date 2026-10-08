---
title: "[서버] FastAPI 아키텍처 분석"
description: FastAPI로 빠르게 Python 서버를 구축해보자
date: 2026-10-07
category: 백엔드
tags:
  - 백엔드
  - Python
  - 서버
  - FastAPI
draft: false
slug: fast-api-1
publishedAt:
---
## 개요

본래 필자는 `Nestjs`를 주로 사용해왔는데 좀 더 가볍게 시작하고 싶은 마음도 있고 파이썬 공부도 하고 싶어서 `FastAPI`로 프로젝트를 진행해보기로 마음 먹었다.

github에서 star 수가 꽤나 많은 아키텍처 가이드 레포를 발견했다. 
https://github.com/zhanymkanov/fastapi-best-practices 

해당 레포는 **대규모 FastAPI 서비스 설계 원칙**인 것 같은데 폴더 구조와 나머지 쓸만한 것들을 가져와서 기록해보겠다.
## 일반적인 폴더 구조

```
src/
├── routers/
├── models/
├── schemas/
├── services/
└── crud/
```

## 레퍼런스 프로젝트의 구조

```
src/
├── auth/
│   ├── router.py
│   ├── schemas.py
│   ├── models.py
│   ├── dependencies.py
│   ├── service.py
│   ├── exceptions.py
│   └── ...
│
├── posts/
│   ├── router.py
│   ├── schemas.py
│   ├── models.py
│   ├── dependencies.py
│   ├── service.py
│   └── ...
│
├── aws/
│   ├── client.py
│   ├── schemas.py
│   ├── config.py
│   └── ...
│
├── database.py
├── config.py
└── main.py
```

위와 같은 구조 처럼 비즈니스 도메인을 최상위 경계로 잡는다.
유지보수성을 고려하여 도메인 별로 폴더를 분리하는 것 같다.

## 각 레이어의 역할 

```
orders/
├── router.py
├── schemas.py
├── models.py
├── service.py
├── dependencies.py
├── constants.py
├── exceptions.py
└── utils.py
```

`router.py` : 여타 다른 라우터와 같이 request 진입점
`schemas.py` : API 입력/출력 형식
`models.py` : DB 모델 정의
`service.py` 
- 예제 코드
```python
async def create_order(
    user: User,
    data: CreateOrderRequest,
):
    product = await get_product(data.product_id)

    if product.stock < data.quantity:
        raise OutOfStock()

    product.stock -= data.quantity

    order = Order(
        user_id=user.id,
        product_id=product.id,
        quantity=data.quantity,
    )

    db.add(order)

    return order
```
- 즉 Router -> Service -> Model / DB 의 구조를 가짐

## Async? 

- `blocking I/O` 과 `async I/O` 를 구분하라고 명시 되어 있음
- FastAPI의 `async` route에서는 non-blocking I/O 를 수행해야 하며, blocking 작업을 넣으면 event loop가 막힐 수 있다고 명시함. 반면 일반 `def` route는 threadpool 에서 실행됨

### 예제

```python
@app.get("/")
async def test():
    time.sleep(5)
```

이건 위험하다고 한다.

```
Event Loop
   │
   ├── request A
   │       ↓
   │    time.sleep(5)
   │
   ├── request B  ← 막힘
   ├── request C  ← 막힘
   └── request D  ← 막힘
```

A 에서 이벤트 루프가 막히는 구조이다

반면

```python
@app.get("/")
async def test():
    await asyncio.sleep(5)
```

```
Event Loop
   │
   ├── request A
   │       ↓
   │    await
   │
   ├── request B
   ├── request C
   └── request D
```

가 가능하다고 한다

말이 어려운데 그냥 `async` 함수일 시에 await 처리 하라는 소리인 것 같다.



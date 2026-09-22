---
title: "[프론트엔드 성능 최적화 하기] (1) 낙관적 업데이트란?"
description:
date: 2026-09-22
category: 프론트엔드
tags:
  - 프론트엔드
  - 리액트
  - 성능최적화
draft: false
---
## 낙관적 업데이트?

전통적으로 프론트엔드 <-> 백엔드 통신간 흐름은 간단하게 아래와 같았다.
1. 사용자가 서버로 요청을 보낸다.
2. 서버의 응답 결과를 기다린다.
3. 성공했을 경우 상태를 업데이트 한다.

낙관적 업데이트에서는 아래와 같은 흐름으로 상태 업데이트가 된다.
1. 사용자가 상호작용(좋아요 버튼 클릭 등)을 한다.
2. 클라이언트에서는 요청 성공을 전제로 UI를 미리 업데이트 한다.
3. 서버의 응답 결과가 성공이라면 그대로 두고, 실패하면 상태를 다시 롤백 한다.

## 장점과 단점

### 장점

- 네트워크 지연이나 서버의 응답을 기다리지 않고 상태를 즉각 업데이트함으로써 사용자의 시각에서는 속도가 빠르다고 인지할 가능성이 높음
### 단점

- 만약 UI 업데이트 뒤에 서버 응답이 실패하여 상태를 롤백하게 될 경우 사용자 입장에서 버그라고 인지할 수도 있음

## 주요 사례

- 좋아요/북마크 버튼
- 실시간 채팅(디스코드 등) 메세지 전송
- 댓글 작성 및 삭제
- 할 일 체크박스 완료 처리

## React useOptimistic 훅

공식 문서 : https://ko.react.dev/reference/react/useOptimistic

```
function LikeButton({ postId, initialLikes, initialLiked }) {
  const [likes, setLikes] = useState({ count: initialLikes, liked: initialLiked });

  const [optimisticLikes, toggleOptimisticLike] = useOptimistic(
    likes,
    (current, _) => ({
      count: current.liked ? current.count - 1 : current.count + 1,
      liked: !current.liked,
    })
  );

  function handleClick() {
    startTransition(async () => {
      toggleOptimisticLike(null);
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      const data = await res.json();
      setLikes({ count: data.count, liked: data.liked });
    });
  }

  return (
    <button onClick={handleClick}>
      {optimisticLikes.liked ? '♥' : '♡'} {optimisticLikes.count}
    </button>
  );
}
```


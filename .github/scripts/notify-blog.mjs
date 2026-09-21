const sha = process.env.CONTENT_SHA;
const repository = process.env.BLOG_REPOSITORY;
const token = process.env.BLOG_DISPATCH_TOKEN;
if (!/^[0-9a-f]{40}$/.test(sha ?? '')) throw new Error('CONTENT_SHA 형식이 잘못되었습니다');
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '')) throw new Error('BLOG_REPOSITORY 변수는 owner/name이어야 합니다');
if (!token) throw new Error('BLOG_DISPATCH_TOKEN secret이 필요합니다');

const response = await fetch(`https://api.github.com/repos/${repository}/dispatches`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
  body: JSON.stringify({ event_type: 'content-updated', client_payload: { sha } }),
});
if (!response.ok) throw new Error(`블로그 갱신 알림 실패: HTTP ${response.status}`);
console.log(`블로그 갱신 알림 요청: ${sha}`);

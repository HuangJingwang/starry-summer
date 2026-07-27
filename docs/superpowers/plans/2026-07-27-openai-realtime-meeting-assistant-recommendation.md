# OpenAI Realtime Meeting Assistant Recommendation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the OpenAI Realtime Meeting Assistant to the public recommended shares page with the OpenAI GitHub avatar and a two-star recommendation.

**Architecture:** Extend the existing static `recommendedShares` array without changing the card component or rating helper. Store the OpenAI organization avatar under the existing public recommendation image directory, then protect the card content and its position with the route's existing Vitest regression suite.

**Tech Stack:** TypeScript, React/Next.js static public assets, Vitest

## Global Constraints

- Use the public name `OpenAI Realtime Meeting Assistant`.
- Link to `https://github.com/openai/openai-realtime-meeting-assistant`.
- Use a locally stored copy of the OpenAI GitHub avatar.
- Use tags `开源项目`, `AI Coding`, and `AI 学习`.
- Set `stars` to `2`.
- Do not add `githubStars`, an artificial-rating marker, or any new rating field.
- Place the card after `Conductor` and before `21st.dev`.
- Do not change the card component, layout, filters, or `getRecommendedShareStars`.

---

### Task 1: Add and verify the recommendation card

**Files:**
- Create: `apps/web/public/images/recommended-shares/openai-avatar.jpg`
- Modify: `apps/web/src/app/moments/moments-page.test.ts`
- Modify: `apps/web/src/lib/recommended-shares.ts`

**Interfaces:**
- Consumes: the existing `RecommendedShare` interface and `recommendedShares: RecommendedShare[]` array.
- Produces: one new `RecommendedShare` entry rendered automatically by `RecommendedShareGrid`.

- [ ] **Step 1: Write the failing regression test**

Update the expected name and avatar arrays so `OpenAI Realtime Meeting Assistant` appears after `Conductor` and before `21st.dev`, then add this assertion:

```ts
expect(recommendedShares.find((resource) => resource.name === 'OpenAI Realtime Meeting Assistant')).toMatchObject({
  url: 'https://github.com/openai/openai-realtime-meeting-assistant',
  logo: 'OA',
  avatarSrc: '/images/recommended-shares/openai-avatar.jpg',
  avatarAlt: 'OpenAI GitHub 项目图标',
  description:
    'OpenAI 官方 Realtime API 会议助手示例，通过多人 WebRTC 会议中的自然语音实时创建、移动和更新看板任务，适合学习实时语音与函数调用集成。',
  tags: ['开源项目', 'AI Coding', 'AI 学习'],
  stars: 2,
});
expect(recommendedShares.find((resource) => resource.name === 'OpenAI Realtime Meeting Assistant')).not.toHaveProperty(
  'githubStars',
);
```

Also add:

```ts
expect(data).toContain("name: 'OpenAI Realtime Meeting Assistant'");
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm run test --workspace @starry-summer/web -- src/app/moments/moments-page.test.ts
```

Expected: FAIL because the recommendation and its avatar do not exist yet.

- [ ] **Step 3: Download and validate the local OpenAI avatar**

Download `https://github.com/openai.png?size=512` to `apps/web/public/images/recommended-shares/openai-avatar.jpg`, then run:

```bash
file apps/web/public/images/recommended-shares/openai-avatar.jpg
```

Expected: a valid square JPEG image.

- [ ] **Step 4: Add the minimal recommendation data**

Add this entry after `Conductor` in `apps/web/src/lib/recommended-shares.ts`:

```ts
{
  name: 'OpenAI Realtime Meeting Assistant',
  url: 'https://github.com/openai/openai-realtime-meeting-assistant',
  logo: 'OA',
  avatarSrc: '/images/recommended-shares/openai-avatar.jpg',
  avatarAlt: 'OpenAI GitHub 项目图标',
  description:
    'OpenAI 官方 Realtime API 会议助手示例，通过多人 WebRTC 会议中的自然语音实时创建、移动和更新看板任务，适合学习实时语音与函数调用集成。',
  tags: ['开源项目', 'AI Coding', 'AI 学习'],
  stars: 2,
},
```

- [ ] **Step 5: Run focused and repository verification**

Run:

```bash
npm run test --workspace @starry-summer/web -- src/app/moments/moments-page.test.ts
npm run typecheck
npm run build
git diff --check
```

Expected: all commands pass.

- [ ] **Step 6: Commit and push**

```bash
git add apps/web/src/lib/recommended-shares.ts \
  apps/web/src/app/moments/moments-page.test.ts \
  apps/web/public/images/recommended-shares/openai-avatar.jpg
git commit -m "Add OpenAI meeting assistant recommendation"
git push origin main
```

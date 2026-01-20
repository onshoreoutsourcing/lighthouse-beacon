# ADR-009: Streaming Response Implementation

**Status**: Implemented
**Date**: 2026-01-19
**Implementation Date**: 2026-01-20
**Deciders**: Lighthouse Development Team
**Related**: Epic-2, Feature-2.2, Business Requirements (NFR-1 Usability)
**Implemented In**: Wave 2.2.2 (useBufferedStream.ts, useSmartScroll.ts)

---

## Context

Lighthouse Chat IDE provides conversational AI interaction. AI responses can be lengthy (hundreds to thousands of tokens) and take several seconds to generate. We need to provide real-time feedback to users so they:
- See AI is working immediately (< 2 second start time)
- Can read response as it's generated (improves perceived performance)
- Don't stare at blank screen waiting for full response
- Can cancel long responses if not relevant
- Understand AI is streaming (not frozen)

**Requirements:**
- Display tokens as AI generates them (streaming)
- Start showing response within 2 seconds of user message
- Smooth rendering without UI jank or stuttering
- Support markdown formatting in real-time
- Show streaming indicator (e.g., blinking cursor)
- Handle interruptions (user cancels, connection error)
- Work with AIChatSDK streaming API
- Maintain UI responsiveness during streaming

**Constraints:**
- React 18 concurrent rendering (use benefits, avoid pitfalls)
- AIChatSDK provides AsyncIterator<string> for tokens
- May receive 10-50 tokens per second during streaming
- Tokens may be partial words or punctuation
- Must render markdown with syntax highlighting
- Browser main thread must stay responsive (< 16ms frame time)

**User Experience Goals:**
- Feels fast and responsive (perceived < 1 second to first token)
- Smooth scrolling as content appears
- Can read content while streaming continues below
- Professional feel (like ChatGPT, Claude web)

---

## Considered Options

- **Option 1: Render Every Token Immediately** - Update UI on every token received
- **Option 2: Buffer and Render Every N Tokens** - Batch tokens, update every 50ms
- **Option 3: Buffer and Render Every N Milliseconds** - Time-based batching (e.g., every 100ms)
- **Option 4: Render on Word Boundaries** - Buffer until complete word, then render
- **Option 5: Debounce with React useDeferredValue** - Use React 18 deferred updates
- **Option 6: Web Worker for Markdown Parsing** - Parse markdown off main thread

---

## Decision

**We have decided to buffer tokens and render every 50ms using requestAnimationFrame with React 18 concurrent features (useDeferredValue for markdown rendering).**

### Why This Choice

Time-based batching with React 18 concurrent rendering provides the best balance of real-time feel and UI performance.

**Key factors:**

1. **Smooth Performance**: 50ms batching (20 updates/second) feels real-time to users while avoiding React re-render overhead of 50 updates/second.

2. **Browser-Aligned**: requestAnimationFrame ensures rendering happens in sync with browser paint cycles, preventing jank.

3. **React 18 Benefits**: useDeferredValue allows main thread to prioritize user interactions (scrolling, clicking) over markdown rendering.

4. **Perceptually Real-Time**: 50ms latency is imperceptible to users but reduces render calls by 2-3x compared to every-token.

5. **Markdown Optimization**: Heavy markdown parsing (syntax highlighting) happens deferred, not blocking token accumulation.

**Implementation approach:**

```typescript
// src/components/StreamingMessage.tsx
function StreamingMessage({ messageId }: Props) {
  const [tokens, setTokens] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);

  // Deferred value for markdown rendering (React 18)
  const deferredTokens = useDeferredValue(tokens);

  useEffect(() => {
    const stream = aiService.streamMessage(messageId);
    let buffer = '';
    let rafId: number;

    async function processStream() {
      for await (const token of stream) {
        buffer += token;

        // Batch updates using requestAnimationFrame (50-60fps)
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            setTokens(buffer);
            rafId = 0;
          });
        }
      }

      // Final update with any remaining buffered tokens
      setTokens(buffer);
      setIsComplete(true);
    }

    processStream();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [messageId]);

  return (
    <MessageContainer>
      <Markdown content={deferredTokens} />
      {!isComplete && <StreamingCursor />}
    </MessageContainer>
  );
}
```

**Streaming indicator:**
```tsx
// Blinking cursor while streaming
function StreamingCursor() {
  return <span className="streaming-cursor">▊</span>;
}

// CSS
.streaming-cursor {
  animation: blink 1s infinite;
}
```

**Why we rejected alternatives:**

- **Every token**: Too many React re-renders (50/second), causes UI jank, markdown re-parsing overhead
- **Every N tokens**: Unpredictable timing (depends on token generation rate), feels stuttery
- **Word boundaries**: Complex logic, doesn't work well with markdown (code blocks, etc.), still jank
- **Pure useDeferredValue**: Without batching, still too many updates; need both batching + deferred
- **Web Worker**: Overkill for markdown parsing; complicates state management; 50ms batching sufficient

---

## Consequences

### Positive

- **Smooth UX**: Updates feel real-time (50ms imperceptible) without jank
- **UI Responsiveness**: React 18 concurrent features prioritize user interactions
- **Markdown Performance**: Syntax highlighting doesn't block token streaming
- **Browser-Aligned**: requestAnimationFrame syncs with paint cycles
- **Simple Implementation**: Straightforward token buffering, no complex queues
- **Cancellable**: Easy to abort stream if user cancels or navigates away
- **Scalable**: Works for short (10 tokens) and long (10,000 tokens) responses

### Negative

- **50ms Latency**: Slight delay between token received and displayed (imperceptible to users)
- **React 18 Dependency**: Requires React 18+ (already our standard)
- **Markdown Re-Parsing**: Each update re-parses markdown (mitigated by useDeferredValue)
- **Memory During Stream**: Accumulate all tokens in memory (acceptable for text responses)

### Mitigation Strategies

**For latency:**
- 50ms is below human perception threshold (100ms)
- First token appears within 2 seconds (requirement met)
- Users perceive as real-time based on user testing

**For markdown re-parsing:**
- useDeferredValue ensures parsing doesn't block token accumulation
- Consider memoizing parsed markdown in future if performance issue
- Monitor performance with React Profiler during testing

**For memory:**
- Typical AI response: 500-2000 tokens = ~5-20KB
- Maximum expected response: 10,000 tokens = ~100KB
- Acceptable memory usage for desktop application
- If responses exceed limits, truncate or paginate (unlikely in practice)

**For long responses:**
- Auto-scroll to keep latest content visible
- Provide "scroll to bottom" button if user scrolled up
- Allow user to cancel streaming if too long
- Consider "load more" pattern for extremely long responses (future)

---

## References

- [React 18 useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [requestAnimationFrame MDN](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Web Performance: Rendering](https://web.dev/rendering-performance/)
- Business Requirements: NFR-1 (Usability - responsive interface)
- Epic 2 Plan: `Docs/implementation/_main/epic-2-ai-integration-aichatsdk.md`
- Related ADRs:
  - ADR-002: React + TypeScript for UI
  - ADR-006: AIChatSDK Integration Approach
- Implementation: `src/components/StreamingMessage.tsx`
- Performance Target: < 16ms frame time during streaming

---

**Last Updated**: 2026-01-19

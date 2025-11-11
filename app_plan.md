```markdown
# Multiplayer Game Implementation Plan

## Current Status: ✅ Step 2 Complete
- ✅ Name input modal
- ✅ WebSocket connection
- ✅ Players can join/leave
- ✅ Blue cubes spawn for other players
- ✅ Real-time position syncing
- ✅ Movement updates throttled at 20 Hz
- ✅ Other players' cubes move when they move

---

## Step 3: Add Name Tags Above Cubes ⬅️ **NEXT**

### Goal
Display player names floating above each cube.

### Implementation
1. Use Three.js `CSS2DRenderer` or `TextGeometry`
2. Create text label for each player
3. Position above cube and make it face camera
4. Show name + score (score will be 0 for now)

### Technical Challenges
- Text rendering performance
- Keeping text facing camera
- Handling overlapping names

---

## Step 4: Implement Collision Detection & Push Physics

### Goal
Cubes can bump into each other and push each other around.

### Implementation
1. Server calculates cube-to-cube collisions (distance check)
2. Apply push force based on:
   - Relative velocities
   - Dash state (dashing = stronger push)
3. Server broadcasts updated positions after collision
4. Track "last collision" for kill attribution

### New Data Structure
```typescript
interface Player {
  // ... existing fields
  lastCollidedWith?: string;  // player ID
  lastCollisionTime?: number; // timestamp
}
```

### Technical Challenges
- Collision detection at 60 ticks/sec on server
- Fair physics (no client advantage)
- Detecting "push direction"

---

## Step 5: Track Kills and Scoring

### Goal
Award points for pushing players off the edge.

### Implementation
1. Server detects when player goes out of bounds and dies
2. Check if they were hit recently (within 2-3 seconds)
3. If yes: pusher gets +1 point, victim gets -1 point
4. Broadcast score updates
5. Respawn dead player at center

### New Events
```typescript
// Server → Client
'player:died': {
  playerId: string;
  killerId?: string;
  respawnPosition: { x: number; y: number; z: number };
}

'score:update': {
  playerId: string;
  newScore: number;
}
```

### Technical Challenges
- Timing: How long to attribute a kill?
- Edge cases: Multiple simultaneous collisions
- Respawn invincibility?

---

## Step 6: Polish & UI

### Goal
Make it feel like a complete game.

### Features to Add
1. **Scoreboard UI** - Show all players and scores
2. **Kill feed** - "Player1 pushed Player2 off!"
3. **Respawn countdown** - 3... 2... 1... timer
4. **Visual effects**:
   - Dash trail
   - Collision impact particles
   - Death animation
5. **Sound effects** (optional):
   - Jump sound
   - Dash sound
   - Collision sound
   - Death/respawn sound
6. **Better camera options**:
   - Top-down arena view
   - Free camera toggle
   - Spectator mode when dead

### UI Mockup
```
┌─────────────────────────────────────┐
│ SCOREBOARD                          │
│ 1. Player1 ⭐ 5                     │
│ 2. Player2 ⭐ 3                     │
│ 3. You ⭐ 2                         │
└─────────────────────────────────────┘

         [Player Name]
            ▼
          [Cube]

┌─────────────────────────────────────┐
│ 💀 Player1 pushed Player2 off!     │
└─────────────────────────────────────┘
```

---

## Completed Steps Summary

### ✅ Step 1: Basic Multiplayer Connection
- Created name input modal
- Established WebSocket connection between client and server
- Implemented player join/leave events
- Blue cubes spawn for other players

### ✅ Step 2: Real-time Position Syncing
- Added `player:move` and `player:update` events
- Client sends position updates throttled at 20 Hz
- Server broadcasts position updates to all other clients
- Other players' cubes move in real-time
- Position and rotation syncing working

---

## Ready?
Let's start with **Step 3: Add Name Tags Above Cubes**! 🎮
```

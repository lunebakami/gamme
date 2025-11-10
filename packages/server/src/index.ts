import { Elysia } from 'elysia';
import { websocket } from '@elysiajs/websocket';
import { GAME_CONFIG } from '@gamme/shared';

const app = new Elysia()
  .use(websocket())
  .get('/', () => 'Game Server Running')
  .listen(3000);

console.log(`🎮 Server running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`Game config:`, GAME_CONFIG);

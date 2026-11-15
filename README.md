# No anime — public streaming website

This is a deployable Node.js starter. Visitors can browse and stream published videos. The owner uploads/deletes videos through the Admin Studio.

## Run locally
1. Install Node.js 18 or newer.
2. In this folder run: `npm install`
3. Set an admin password in your environment:
   - macOS/Linux: `export ADMIN_PASSWORD='your-long-secret-password'`
   - Windows PowerShell: `$env:ADMIN_PASSWORD='your-long-secret-password'`
4. Run `npm start` and open `http://localhost:3000`.

## Deploy publicly
Deploy this folder to a Node.js host that supports persistent disk storage (for example, a VPS or a platform with a persistent volume).
- Build/install command: `npm install`
- Start command: `npm start`
- Environment variable: `ADMIN_PASSWORD` = a long, unique password
- Attach persistent storage and keep `uploads/` and `data/` on that persistent volume.
- Use HTTPS and set upload limits appropriate to your host.

## Important
This is a starter, not a hosted website. I cannot publish it to a public URL without access to a hosting account/domain. Large video streaming at scale should use object storage plus a CDN and transcoding/HLS. The included upload route accepts MP4, WebM, OGG, MOV up to 2 GB; your hosting provider may impose a lower request limit. For production, add rate limiting, malware scanning, backups, and stronger session management. Only upload and distribute videos for which you have the necessary rights.

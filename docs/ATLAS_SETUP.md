# ANUSMITA: Dedicated MongoDB Atlas onboarding

Verified resources (24 October 2026):
- Atlas project: ANUSMITA Commerce
- Project ID: 6adbd7314546fc93e552da47
- Free cluster: ANUSMITA, AP_SOUTH_1 (Mumbai)
- Host: anusmita.jvvjo1k.mongodb.net
- Scoped user: anusmita_app
- Access: readWrite on anusmita database, restricted to ANUSMITA cluster
- Network Access list: empty at last check
- Application records: none present at last read; only admin and local system databases were listed

## Obtain the private password

The Atlas connector created anusmita_app with a server-generated password. No credential was committed to GitHub or printed in the project instructions. If you do not have the password:
1. Open Atlas -> ANUSMITA Commerce -> Security -> Database Access.
2. Edit user anusmita_app and reset its password using the dashboard.
3. Save it privately in a password manager, and copy it only into your local .env or host's secret manager.
4. If changing an existing password, update any running application secrets as well.

## Network access

Atlas -> ANUSMITA Commerce -> Security -> Network Access:
- For local testing, add the current trusted public IP of the computer running Node.js. This IP can change.
- For server hosting, follow the host's supported outbound-IP/security configuration.
- Do not add 0.0.0.0/0 as a permanent production access rule merely to bypass a connectivity error.
- No allowlist entry has been added automatically.

## Local verification (no customer orders)

1. Install Node.js 22 or later, clone GitHub repository and run npm install.
2. Copy .env.example to .env, which is gitignored.
3. Set MONGODB_URI to mongodb+srv://anusmita_app:<URL-ENCODED-PASSWORD>@anusmita.jvvjo1k.mongodb.net/anusmita?retryWrites=true&w=majority
4. URL-encode characters in the password: @ as %40, # as %23 and % as %25.
5. Set a strong independent SESSION_SECRET and OWNER_EMAIL / OWNER_PASSWORD privately.
6. Keep STORE_MODE=catalog and NEXT_PUBLIC_SITE_URL=http://localhost:3000 for local testing.
7. Run npm run db:doctor to ping Atlas and check counts without inserting data.
8. Only after the doctor succeeds, run npm run owner:create once to register the initial owner.
9. Run npm run dev, open /admin/login and inspect Launch Readiness.

The app intentionally refuses any database URI outside the approved ANUSMITA cluster, database and scoped username. Future cluster migrations must update this allowlist in the source code and be reviewed.

## Before public sales

Do not switch STORE_MODE to live until appropriate commercial hosting, HTTPS domain, secrets, database IP restrictions, tested backups, security review, approved payments/COD, courier workflow and real-device tests are completed.
Cloudinary's connector authentication is separate from the site's CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables.
GitHub CI build passing does not prove live payments, delivery integrations or backup recovery.
No production ANUSMITA website is deployed yet.

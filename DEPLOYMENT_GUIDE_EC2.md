# RareWolf ko AWS EC2 par deploy karna

Yeh guide RareWolf ke actual deployment ko samjhati hai: React/Vite frontend, Express/Node.js API, MongoDB Atlas, Nginx, PM2, AWS EC2 aur Hostinger domain. Ismein har step ke saath yeh bhi hai ki woh kyun kiya gaya, troubleshooting kaise hui, aur interview mein project ko kaise explain karna hai.

> **Security:** Is project ke asli MongoDB, Cloudinary aur SMTP credentials pehle chat mein share hue the. Unhe rotate karke naye values sirf EC2 ke `server/.env` mein rakhein. Token secrets bhi alag, random aur 32+ characters ke hon. Koi bhi `.env`, private key (`.pem`) ya password GitHub par commit na karein.

## 1. Architecture ko samjhein

```text
Browser
  |
  | https://rarewolf.online
  v
Hostinger DNS  -- A record -->  EC2 Elastic IP
                                      |
                                      v
                                  Nginx :80/:443
                                  /           \
                   static React files        /api/* reverse proxy
                   /var/www/rarewolf         |
                                              v
                                      Express API :8000
                                              |
                           +------------------+-----------------+
                           v                  v                 v
                      MongoDB Atlas       Cloudinary        Brevo SMTP
```

- **EC2** Ubuntu Linux virtual server hai jahan app chalti hai.
- **Nginx** public web server/reverse proxy hai. Yeh frontend files serve karta hai aur `/api/` requests Node API ko bhejta hai.
- **Node/Express API** port `8000` par local server ke taur par sunti hai. Security ke liye port `8000` ko public Security Group mein kholne ki zaroorat nahi.
- **PM2 + systemd** API ko background mein chalate aur reboot ke baad wapas start karte hain.
- **MongoDB Atlas**, **Cloudinary** aur **SMTP provider** managed external services hain; EC2 par database ya image storage nahi chal raha.
- **Hostinger DNS** domain ko EC2 ke stable Elastic IP tak le jata hai. **Let's Encrypt/Certbot** HTTPS certificate deta hai.

## 2. Local project ko GitHub par rakhna

Project folder mein pehle yeh dekhein:

```powershell
git status
git check-ignore -v server/.env client/.env
```

`.env`, `node_modules/` aur `client/dist/` Git mein nahi hone chahiye. `.env.example`, source code aur `package-lock.json` commit karne chahiye. `server/test/` project ke automated tests hain; use delete ya ignore karna zaroori nahi.

```powershell
git add .
git status
git commit -m "Initial RareWolf project"
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Line-ending warnings jaise `LF will be replaced by CRLF` Windows par aam taur par warnings hain, Git failure nahi.

## 3. AWS EC2 instance banana

1. AWS Console mein EC2 kholkar region chunein.
2. Ubuntu Server 24.04 LTS, 64-bit image select karein.
3. Instance type `t3.small` chuna gaya: 2 vCPU aur 2 GiB RAM. Yeh chhote initial workload ke liye theek starting point hai; traffic/build load badhe to metrics dekhkar resize karein.
4. Naya RSA `.pem` key pair download karke safe rakhein. Yeh SSH login key hai, GitHub par kabhi upload na ho.
5. Security Group inbound rules:

   | Port/type | Source | Kyun |
   | --- | --- | --- |
   | SSH 22 | My IP | Sirf apne computer se server administration |
   | HTTP 80 | `0.0.0.0/0` | Public web traffic aur certificate validation/redirect |
   | HTTPS 443 | `0.0.0.0/0` | Public encrypted website traffic |
   | Custom TCP 8000 | Public ke liye nahi | API ko Nginx ke local proxy se access karna hai |

   Ping chahiye to alag se ICMP rule add kar sakte hain. `nslookup` DNS lookup hai aur uske liye EC2 Security Group rule nahi chahiye.
6. Root EBS volume ke liye 20+ GiB rakhna practical hai; pehle instance mein 6.7 GiB root volume tha, jisme deploy/build ke baad 3.3 GiB use hua.
7. Instance start hone par **Elastic IP** allocate aur associate karein. Normal auto-assigned public IPv4 restart ke baad badal sakta hai; DNS ko stable IP chahiye.

AWS resource charges region aur usage ke hisaab se badalte hain. EC2, EBS storage aur public IPv4 ki current pricing/billing AWS Console mein check karein.

## 4. Windows se EC2 par SSH

PowerShell mein downloaded key ke path aur Elastic IP ke saath:

```powershell
ssh -i "C:\path\to\rarewolf-key.pem" ubuntu@ELASTIC_IP
```

First connection par host fingerprint confirmation aaye to verify karke `yes` likhein. EC2 ka `172.31.x.x` address private VPC IP hota hai; apne ghar ke computer se connect karne ke liye public IP/Elastic IP istemal hota hai.

## 5. Ubuntu packages, Node.js aur repository

Server par:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx git curl
```

Project Node.js 22 ke saath deploy hua. Node install hone ke baad check karein:

```bash
node -v
npm -v
```

GitHub se project clone karein:

```bash
cd ~
git clone https://github.com/USERNAME/REPOSITORY.git rarewolf
cd ~/rarewolf
```

> Agar EC2 par `package.json` aapke local project se match na kare, pehle GitHub repository/branch/commit theek karein. Is deployment mein pehle EC2 par purana/different package version tha. Frontend package mein Vite missing tha aur backend alag env variable names maang raha tha. Sahi source deploy karne ke baad local project ke `package.json` match hue.

## 6. MongoDB Atlas aur production API `.env`

Atlas mein database user banayein, EC2 Elastic IP ko Network Access list mein allow karein, aur application connection string lein. Database password URI mein special characters hon to URL-encode karna pad sakta hai.

EC2 par:

```bash
cd ~/rarewolf/server
nano .env
```

Production values ka format:

```dotenv
NODE_ENV=production
PORT=8000
MONGO_URL=YOUR_ATLAS_CONNECTION_STRING

ACCESS_TOKEN_SECRET=UNIQUE_RANDOM_SECRET_AT_LEAST_32_CHARS
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=DIFFERENT_UNIQUE_RANDOM_SECRET_AT_LEAST_32_CHARS
REFRESH_TOKEN_EXPIRES_IN=7d

CORS_ORIGIN=https://rarewolf.online
CLIENT_URL=https://rarewolf.online

CLOUDINARY_CLOUD_NAME=YOUR_VALUE
CLOUDINARY_API_KEY=YOUR_VALUE
CLOUDINARY_API_SECRET=YOUR_VALUE

SMTP_HOST=YOUR_SMTP_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=YOUR_SMTP_USER
SMTP_PASS=YOUR_SMTP_PASSWORD
SMTP_FROM=YOUR_VERIFIED_SENDER

# Optional: enable online checkout in addition to COD.
# Get both values from Razorpay Dashboard > Account & Settings > API Keys.
# Start with Test Mode credentials. Never use the Secret in client/.env.
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET

TRUST_PROXY_HOPS=1
```

If you do not have Razorpay credentials yet, leave both variables unset and checkout will continue to offer COD. Add both together and restart the API when you receive the Razorpay Key ID and Key Secret. After testing, replace the test pair with live keys from the activated Razorpay account.

`CORS_ORIGIN` exact browser origin hai (scheme + host, path nahi). Production validation ke mutabiq dono URL HTTPS hone chahiye aur token secrets alag/32+ characters. `nano` mein save: `Ctrl+O`, Enter; exit: `Ctrl+X`.

Local health check ke liye pehle API foreground mein start hui:

```bash
npm ci
npm start
```

Missing `package-lock.json` ke kaaran pehli baar `npm ci` fail hua tha. `npm install` ne lock file banayi aur dependencies install ki. Aage ke deploys mein lock files GitHub par hon to `npm ci` use karein.

API ne pehle configuration error diya kyunki production token secrets same aur chhote the. Do fresh values generate karne ka tareeqa:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Outputs ko alag env variables mein paste karein; unhe terminal screenshots/chat mein share na karein. MongoDB connect aur `server.listening` log aane par API start hai. Direct health test:

```bash
curl -i http://127.0.0.1:8000/api/v1/health
```

`HTTP/1.1 200 OK` ka matlab API aur database health endpoint ready hai.

## 7. Frontend production build

Client `.env` mein same-origin API path rakhein:

```dotenv
VITE_API_BASE_URL=/api/v1
```

Iska matlab browser API ko isi domain ke neeche request karega. Nginx `/api/` traffic backend tak bhejega. Client build:

```bash
cd ~/rarewolf/client
npm ci
npm run build
ls -la dist
```

`dist/index.html` aur `dist/assets/` production static files hain. `npm run build` ke waqt Vite ne large JS chunk warning aur npm audit vulnerabilities report ki. Build successful tha; vulnerabilities ko `npm audit` se review karein aur `npm audit fix` bina review ke production par na chalayein.

## 8. Nginx: frontend serve karna aur API proxy karna

Pehle Nginx `~/rarewolf/client/dist` se files serve kar raha tha, magar Nginx worker (`www-data`) ko `/home/ubuntu` ke andar traverse/read permission nahi mili. Error log mein `Permission denied` aur `/index.html` redirect cycle aayi. Home directory ko public permission dene ke bajay files Nginx web root mein copy ki gayi:

```bash
sudo mkdir -p /var/www/rarewolf
sudo cp -r ~/rarewolf/client/dist/. /var/www/rarewolf/
sudo chown -R www-data:www-data /var/www/rarewolf
```

Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/rarewolf
```

Relevant configuration ka example:

```nginx
server {
    listen 80;
    server_name rarewolf.online www.rarewolf.online;

    root /var/www/rarewolf;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- `root` Nginx ko React build ki jagah batata hai.
- `/api/` reverse proxy Express API tak request pahunchata hai.
- `try_files ... /index.html` React Router ke client-side paths (`/cart`, `/products`, etc.) ke liye SPA fallback hai.
- `X-Forwarded-*` original host/protocol/IP ki information backend ko deta hai.

Config syntax check aur reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` mein syntax successful ho, tabhi reload karein. Health endpoint direct `127.0.0.1:8000` par 200 tha; domain par 500 Nginx filesystem permissions ki wajah se aaya. Web root ko `/var/www/rarewolf` karne ke baad site chal padi.

Jab frontend dobara build ho, naye files copy karein aur ownership ensure karein:

```bash
sudo cp -r ~/rarewolf/client/dist/. /var/www/rarewolf/
sudo chown -R www-data:www-data /var/www/rarewolf
sudo systemctl reload nginx
```

## 9. Hostinger domain ko EC2 se connect karna

Hostinger hPanel → **Domains → rarewolf.online → DNS / Nameservers → DNS records**.

| Type | Host/Name | Target |
| --- | --- | --- |
| A | `@` | EC2 Elastic IP |
| CNAME | `www` | `rarewolf.online` |

Purane conflicting root `A`/`AAAA` ya `www` records ko update karein. Agar domain email chalata hai, MX/TXT records ko na hatayein. DNS check:

```powershell
nslookup rarewolf.online
```

Returned IP Elastic IP se match hona chahiye. `ping` ke liye Security Group mein ICMP allow karna optional hai; ping fail hona website down hone ka proof nahi. HTTPS test:

```powershell
curl.exe -I https://rarewolf.online
```

## 10. HTTPS certificate

Production auth cookies `Secure` hain, isliye website HTTPS par honi chahiye. Let's Encrypt certificate free hai; Nginx plugin se Certbot configure kar sakta hai. **Sirf agar certificate abhi configure nahi hua ho**, DNS EC2 par pahunchne aur ports 80/443 khule hone ke baad:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d rarewolf.online -d www.rarewolf.online
```

Certbot prompts follow karein aur HTTPS browser mein verify karein. Agar certificate pehle hi issue/configure hai to command dobara chalane ki zaroorat nahi.

## 11. PM2 ko reboot ke baad auto-start karna

Foregound `npm start` SSH terminal se juda hota hai; terminal/session band hone par API ruk sakti hai. PM2 app ko background mein manage karta hai; systemd boot par PM2 ko start karta hai.

```bash
cd ~/rarewolf/server
sudo npm install -g pm2
pm2 start src/server.js --name rarewolf-api
pm2 save
pm2 startup
```

`pm2 startup` ne yeh jaisi command print ki:

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Is output ki command chalayein, phir `pm2 save` dobara. Is deployment mein systemd unit enabled hone ke baad bhi `inactive` tha. Use manually start karne ki koshish tab fail hui kyunki PM2 daemon pehle se manual process mein tha. Saved process list rakhkar PM2 daemon ko cleanly systemd ke under lane ka sahi sequence:

```bash
pm2 save
pm2 kill
sudo systemctl reset-failed pm2-ubuntu
sudo systemctl start pm2-ubuntu
sudo systemctl status pm2-ubuntu --no-pager
pm2 status
```

Final successful state mein `pm2-ubuntu` **active (running)** aur `rarewolf-api` **online** aaye. `pm2 kill` app ko kuch seconds ke liye stop karta hai; systemd saved process list se dobara start karta hai. Status/log commands:

```bash
pm2 status
pm2 logs rarewolf-api --lines 50
sudo systemctl status pm2-ubuntu --no-pager
```

## 12. Deployment verification checklist

1. API local health: `curl -i http://127.0.0.1:8000/api/v1/health` → 200.
2. API domain health: `https://rarewolf.online/api/v1/health` → JSON success.
3. Website opens: `https://rarewolf.online`.
4. React deep route refresh works, e.g. `/products` or `/cart` (Nginx SPA fallback).
5. Signup, email verification, login, logout, refresh-cookie flow work.
6. Catalog loads from MongoDB and images from Cloudinary.
7. `pm2 status` says `online`; systemd service says `active`.
8. Security Group does not expose `8000` publicly.
9. `.env`/`.pem` are absent from GitHub; all exposed credentials have been rotated.

## 13. Resource usage aur logs

Server par current usage:

```bash
top                 # live CPU/processes; q se exit
free -h             # RAM used/available
df -h               # filesystem capacity
uptime              # load averages
pm2 monit           # PM2 apps ka live CPU/RAM
sudo du -xhd1 / 2>/dev/null | sort -h  # top-level folders ka disk use
```

Is deployment ke check par root disk 6.7 GB total, 3.3 GB used, 3.4 GB free (50%) thi. `/usr` 2.4 GB (OS/programs), `/var` 530 MB aur `/home` 393 MB tha; system folders ko manually delete na karein.

AWS EC2 → Instance → **Monitoring** mein CPU/network/status check metrics milte hain. EC2 default metrics guest RAM/disk filesystem percentage nahi dete. Unke CloudWatch graphs ke liye CloudWatch Agent install/configure chahiye; custom metrics ka charge ho sakta hai. Local quick check ke liye `free -h` aur `df -h` use karein.

## 14. Common errors aur unke matlab

| Error | Matlab | Fix/diagnosis |
| --- | --- | --- |
| `npm ci` lockfile error | Folder mein `package-lock.json` nahi | Local package lock GitHub par commit karein; first-time setup mein `npm install` se lock generate ho sakta hai |
| `vite: not found` | Wrong client source/package, missing Vite install, ya wrong dependencies | Confirm EC2 package.json local version jaisa ho; `npm ci`/`npm install`, phir build |
| Missing env variable startup error | `.env` variable names/values current code se match nahi | `server/src/config/env.js` aur `.env.example` se exact required names dekhein; secrets output share na karein |
| Production secret validation error | Token secrets same/too short | Do distinct random 32+ character values |
| Nginx `500` + `Permission denied` | Nginx user `/home/ubuntu/...` traverse/read nahi kar sakta | Build `dist` ko `/var/www/rarewolf` copy karein, `www-data` ownership dein, Nginx root update karein |
| `502 Bad Gateway` | Nginx upstream API se connect nahi kar pa raha | `pm2 status`, API health on `127.0.0.1:8000`, `proxy_pass`, PM2 logs check |
| `systemctl ... protocol` while PM2 online | PM2 daemon already manual session mein hai; systemd ko expected forking process/PID nahi mila | `pm2 save`, `pm2 kill`, failed state reset, systemd service start, status verify |
| `ping` fails | ICMP blocked ho sakta hai | Website/HTTPS separately test karein; ping optional hai |

## 15. Interview mein project ko kaise explain karein

### 30-second explanation

“Maine RareWolf full-stack commerce app Ubuntu EC2 par deploy ki. React/Vite frontend ko production `dist` build karke Nginx se serve kiya. Nginx same domain ke `/api/` requests ko Express API ke local port 8000 par reverse-proxy karta hai, isliye browser frontend aur API dono ko ek HTTPS origin se access karta hai. Node API PM2 mein chalti hai aur PM2 ko systemd se boot-time startup diya. MongoDB Atlas database, Cloudinary media aur SMTP email ke liye managed services hain. Hostinger DNS ka A record Elastic IP par point karta hai, aur HTTPS certificate Nginx ke saath configure hota hai.”

### “Nginx kyun?”

“Nginx public HTTP/HTTPS requests leta hai, static React files efficiently serve karta hai, React routes ke liye `index.html` fallback deta hai, aur `/api/` ko internal Node API tak proxy karta hai. Isse Node port internet par expose nahi karna padta aur frontend/API same domain use karte hain.”

### “PM2 aur systemd kyun?”

“PM2 Node process ko background mein rakhta hai, status/logs deta hai aur crash par restart kar sakta hai. `pm2 save` process list save karta hai; generated systemd service reboot par PM2 ko start karke saved apps resurrect karti hai.”

### “Troubleshooting ka example?”

“Domain par Nginx 500 aa raha tha, lekin API ka local health endpoint 200 de raha tha. Nginx error log mein `/home/ubuntu/.../dist/index.html` par permission denied mila. Maine build ko `/var/www/rarewolf` mein copy karke `www-data` owner diya aur Nginx root badla; website phir load hui.”

### “Security kaise handle ki?”

“SSH sirf apne IP tak restrict kiya, web ports 80/443 public rakhe, API ka 8000 port public nahi khola, secrets `.env` mein rakhe aur Git ignore kiya, production HTTPS aur secure auth cookies use ki. Agar secrets kahin expose ho jayein to unhe rotate karna chahiye.”

## 16. Future update ka routine

1. Local code change karke relevant `npm run build` aur checks chalayein.
2. `git add`, commit, push; ensure secrets/dist/node_modules stage na hon.
3. EC2 par `cd ~/rarewolf && git pull`.
4. API dependencies badli hon to `cd server && npm ci`; frontend ke liye `cd client && npm ci && npm run build`.
5. Build ko `/var/www/rarewolf` mein copy karke ownership update karein.
6. API code/env badla ho to `pm2 restart rarewolf-api`; `pm2 save`.
7. `sudo nginx -t && sudo systemctl reload nginx`; domain health aur UI check.


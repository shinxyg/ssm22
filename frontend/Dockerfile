FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["node", "-e", "const http=require('http'),fs=require('fs'),path=require('path');const root=path.join(process.cwd(),'dist');const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2'};const port=process.env.PORT||8080;http.createServer((req,res)=>{const cleanUrl=decodeURIComponent((req.url||'/').split('?')[0]);let filePath=path.join(root,cleanUrl==='/'?'index.html':cleanUrl);if(!filePath.startsWith(root)){res.writeHead(403);return res.end();}fs.stat(filePath,(err,stat)=>{if(err||!stat.isFile()){filePath=path.join(root,'index.html');}const ext=path.extname(filePath).toLowerCase();res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'});fs.createReadStream(filePath).pipe(res);});}).listen(port,'0.0.0.0',()=>console.log('Frontend listening on port '+port));"]

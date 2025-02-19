###
<h1 align="center">Sistem Penyewaan Alat</h1>

<br />
<br />

<div align="center">
    <img height="100" src="https://img.icons8.com/color/144/typescript.png" alt="typescript"/>
    <img height="100" src="https://img.icons8.com/?size=125&id=kg46nzoJrmTR&format=png&color=fffffe" alt="express-js"/>
    <img height="81" src="https://img.icons8.com/color/144/prisma-orm.png" alt="prisma-orm"/>
    <img height="82" src="https://www.hubql.com/_next/image?url=https%3A%2F%2Fassets.tina.io%2Fd9029970-7f85-4be6-9bb4-96e9db3a4a2b%2Fopenapi-wordmark-1%201.png&w=3840&q=75" alt="open-api"/>
</div>

<br />
<br />

<p align="center">Sistem penyewaan alat yang dibuat dengan typescript, express.js, dan prisma orm. Dokumentasi dibuat dengan Open Api Specs 3.0.0<p/>

<br />

## Manual Instalasi

Clone the repo:

```bash
git clone https://github.com/raangaaa/penyewaan.git
cd penyewaan
```

Install the dependencies:

```bash
npm install
```

Lihat environment variables:

```bash
cp .env.example .env
# open .env and modify the environment variables
```

Generate JWT RS256 key:

```bash
# Generate private key (RSA 2048-bit)
openssl genpkey -algorithm RSA -out storages/keys/private.pem

# Generate public key dari private key
openssl rsa -in private.pem -pubout -out storages/keys/public.pem

# encode base64
cat storages/keys/private.pem | base64 # edit JWT_TOKEN_SECRET_PRIVATE in .env
cat storages/keys/public.pem | base64 # edit JWT_TOKEN_SECRET_PUBLIC in .env
```

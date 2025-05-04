---
sidebar_position: 2
---

# 📦 Local Setup

### Clone Repository

```bash
git clone https://github.com/melifypublicrepo/melify.git
```

### Install Dependencies
```bash
cd melify

npm install
```

### Init MongoDb (Optionnal)

if you don't already have a mongodb instance running locally or self hosted, you can init it using melify init script

```bash
chmod +x ./db_init.sh
./db_init.sh
```

### Generate env files

You can do it manually but we recommand to execute our init script

```bash
chmod +x ./generate_env.sh
./generate_env.sh
```
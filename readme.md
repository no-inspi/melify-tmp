# Melify 📬

<div align="center">

![Melify Logo](https://img.shields.io/badge/Melify-Email%20Intelligence-blue?style=for-the-badge)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)

**An open-source email intelligence platform built to optimize how users interact with their inbox.**

[Features](#-features) •
[Architecture](#-architecture) •
[Getting Started](#-getting-started) •
[How It Works](#-how-it-works) •
[Contributing](#-contributing) •
[License](#-license)

</div>

---

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <h3>Email Management</h3>
      <ul>
        <li>✉️ Seamless Gmail integration via Gmail API</li>
        <li>⚡️ Real-time email push notifications via Google Cloud Pub/Sub</li>
        <li>🔄 Comprehensive draft & thread management</li>
      </ul>
    </td>
    <td width="50%">
      <h3>AI Capabilities</h3>
      <ul>
        <li>🧠 Intelligent categorization and summarization of emails</li>
        <li>💬 Email-aware chatbot using LangChain and vector search (<b>incoming</b>)</li>
        <li>🔍 Smart search and filtering</li>
        <li>📊 Insights and analytics on email patterns</li>
      </ul>
    </td>
  </tr>
  <!-- <tr>
    <td>
      <h3>Integration & Extensions</h3>
      <ul>
        <li>📅 Google Calendar integration (WIP)</li>
        <li>🔗 API hooks for third-party extensions</li>
        <li>🔄 Bidirectional sync with external tools</li>
      </ul>
    </td>
    <td>
      <h3>Developer Experience</h3>
      <ul>
        <li>🧪 Local and dev-ready setup using Docker and Kubernetes</li>
        <li>🚀 Modular architecture for easy extension</li>
        <li>🔒 Built-in support for authentication and role-based access</li>
      </ul>
    </td>
  </tr> -->
</table>

---

## 🏗 Architecture

Melify is built on a modern, scalable tech stack designed for performance and extensibility.

### Tech Stack

<table>
  <tr>
    <th>Layer</th>
    <th>Technologies</th>
  </tr>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>NextJs + Shadcn/ui (+MUI), Socket.IO Client</td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>NestJS (Node.js), MongoDB (via Mongoose), Gmail Auth</td>
  </tr>
  <tr>
    <td><strong>AI Workers</strong></td>
    <td>Python, LangChain, Pinecone/MongoDB Vector Search</td>
  </tr>
  <tr>
    <td><strong>Real-time</strong></td>
    <td>WebSockets with Socket.IO, Pub/Sub</td>
  </tr>
  <tr>
    <td><strong>Infrastructure</strong></td>
    <td>Azure VM, GCP (Cloud Functions, Pub/Sub)</td>
  </tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 18)
- Docker + Docker Compose
- Python 3.10+ (for AI worker)
- MongoDB
- GCP credentials (for Gmail API)
- Optional: Kubernetes + Argo Workflows (for advanced worker system)

### 1. Clone the Repository

```bash
git clone https://github.com/no-inspi/melify.git
cd melify
```

### 2. Setup Environment Variables

Create the following `.env` files:

<details>
<summary>Click to see required environment variables</summary>

**`frontend/.env`**

```
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
NEXT_PUBLIC_ASSET_URL=http://localhost:8000
NEXT_PUBLIC_CLIENT_ID=your_google_client_id
NEXT_CF_URL=http://localhost:8082
NEXT_PUBLIC_USE_TIPTAP=false
OPENAI_API_KEY=your_openai_key
```

**`backend/.env`**

```
FRONT_URL=http://localhost:3030
ENVIRONMENT_URL=http://localhost:8080
MONGODB_URI=mongodb://localhost:27017/melifydevelopment
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GMAIL_TOPIC_NAME=projects/your-project/topics/gmail
OPENAI_API_KEY=your_openai_key
```

**`functions/.env`**

```
MONGODB_URI=mongodb://localhost:27017/melify
OPENAI_API_KEY=your_openai_api_key  # or MISTRAL_API_KEY
PINECONE_API_KEY=your_pinecone_api_key
```

</details>

### 3. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Python Functions
cd ../functions
pip install -r requirements.txt
```

### 4. Start the Platform

**Using Docker Compose (Recommended)**

```bash
docker-compose up --build
```

**Or run manually**

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm start

# Terminal 3 - Python functions (AI logic)
cd functions
python main.py
```

Navigate to http://localhost:3030 to access the application.

---

## 🧠 How It Works

1. User authenticates with Google OAuth, granting access to their Gmail account.
2. Gmail push notifications trigger Google Cloud Function via Pub/Sub when new emails arrive.
3. The Cloud Function processes and saves email data to MongoDB.
4. Backend emits real-time updates using WebSockets to connected clients.
5. Emails are categorized and summarized by AI workers running in the background.
6. The chatbot retrieves and leverages context from vectorized emails to provide intelligent responses.

---

## 📦 Project Structure

```
melify/
├── frontend/         # React + Material UI application
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── utils/
│
├── backend/          # NestJS API server
│   ├── src/
│   │   ├── auth/
│   │   ├── email/
│   │   ├── user/
│   │   └── websockets/
│   └── test/
│
├── functions/        # Python functions
│   ├── gmail_handler/
│   ├── summarizer/
│   └── vectorizer/
│
├── k8s/              # Kubernetes manifests (optional)
│
├── docker-compose.yml
└── README.md
```

---

## ✍️ Contributing

We welcome contributions from the community! Here's how you can help:

- 🐛 **Report bugs**: Open an issue if you find a bug
- 💡 **Feature requests**: Suggest new features or improvements
- 🔧 **Code contributions**: Submit PRs to help solve issues or add features
- 📚 **Documentation**: Help improve or translate documentation
- 🧪 **Testing**: Add tests for important functionality

Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and process for submitting pull requests.

### Development Workflow

```bash
# Run linting
npm run lint

# Run tests
npm run test

# Run e2e tests
npm run test:e2e
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgments

- [Gmail API](https://developers.google.com/gmail/api)
- [Google Cloud Platform](https://cloud.google.com/)
- [LangChain](https://langchain.com/)
- [Pinecone](https://www.pinecone.io/)
- [MongoDB Vector Search](https://www.mongodb.com/atlas/vector-search)
- [OpenAI](https://openai.com/) / [Mistral AI](https://mistral.ai/)
- [NestJS](https://nestjs.com/)
- [React](https://reactjs.org/) + [Shadcn/ui](https://ui.shadcn.com/) + [Material UI](https://mui.com/)

---

<div align="center">

## 💬 Contact & Support

[![Twitter](https://img.shields.io/badge/Twitter-@yourhandle-blue?style=flat&logo=twitter)](https://twitter.com/yourhandle)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Your%20Name-blue?style=flat&logo=linkedin)](https://linkedin.com/in/yourname)
[![Website](https://img.shields.io/badge/Website-melify.io-blue?style=flat&logo=web)](https://melify.io)

[Report Bug](https://github.com/yourusername/melify/issues) · [Request Feature](https://github.com/yourusername/melify/issues)

</div>

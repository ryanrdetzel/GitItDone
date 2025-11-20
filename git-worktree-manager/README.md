# Git Worktree Manager

A modern web application for managing Git worktrees with an intuitive interface. Built with React, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- 📁 **Repository Selection**: Point to any Git repository on your system
- 🌿 **Branch Management**: View and switch between branches with a dropdown
- 🔀 **Worktree Management**:
  - View all worktrees associated with a repository
  - Create new worktrees from existing or new branches
  - Remove worktrees with a single click
- 🔄 **Real-time Updates**: Refresh repository information on demand
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**:
  - React 19
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui components
  - Lucide React icons

- **Backend**:
  - Node.js
  - Express
  - simple-git (Git operations)
  - TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd git-worktree-manager
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running the Application

You have two options:

#### Option 1: Run both frontend and backend together
```bash
pnpm run dev:all
```

#### Option 2: Run separately
In one terminal:
```bash
pnpm run server
```

In another terminal:
```bash
pnpm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Usage

1. **Select a Repository**:
   - Enter the full path to your Git repository (e.g., `/home/user/my-project`)
   - Click "Load Repository" or press Enter

2. **View Branches**:
   - All branches are displayed in a dropdown
   - The current branch is highlighted
   - Select a different branch to checkout

3. **Manage Worktrees**:
   - **Create**: Click "New Worktree" and provide:
     - Path for the new worktree
     - Branch name
     - Toggle "Create new branch" if you want to create a new branch
   - **View**: All worktrees are listed with their path, branch, and commit
   - **Remove**: Click the trash icon to remove a worktree

## API Endpoints

The backend provides the following endpoints:

- `POST /api/repo/info` - Get repository information
- `POST /api/repo/branches` - Get all branches
- `POST /api/repo/checkout` - Checkout a branch
- `POST /api/worktree/list` - List all worktrees
- `POST /api/worktree/add` - Create a new worktree
- `POST /api/worktree/remove` - Remove a worktree

## Project Structure

```
git-worktree-manager/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts       # API client
│   │   └── utils.ts     # Utility functions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── server/
│   └── index.ts         # Express backend server
├── package.json
└── README.md
```

## Development

### Building for Production

```bash
pnpm run build
```

### Linting

```bash
pnpm run lint
```

## License

MIT

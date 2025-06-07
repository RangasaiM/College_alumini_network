# College Alumni Network

A web application for connecting college students with alumni, facilitating mentorship, and sharing professional experiences.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git
- [Cursor](https://cursor.sh/) IDE

### Setup Instructions

1. Clone the repository:
```bash
git clone [your-repository-url]
cd college_alumini_network
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

## Collaboration Workflow

### 1. Setting up your development environment
- Install [Cursor](https://cursor.sh/) IDE
- Clone the repository using the instructions above
- Create a new branch for your feature

### 2. Branch Naming Convention
Use the following format for branch names:
- Feature: `feature/feature-name`
- Bug fix: `fix/bug-name`
- Documentation: `docs/what-you-documented`

### 3. Development Workflow
1. Before starting work:
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

2. Make your changes and commit regularly:
```bash
git add .
git commit -m "descriptive commit message"
```

3. Push your changes:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request on GitHub when your feature is ready

### 4. Code Review Process
- All changes must be made through Pull Requests
- At least one team member must review and approve before merging
- Keep PRs focused and reasonably sized

### 5. Best Practices
- Keep commits atomic and focused
- Write descriptive commit messages
- Update documentation when necessary
- Follow the existing code style
- Add comments for complex logic

## Project Structure

```
college_alumini_network/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utility functions and configurations
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Create a Pull Request
4. Wait for review and approval
5. Merge after approval

## Need Help?

Contact the project maintainers or create an issue on GitHub. 
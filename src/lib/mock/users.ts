export interface User {
  id: string
  email: string
  name: string | null
  registrationDate: Date
  workspaceCount: number
  lastLogin: Date | null
  status: 'active' | 'inactive'
  avatarUrl: string | null
}

export interface Workspace {
  id: string
  name: string
  createdAt: Date
  projectCount: number
  totalUsage: number // in tokens or API calls
}

export interface UserDetails extends User {
  workspaces: Workspace[]
  totalUsage: number
  totalProjects: number
}

const names = [
  'Sarah Johnson',
  'Alex Chen',
  'Michael Rodriguez',
  'Emily Davis',
  'David Kim',
  'Jessica Martinez',
  'Christopher Lee',
  'Amanda Wilson',
  'James Brown',
  'Lisa Anderson',
  'Robert Taylor',
  'Michelle White',
  'Daniel Moore',
  'Jennifer Garcia',
  'Matthew Jackson',
  'Nicole Harris',
  'Andrew Thompson',
  'Stephanie Clark',
  'Kevin Lewis',
  'Rachel Walker',
]

const workspaceNames = [
  'Acme Corp',
  'TechStart Inc',
  'Digital Solutions',
  'Innovation Labs',
  'Cloud Services',
  'Data Analytics Co',
  'Software Systems',
  'Web Development Hub',
  'Mobile Apps LLC',
  'Enterprise Solutions',
  'Startup Ventures',
  'Product Studio',
  'Design Agency',
  'Marketing Pro',
  'Consulting Group',
]

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateMockUsers(count: number = 15): User[] {
  const users: User[] = []
  const now = new Date()
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  for (let i = 0; i < count; i++) {
    const registrationDate = randomDate(oneYearAgo, now)
    const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))
    const lastLoginDaysAgo = Math.random() < 0.15 ? null : randomInt(0, Math.min(daysSinceRegistration, 30))
    const lastLogin = lastLoginDaysAgo === null ? null : new Date(now.getTime() - lastLoginDaysAgo * 24 * 60 * 60 * 1000)
    const isActive = lastLogin === null ? Math.random() < 0.3 : lastLoginDaysAgo < 30

    const name = randomElement(names)
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`

    users.push({
      id: `user-${i + 1}`,
      email,
      name,
      registrationDate,
      workspaceCount: randomInt(1, 5),
      lastLogin,
      status: isActive ? 'active' : 'inactive',
      avatarUrl: Math.random() < 0.3 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` : null,
    })
  }

  return users.sort((a, b) => b.registrationDate.getTime() - a.registrationDate.getTime())
}

export function generateMockWorkspaces(userId: string, count: number): Workspace[] {
  const workspaces: Workspace[] = []
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate(sixMonthsAgo, now)
    workspaces.push({
      id: `workspace-${userId}-${i + 1}`,
      name: randomElement(workspaceNames) + (i > 0 ? ` ${i + 1}` : ''),
      createdAt,
      projectCount: randomInt(1, 10),
      totalUsage: randomInt(1000, 50000),
    })
  }

  return workspaces
}

export function getUserDetails(user: User): UserDetails {
  const workspaces = generateMockWorkspaces(user.id, user.workspaceCount)
  const totalUsage = workspaces.reduce((sum, ws) => sum + ws.totalUsage, 0)
  const totalProjects = workspaces.reduce((sum, ws) => sum + ws.projectCount, 0)

  return {
    ...user,
    workspaces,
    totalUsage,
    totalProjects,
  }
}

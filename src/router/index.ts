import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    redirect: '/chat'
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/ChatView.vue')
  },
  {
    path: '/translate',
    name: 'translate',
    component: () => import('../views/TranslateView.vue')
  },
  {
    path: '/code',
    name: 'code',
    component: () => import('../views/CodeView.vue')
  },
  {
    path: '/writing',
    name: 'writing',
    component: () => import('../views/WritingView.vue')
  },
  {
    path: '/analysis',
    name: 'analysis',
    component: () => import('../views/AnalysisView.vue')
  },
  {
    path: '/agent',
    name: 'agent',
    component: () => import('../views/AgentView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

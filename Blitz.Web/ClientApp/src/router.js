import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/views/Home.vue'
import Projects from "@/views/Projects";
import Cronjobs from "@/views/Cronjobs";
import Project from "@/views/Project";
import Cronjob from "@/views/Cronjob";
import Execution from "@/views/Execution";

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/projects',
        name: 'projects',
        component: Projects
    },
    {
        path: '/projects/:id',
        name: 'project',
        component: Project
    },
    {
        path: '/cronjobs',
        name: 'cronjobs',
        component: Cronjobs
    },
    {
        path: '/cronjobs/:id',
        name: 'cronjob',
        component: Cronjob
    },
    {
        path: '/executions/:id',
        name: 'execution',
        component: Execution
    },
]

const router = new VueRouter({
    routes,
    mode: 'history'
})

export default router

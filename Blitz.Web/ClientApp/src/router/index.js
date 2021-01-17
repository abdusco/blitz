import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Projects from "@/views/Projects";
import Cronjobs from "@/views/Cronjobs";
import Executions from "@/views/Executions";

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
        path: '/cronjobs',
        name: 'cronjobs',
        component: Cronjobs
    },
    {
        path: '/executions',
        name: 'executions',
        component: Executions
    },
]

const router = new VueRouter({
    routes,
    mode: 'history'
})

export default router

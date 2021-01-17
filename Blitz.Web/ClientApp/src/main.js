import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import './main.scss'
import router from './router'

Vue.use(Buefy)

Vue.config.productionTip = false

new Vue({
    router,
    render: h => h(App)
}).$mount('#app')

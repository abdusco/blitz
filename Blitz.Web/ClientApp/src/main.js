import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import './main.scss'
import router from './router'

Vue.use(Buefy)

Vue.config.productionTip = false

Vue.mixin({
    data: {
        loading: false,
    },
    methods: {
        /**
         * @template T
         * @param {Promise<T>} cb
         * @return T */
        async $spin(cb) {
            this.loading = true;
            const loadingComponent = this.$buefy.loading.open({
                container: this.$refs.app
            })
            try {
                return await cb;
            } finally {
                loadingComponent.close();
                this.loading = false;
            }
        }
    }
});
new Vue({
    router,
    render: h => h(App),
}).$mount('#app')

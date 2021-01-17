import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import './main.scss'
import router from './router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime);
Vue.use(Buefy)

Vue.config.productionTip = false

Vue.mixin({
    data() {
        return {
            busy: false
        };
    },
    methods: {
        /**
         * @template T
         * @param {Promise<T>} cb
         * @return T */
        async $spin(cb) {
            this.busy = true;
            const loadingComponent = this.$buefy.loading.open({
                container: this.$refs.app
            })
            try {
                return await cb;
            } finally {
                loadingComponent.close();
                this.busy = false;
            }
        },
        /**
         * @param {Date} date
         * @return {string} */
        formatDate(date) {
            return dayjs(date).format('YYYY-MM-DD HH:mm');
        },
        humanizedDate(date) {
            return dayjs(date).fromNow();
        }
    }
});
Vue.directive('title', {
    inserted: (el, binding) => document.title = binding.value || 'blitz',
    update: (el, binding) => document.title = binding.value || 'blitz'
})

new Vue({
    router,
    render: h => h(App),
}).$mount('#app')

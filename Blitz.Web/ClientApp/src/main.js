import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import './main.scss'
import router from './router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'

dayjs.extend(relativeTime);
dayjs.extend(utc);

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
         * @param {Object} options
         * @param {boolean} options.seconds
         * @param {boolean} options.utc
         * @return {string} */
        formatDate(date, options = {seconds: false, utc: false}) {
            const format = options.seconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm';
            if (options.utc) {
                return dayjs.utc(date).format(format)
            }
            return dayjs.utc(date).local().format(format);
        },
        /**
         * @param {Date} date
         * @return {string} */
        humanizedDate(date) {
            return dayjs.utc(date).local().fromNow();
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

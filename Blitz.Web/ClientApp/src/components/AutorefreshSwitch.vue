<template>
  <span>
    <b class="is-4 mr-2">Autorefresh</b>
    <b-switch v-model="enabled" :disabled="disabled"></b-switch>
  </span>
</template>

<script>
export default {
  name: "AutorefreshSwitch",
  props: {
    onRefresh: Function,
    interval: Number,
    disabled: Boolean
  },
  data() {
    return {
      enabled: this.value,
      _interval: null,
    }
  },
  mounted() {
    if (this.enabled) {
      this.start();
    }
  },
  beforeDestroy() {
    this.stop();
  },
  methods: {
    start() {
      console.log(this.enabled, 'starting');
      this._interval = setInterval(() => {
        if (document.hidden) return;
        this.onRefresh();
      }, this.interval);
    },
    stop() {
      clearInterval(this._interval);
    }
  },
  watch: {
    value(yes) {
      console.log('value', yes);
      if (yes) {
        this.start();
      } else {
        this.stop();
      }
      this.$emit('input', yes);
    },
  }
}
</script>

<style scoped>

</style>
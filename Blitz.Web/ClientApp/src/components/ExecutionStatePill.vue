<template>
  <b v-if="state.state"
     class="tag is-light text--smallcaps"
     :class="{'is-danger': state.failed, 'is-success': state.finished, 'is-info': state.triggered}">{{ state.state }}</b>
  <b v-else class="tag is-light text--smallcaps">Never</b>
</template>

<script>
export default {
  name: "ExecutionStatePill",
  props: ['value'],
  computed: {
    state() {
      return {
        state: this.value,
        pending: this.value === 'pending',
        triggered: this.value === 'triggered',
        started: this.value === 'started',
        finished: this.value === 'finished',
        failed: this.value === 'failed',
      }
    }
  }
}
</script>

<style scoped>
.state {

}
</style>
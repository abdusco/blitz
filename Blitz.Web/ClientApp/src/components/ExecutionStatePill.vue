<template>
  <b v-if="state"
     class="tag is-light text--smallcaps"
     :class="{'is-danger': failed, 'is-success': finished, 'is-info': triggered}">{{ state }}</b>
  <b v-else class="tag is-light text--smallcaps">Never</b>
</template>

<script>
export default {
  name: "ExecutionStatePill",
  props: ['value'],
  data() {
    let state = this.value;
    return {
      state,
      pending: state === 'pending',
      triggered: state === 'triggered',
      started: state === 'started',
      finished: state === 'finished',
      failed: state === 'failed',
    }
  }
}
</script>

<style scoped>
.state {

}
</style>
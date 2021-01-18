<template>
  <b v-if="value"
     class="tag text--smallcaps is-rounded"
     :class="pillClass">{{ value }}</b>
  <b v-else class="tag is-light text--smallcaps">Never</b>
</template>

<script>
export default {
  name: "ExecutionStatePill",
  props: ['value'],
  computed: {
    pillClass() {
      return this.value || 'never';
    }
  }
}
</script>

<style scoped>
.tag {
  background-color: whitesmoke;
}

.never {
  color: red;
}

.pending {
  color: gray;
}

.triggered {
  color: #34495e;
}

.started {
  color: #1E88E5;
}

.finished {
  color: #2ecc71;
}

.failed {
  color: #e53935;
}
</style>